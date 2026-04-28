import process from 'node:process';
import { spawn } from 'node:child_process';

const apiBase = process.env.MU_API_BASE?.trim() || 'http://localhost:4000';
const apiHealthUrl = `${apiBase.replace(/\/+$/, '')}/health`;
const maxWaitMs = Math.max(10_000, Number.parseInt(process.env.MU_PERF_GATE_MAX_WAIT_MS ?? '90000', 10) || 90_000);
const pollMs = Math.max(500, Number.parseInt(process.env.MU_PERF_GATE_POLL_MS ?? '2000', 10) || 2_000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApi() {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= maxWaitMs) {
    try {
      const response = await fetch(apiHealthUrl, { signal: AbortSignal.timeout(4_000) });
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }
    await sleep(pollMs);
  }
  throw new Error(`API health check did not become ready within ${maxWaitMs}ms (${apiHealthUrl}).`);
}

function runNodeScript(scriptPath, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...extraEnv
      },
      stdio: 'inherit'
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${scriptPath} failed (code ${code ?? 'null'}, signal ${signal ?? 'none'}).`));
    });
  });
}

async function main() {
  console.log(`perf gate: waiting for API at ${apiHealthUrl}`);
  await waitForApi();
  console.log('perf gate: API is reachable; running baseline checks');
  await runNodeScript('./scripts/perf-large-project-baseline.mjs', { MU_PERF_LOCK_BASELINE: '0' });
  console.log('perf gate: running university SLO checks');
  await runNodeScript('./scripts/perf-university-load.mjs', { MU_PERF_LOCK_BASELINE: '0' });
  console.log('perf gate: PASS (no perf/SLO regressions detected).');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

