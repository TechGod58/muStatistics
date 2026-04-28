import process from 'node:process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const apiBase = process.env.MU_API_BASE?.trim() || 'http://localhost:4000';
const profilesPath = path.resolve(process.cwd(), 'tests/performance/university-load-profiles.json');
const baselinesPath = path.resolve(process.cwd(), 'tests/performance/university-slo-baselines.json');
const logsDir = path.resolve(process.cwd(), '.logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const lockBaseline = ['1', 'true', 'yes'].includes(String(process.env.MU_PERF_LOCK_BASELINE ?? '').toLowerCase());
const selectedProfileIds = String(process.env.MU_PERF_PROFILE ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const durationToleranceMs = Math.max(0, Number.parseFloat(process.env.MU_PERF_DURATION_TOLERANCE_MS ?? '50') || 50);
const latencyToleranceMs = Math.max(0, Number.parseFloat(process.env.MU_PERF_LATENCY_TOLERANCE_MS ?? '2') || 2);
const throughputToleranceOps = Math.max(0, Number.parseFloat(process.env.MU_PERF_THROUGHPUT_TOLERANCE ?? '0.05') || 0.05);
const errorRateTolerance = Math.max(0, Number.parseFloat(process.env.MU_PERF_ERROR_RATE_TOLERANCE ?? '0') || 0);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function nowMs() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const rank = (p / 100) * (sortedValues.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  if (lowerIndex === upperIndex) return sortedValues[lowerIndex];
  const lower = sortedValues[lowerIndex];
  const upper = sortedValues[upperIndex];
  const weight = rank - lowerIndex;
  return lower + (upper - lower) * weight;
}

function summarize(values) {
  if (values.length === 0) {
    return { count: 0, minMs: 0, meanMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, item) => sum + item, 0);
  return {
    count: sorted.length,
    minMs: Number(sorted[0].toFixed(2)),
    meanMs: Number((total / sorted.length).toFixed(2)),
    p50Ms: Number(percentile(sorted, 50).toFixed(2)),
    p95Ms: Number(percentile(sorted, 95).toFixed(2)),
    p99Ms: Number(percentile(sorted, 99).toFixed(2)),
    maxMs: Number(sorted[sorted.length - 1].toFixed(2))
  };
}

function roundUp(value) {
  return Math.max(1, Math.ceil(Number(value) || 0));
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
  const lines = ['case_label,group,cohort,score_a,score_b,score_c'];
  const cohorts = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
  for (let index = 1; index <= rows; index += 1) {
    const group = index % 2 === 0 ? 'A' : 'B';
    const cohort = cohorts[index % cohorts.length];
    const scoreA = 45 + (index % 31);
    const scoreB = 40 + (index % 37);
    const scoreC = 50 + (index % 43);
    lines.push(`Case-${index},${group},${cohort},${scoreA},${scoreB},${scoreC}`);
  }
  return lines.join('\n');
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

async function provisionVirtualUser(profile, index) {
  const session = createSession();
  const username = `perf_${profile.id}_${Date.now()}_${index}`;
  const password = 'Perf!Pass123';

  await session.requestJson('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role: 'student' })
  });
  await expectOk(session, '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }, `login user ${index}`);

  const projectEnv = await expectOk(session, '/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Perf ${profile.id} User ${index}`,
      description: `University load profile ${profile.id}`,
      workspaceMode: 'solo'
    })
  }, `create project user ${index}`);
  const projectId = projectEnv.data?.project?.id;
  assert(projectId, `Expected project id for virtual user ${index}.`);

  const csv = buildCsv(profile.rowCount);
  const importForm = new FormData();
  importForm.append('projectId', projectId);
  importForm.append('file', new Blob([csv], { type: 'text/csv' }), `perf-${profile.id}-${index}.csv`);
  await expectOk(session, '/imports/files', {
    method: 'POST',
    body: importForm
  }, `import csv user ${index}`);

  const descriptiveEnv = await expectOk(
    session,
    `/descriptives?projectId=${encodeURIComponent(projectId)}`,
    {},
    `descriptives bootstrap user ${index}`
  );
  const report = descriptiveEnv.data?.report;
  const groupField = findFieldKey(report, 'group');
  const cohortField = findFieldKey(report, 'cohort');
  const scoreA = findFieldKey(report, 'score_a');
  const scoreB = findFieldKey(report, 'score_b');
  const scoreC = findFieldKey(report, 'score_c');
  assert(groupField && cohortField && scoreA && scoreB && scoreC, `Expected imported field keys for user ${index}.`);

  return {
    session,
    projectId,
    fields: { groupField, cohortField, scoreA, scoreB, scoreC }
  };
}

