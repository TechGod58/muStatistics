import process from 'node:process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const apiBase = process.env.MU_API_BASE?.trim() || 'http://localhost:4000';
const rowCount = Math.max(500, Number.parseInt(process.env.MU_PERF_ROWS ?? '5000', 10) || 5000);
const thresholdsPath = path.resolve(process.cwd(), 'tests/performance/baseline-thresholds.json');
const logsDir = path.resolve(process.cwd(), '.logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createSession() {
  let cookieHeader = '';
  return {
    async request(pathname, init = {}) {
      const response = await fetch(`${apiBase}${pathname}`, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          ...(cookieHeader ? { cookie: cookieHeader } : {})
        }
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        cookieHeader = setCookie
          .split(',')
          .map((part) => part.split(';')[0]?.trim())
          .filter(Boolean)
          .join('; ');
      }
      return response;
    },
    async requestJson(pathname, init = {}) {
      const response = await this.request(pathname, init);
      const text = await response.text();
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { raw: text };
      }
      return { response, payload };
    }
  };
}

async function expectOk(session, pathname, init = {}, label = pathname) {
  const { response, payload } = await session.requestJson(pathname, init);
  if (!response.ok || payload.ok === false) {
    const message = payload?.error?.message || payload?.message || `${response.status}`;
    throw new Error(`${label}: ${message}`);
  }
  return payload;
}

function buildCsv(rows) {
  const lines = ['case_label,group,score_a,score_b,score_c'];
  for (let index = 1; index <= rows; index += 1) {
    const group = index % 2 === 0 ? 'A' : 'B';
    const scoreA = 50 + (index % 17);
    const scoreB = 45 + (index % 23);
    const scoreC = 55 + (index % 29);
    lines.push(`Case-${index},${group},${scoreA},${scoreB},${scoreC}`);
  }
  return lines.join('\n');
}

function loadThresholds() {
  try {
    const raw = readFileSync(thresholdsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.thresholds && typeof parsed.thresholds === 'object'
      ? parsed.thresholds
      : {};
  } catch {
    return {};
  }
}

async function measure(metrics, key, run) {
  const start = process.hrtime.bigint();
  const result = await run();
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;
  metrics[key] = Number(ms.toFixed(2));
  return result;
}

function findFieldKey(report, fragment) {
  const lowered = fragment.toLowerCase();
  const summary = (report?.summaries ?? []).find((item) => {
    const key = String(item?.key ?? '').toLowerCase();
    const label = String(item?.label ?? '').toLowerCase();
    return key.includes(lowered) || label.includes(lowered);
  });
  return summary?.key ?? null;
}

async function main() {
  const session = createSession();
  const user = `perf_${Date.now()}`;
  const password = 'Perf!Pass123';
  await session.requestJson('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password, role: 'student' })
  });
  await expectOk(session, '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password })
  }, 'login');

  const projectEnv = await expectOk(session, '/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Performance Baseline ${new Date().toISOString()}`,
      description: `Large-project baseline with ${rowCount} rows`,
      workspaceMode: 'solo'
    })
  });
  const projectId = projectEnv.data?.project?.id;
  assert(projectId, 'Expected project id for performance run.');

  const csv = buildCsv(rowCount);
  const importForm = new FormData();
  importForm.append('projectId', projectId);
  importForm.append('file', new Blob([csv], { type: 'text/csv' }), 'performance-dataset.csv');

  const metrics = {};
  await measure(metrics, 'import_csv_ms', async () => {
    const payload = await expectOk(session, '/imports/files', {
      method: 'POST',
      body: importForm
    }, 'import csv');
    assert((payload.data?.importedCount ?? 0) >= 1, 'Expected CSV import success.');
  });

  const descriptivesEnv = await measure(metrics, 'descriptives_ms', async () => {
    return expectOk(session, `/descriptives?projectId=${encodeURIComponent(projectId)}`);
  });
  const report = descriptivesEnv.data?.report;
  const groupField = findFieldKey(report, 'group');
  const scoreA = findFieldKey(report, 'score_a');
  const scoreB = findFieldKey(report, 'score_b');
  const scoreC = findFieldKey(report, 'score_c');
  assert(groupField && scoreA && scoreB && scoreC, 'Expected imported dataset fields in descriptives report.');

  await measure(metrics, 'compare_means_ms', async () => {
    await expectOk(session, '/compare-means', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        outcomeField: scoreA,
        groupField
      })
    }, 'compare means');
  });

  await measure(metrics, 'regression_ms', async () => {
    await expectOk(session, '/regression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        dependentField: scoreC,
        predictorFields: [scoreA, scoreB]
      })
    }, 'regression');
  });

  await measure(metrics, 't_test_ms', async () => {
    await expectOk(session, '/t-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        outcomeField: scoreB,
        groupField
      })
    }, 't-test');
  });

  const thresholds = loadThresholds();
  const violations = [];
  for (const [key, value] of Object.entries(metrics)) {
    const threshold = Number(thresholds[key] ?? 0);
    if (threshold > 0 && value > threshold) {
      violations.push({
        metric: key,
        measuredMs: value,
        thresholdMs: threshold
      });
    }
  }

  mkdirSync(logsDir, { recursive: true });
  const outputPath = path.join(logsDir, `performance-baseline-${timestamp}.json`);
  const output = {
    generatedAt: new Date().toISOString(),
    apiBase,
    projectId,
    rowCount,
    metrics,
    thresholds,
    violations,
    ready: violations.length === 0
  };
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`performance baseline: rows=${rowCount}`);
  Object.entries(metrics).forEach(([key, value]) => {
    console.log(`  ${key}: ${value} ms`);
  });
  console.log(`report: ${outputPath}`);
  if (violations.length > 0) {
    throw new Error(`Performance threshold violation(s): ${violations.map((item) => `${item.metric} (${item.measuredMs} > ${item.thresholdMs})`).join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