function createOperationRunner(profile) {
  return {
    async descriptives(context) {
      await expectOk(context.session, `/descriptives?projectId=${encodeURIComponent(context.projectId)}`, {}, 'descriptives');
    },
    async crosstabs(context) {
      const query = new URLSearchParams({
        projectId: context.projectId,
        rowField: context.fields.groupField,
        columnField: context.fields.cohortField
      });
      await expectOk(context.session, `/crosstabs?${query.toString()}`, {}, 'crosstabs');
    },
    async compare_means(context) {
      await expectOk(context.session, '/compare-means', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: context.projectId,
          outcomeField: context.fields.scoreA,
          groupField: context.fields.groupField
        })
      }, 'compare means');
    },
    async regression(context) {
      await expectOk(context.session, '/regression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: context.projectId,
          dependentField: context.fields.scoreC,
          predictorFields: [context.fields.scoreA, context.fields.scoreB]
        })
      }, 'regression');
    },
    async t_tests(context) {
      await expectOk(context.session, '/t-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: context.projectId,
          outcomeField: context.fields.scoreB,
          groupField: context.fields.groupField
        })
      }, 't-tests');
    },
    async presence_ping(context) {
      await expectOk(context.session, '/presence/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: context.projectId })
      }, 'presence ping');
    },
    async project_message_post(context) {
      await expectOk(context.session, '/project-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: context.projectId,
          body: `Perf profile ${profile.id} check ${Date.now()}`
        })
      }, 'message post');
    },
    async project_message_get(context) {
      const query = new URLSearchParams({
        projectId: context.projectId,
        limit: '25'
      });
      await expectOk(context.session, `/project-messages?${query.toString()}`, {}, 'message get');
    }
  };
}

async function createUsersInBatches(profile) {
  const contexts = [];
  const batchSize = Math.max(1, Number(profile.provisionBatchSize ?? 10) || 10);
  for (let index = 0; index < profile.virtualUsers; index += batchSize) {
    const tasks = [];
    const upper = Math.min(profile.virtualUsers, index + batchSize);
    for (let cursor = index; cursor < upper; cursor += 1) {
      tasks.push(provisionVirtualUser(profile, cursor + 1));
    }
    const result = await Promise.all(tasks);
    contexts.push(...result);
  }
  return contexts;
}

function evaluateSlo(profileId, profileResult, baseline) {
  const failures = [];
  if (!baseline) {
    failures.push({
      metric: 'baseline',
      measured: 'missing',
      expected: 'profile baseline exists'
    });
    return failures;
  }

  if (
    typeof baseline.maxDurationMs === 'number'
    && profileResult.durationMs > baseline.maxDurationMs + durationToleranceMs
  ) {
    failures.push({
      metric: 'maxDurationMs',
      measured: profileResult.durationMs,
      expected: baseline.maxDurationMs
    });
  }
  if (
    typeof baseline.maxErrorRate === 'number'
    && profileResult.errorRate > baseline.maxErrorRate + errorRateTolerance
  ) {
    failures.push({
      metric: 'maxErrorRate',
      measured: profileResult.errorRate,
      expected: baseline.maxErrorRate
    });
  }
  if (
    typeof baseline.minThroughputOpsPerSec === 'number'
    && profileResult.throughputOpsPerSec < baseline.minThroughputOpsPerSec - throughputToleranceOps
  ) {
    failures.push({
      metric: 'minThroughputOpsPerSec',
      measured: profileResult.throughputOpsPerSec,
      expected: baseline.minThroughputOpsPerSec
    });
  }

  const operationBaselines = baseline.operations ?? {};
  for (const [operationName, constraints] of Object.entries(operationBaselines)) {
    const measured = profileResult.operations?.[operationName];
    if (!measured) {
      failures.push({
        metric: `${operationName}.available`,
        measured: 'missing',
        expected: 'operation summary present'
      });
      continue;
    }
    if (typeof constraints.p95Ms === 'number' && measured.p95Ms > constraints.p95Ms + latencyToleranceMs) {
      failures.push({
        metric: `${operationName}.p95Ms`,
        measured: measured.p95Ms,
        expected: constraints.p95Ms
      });
    }
    if (typeof constraints.maxMs === 'number' && measured.maxMs > constraints.maxMs + latencyToleranceMs) {
      failures.push({
        metric: `${operationName}.maxMs`,
        measured: measured.maxMs,
        expected: constraints.maxMs
      });
    }
  }

  return failures;
}

function deriveBaselineFromResult(profileResult) {
  const operations = {};
  for (const [operationName, stats] of Object.entries(profileResult.operations ?? {})) {
    operations[operationName] = {
      p95Ms: roundUp(stats.p95Ms * 1.35),
      maxMs: roundUp(stats.maxMs * 1.6)
    };
  }
  return {
    maxDurationMs: roundUp(profileResult.durationMs * 1.35),
    maxErrorRate: Number(Math.max(0.01, profileResult.errorRate * 2).toFixed(4)),
    minThroughputOpsPerSec: Number(Math.max(0.1, profileResult.throughputOpsPerSec * 0.75).toFixed(2)),
    operations
  };
}

async function runProfile(profile) {
  const operationRunner = createOperationRunner(profile);
  const latencies = {};
  const errors = [];
  let totalOperations = 0;

  const provisionStart = nowMs();
  const contexts = await createUsersInBatches(profile);
  const provisionMs = Number((nowMs() - provisionStart).toFixed(2));

  const runStart = nowMs();
  await Promise.all(
    contexts.map(async (context, userIndex) => {
      for (let iteration = 0; iteration < profile.iterations; iteration += 1) {
        for (const operationName of profile.operations) {
          const operation = operationRunner[operationName];
          if (typeof operation !== 'function') {
            errors.push({
              user: userIndex + 1,
              iteration: iteration + 1,
              operation: operationName,
              message: `Unknown operation: ${operationName}`
            });
            continue;
          }
          const start = nowMs();
          try {
            await operation(context);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push({
              user: userIndex + 1,
              iteration: iteration + 1,
              operation: operationName,
              message
            });
          } finally {
            const duration = Number((nowMs() - start).toFixed(2));
            latencies[operationName] = latencies[operationName] ?? [];
            latencies[operationName].push(duration);
            totalOperations += 1;
          }
        }
        if ((profile.thinkTimeMs ?? 0) > 0) {
          await sleep(profile.thinkTimeMs);
        }
      }
    })
  );
  const runDurationMs = Number((nowMs() - runStart).toFixed(2));

  const operationSummary = {};
  for (const [operationName, values] of Object.entries(latencies)) {
    operationSummary[operationName] = summarize(values);
  }

  const totalErrors = errors.length;
  const errorRate = totalOperations === 0 ? 1 : Number((totalErrors / totalOperations).toFixed(4));
  const throughput = runDurationMs <= 0 ? 0 : Number((totalOperations / (runDurationMs / 1000)).toFixed(2));

  return {
    profile: profile.id,
    description: profile.description,
    virtualUsers: profile.virtualUsers,
    rowCount: profile.rowCount,
    iterations: profile.iterations,
    operationsSequence: profile.operations,
    provisioningMs: provisionMs,
    durationMs: runDurationMs,
    totalOperations,
    totalErrors,
    errorRate,
    throughputOpsPerSec: throughput,
    operations: operationSummary,
    sampleErrors: errors.slice(0, 20)
  };
}

function loadProfiles() {
  const payload = readJson(profilesPath);
  const profiles = Array.isArray(payload?.profiles) ? payload.profiles : [];
  const normalized = profiles.map((profile) => ({
    id: String(profile.id ?? '').trim(),
    description: String(profile.description ?? '').trim(),
    virtualUsers: Math.max(1, Number.parseInt(String(profile.virtualUsers ?? '1'), 10) || 1),
    rowCount: Math.max(500, Number.parseInt(String(profile.rowCount ?? '5000'), 10) || 5000),
    iterations: Math.max(1, Number.parseInt(String(profile.iterations ?? '1'), 10) || 1),
    thinkTimeMs: Math.max(0, Number.parseInt(String(profile.thinkTimeMs ?? '0'), 10) || 0),
    provisionBatchSize: Math.max(1, Number.parseInt(String(profile.provisionBatchSize ?? '10'), 10) || 10),
    operations: Array.isArray(profile.operations)
      ? profile.operations.map((item) => String(item ?? '').trim()).filter(Boolean)
      : ['descriptives', 'compare_means', 'regression', 't_tests']
  })).filter((profile) => profile.id && profile.operations.length > 0);
  return normalized;
}

function loadBaselines() {
  try {
    const payload = readJson(baselinesPath);
    return payload?.profiles && typeof payload.profiles === 'object' ? payload : { version: 1, profiles: {} };
  } catch {
    return { version: 1, profiles: {} };
  }
}

async function main() {
  const profiles = loadProfiles();
  assert(profiles.length > 0, 'No performance profiles found.');

  const selected = selectedProfileIds.length > 0
    ? profiles.filter((profile) => selectedProfileIds.includes(profile.id))
    : profiles;
  assert(selected.length > 0, `No matching profiles found for MU_PERF_PROFILE=${selectedProfileIds.join(',') || '(none)'}.`);

  const baselinePayload = loadBaselines();
  const reports = [];
  const violations = [];

  for (const profile of selected) {
    console.log(`profile start: ${profile.id} users=${profile.virtualUsers} rows=${profile.rowCount}`);
    const report = await runProfile(profile);
    const baseline = baselinePayload.profiles?.[profile.id];
    const profileViolations = evaluateSlo(profile.id, report, baseline);
    reports.push({
      ...report,
      baseline: baseline ?? null,
      ready: profileViolations.length === 0,
      violations: profileViolations
    });
    violations.push(...profileViolations.map((item) => ({ profile: profile.id, ...item })));
    console.log(
      `profile done: ${profile.id} duration=${report.durationMs}ms errorRate=${report.errorRate} throughput=${report.throughputOpsPerSec} ops/s`
    );
  }

  if (lockBaseline) {
    for (const report of reports) {
      baselinePayload.profiles = baselinePayload.profiles ?? {};
      baselinePayload.profiles[report.profile] = deriveBaselineFromResult(report);
    }
    baselinePayload.version = Number(baselinePayload.version ?? 1);
    baselinePayload.lockedAt = new Date().toISOString();
    baselinePayload.lockedBy = 'scripts/perf-university-load.mjs';
    writeFileSync(baselinesPath, `${JSON.stringify(baselinePayload, null, 2)}\n`, 'utf8');
    console.log(`SLO baseline lock updated: ${baselinesPath}`);
  }

  mkdirSync(logsDir, { recursive: true });
  const outputPath = path.join(logsDir, `university-load-${timestamp}.json`);
  const output = {
    generatedAt: new Date().toISOString(),
    apiBase,
    profileSelection: selected.map((item) => item.id),
    lockBaseline,
    tolerances: {
      durationToleranceMs,
      latencyToleranceMs,
      throughputToleranceOps,
      errorRateTolerance
    },
    results: reports,
    violations,
    ready: violations.length === 0
  };
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`report: ${outputPath}`);
  if (violations.length > 0 && lockBaseline) {
    console.log('baseline lock mode: previous SLO violations were recorded and baseline values were refreshed from this run.');
  }
  if (violations.length > 0 && !lockBaseline) {
    const summary = violations.map((item) => `${item.profile}:${item.metric} (${item.measured} vs ${item.expected})`).join(', ');
    throw new Error(`University SLO violation(s): ${summary}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
