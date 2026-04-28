import process from 'node:process';

const apiBase = process.env.MU_API_BASE?.trim() || 'http://localhost:4000';
const timestamp = Date.now();
const professorUsername = process.env.MU_HARDENING_PROF_USERNAME?.trim() || `prof_hardening_${timestamp}`;
const professorPassword = process.env.MU_HARDENING_PROF_PASSWORD?.trim() || 'Hardening!Pass123';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createSession() {
  let cookieHeader = '';
  return {
    async request(path, init = {}) {
      const response = await fetch(`${apiBase}${path}`, {
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
    async requestJson(path, init = {}) {
      const response = await this.request(path, init);
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

async function expectOk(session, path, init = {}, label = path) {
  const { response, payload } = await session.requestJson(path, init);
  if (!response.ok || payload.ok === false) {
    const message = payload?.error?.message || payload?.message || `${response.status}`;
    throw new Error(`${label}: ${message}`);
  }
  return payload;
}

async function main() {
  const primary = createSession();
  const challenger = createSession();
  let originalPolicy = null;

  const health = await expectOk(primary, '/health');
  console.log(`health: ${health.data?.status ?? 'unknown'}`);

  const registerProf = await primary.requestJson('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: professorUsername, password: professorPassword, role: 'professor' })
  });
  if (!(registerProf.response.ok || registerProf.response.status === 409)) {
    const message = registerProf.payload?.error?.message || `status ${registerProf.response.status}`;
    throw new Error(`professor register failed: ${message}`);
  }

  await expectOk(primary, '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: professorUsername, password: professorPassword })
  }, 'professor login');
  console.log(`login: ${professorUsername}`);

  const policiesBefore = await expectOk(primary, '/governance/policies');
  const policy = policiesBefore.data?.policy;
  assert(policy, 'Expected governance policy payload.');

  originalPolicy = {
    idleTimeoutMinutes: Number(policy.idleTimeoutMinutes ?? 90),
    sessionAbsoluteTimeoutMinutes: Number(policy.sessionAbsoluteTimeoutMinutes ?? 720),
    loginThrottleWindowMinutes: Number(policy.loginThrottleWindowMinutes ?? 15),
    loginThrottleMaxFailures: Number(policy.loginThrottleMaxFailures ?? 5),
    localAuthEnabled: Boolean(policy.localAuthEnabled ?? true),
    passwordMinLength: Number(policy.passwordMinLength ?? 10),
    passwordRequireUppercase: Boolean(policy.passwordRequireUppercase ?? false),
    passwordRequireNumber: Boolean(policy.passwordRequireNumber ?? false),
    passwordRequireSymbol: Boolean(policy.passwordRequireSymbol ?? false),
    auditExportMaxRows: Number(policy.auditExportMaxRows ?? 2000),
    backupRetentionDays: Number(policy.backupRetentionDays ?? 30)
  };

  try {
    const tightened = {
      idleTimeoutMinutes: Math.max(15, Number(policy.idleTimeoutMinutes ?? 90)),
      sessionAbsoluteTimeoutMinutes: Math.max(30, Number(policy.sessionAbsoluteTimeoutMinutes ?? 720)),
      loginThrottleWindowMinutes: Math.max(1, Number(policy.loginThrottleWindowMinutes ?? 15)),
      loginThrottleMaxFailures: Math.max(1, Number(policy.loginThrottleMaxFailures ?? 5)),
      localAuthEnabled: true,
      passwordMinLength: Math.max(10, Number(policy.passwordMinLength ?? 10)),
      passwordRequireUppercase: true,
      passwordRequireNumber: true,
      passwordRequireSymbol: true,
      auditExportMaxRows: Math.max(100, Number(policy.auditExportMaxRows ?? 2000)),
      backupRetentionDays: Math.max(1, Number(policy.backupRetentionDays ?? 30))
    };

    const updatedPolicyEnv = await expectOk(primary, '/governance/policies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tightened)
    }, 'policy tighten');
    assert(updatedPolicyEnv.data?.policy?.passwordRequireSymbol === true, 'Expected updated governance password policy.');
    console.log('policy: tightened');

    const statusEnv = await expectOk(primary, '/governance/status');
    assert(statusEnv.data?.passwordPolicy?.requireSymbol === true, 'Expected governance status password policy to reflect updates.');
    assert(typeof statusEnv.data?.sessionAbsoluteTimeoutMinutes === 'number', 'Expected absolute session timeout in governance status.');
    console.log('governance status: includes hardening policy fields');

    const oidcReadinessEnv = await expectOk(primary, '/auth/oidc/readiness?probe=0');
    assert(oidcReadinessEnv.data?.readiness, 'Expected OIDC readiness payload.');
    console.log(`oidc readiness: enabled=${oidcReadinessEnv.data.readiness.enabled}`);

    const deploymentEnv = await expectOk(primary, '/deployment/validate');
    assert(Array.isArray(deploymentEnv.data?.issues), 'Expected deployment validation issues array.');
    assert(deploymentEnv.data?.oidcReadiness, 'Expected deployment validation OIDC readiness.');
    console.log(`deployment validate: ${deploymentEnv.data.issues.length} issue(s)`);

    const cutoverEnv = await expectOk(primary, '/deployment/cutover-check');
    assert(Array.isArray(cutoverEnv.data?.checks), 'Expected cutover checks array.');
    assert(typeof cutoverEnv.data?.readyForCutover === 'boolean', 'Expected cutover readiness boolean.');
    console.log(`cutover check: ${cutoverEnv.data.blockerCount} blocker(s), ${cutoverEnv.data.warningCount} warning(s)`);

    if (statusEnv.data?.oidcEnabled) {
      const disableLocalEnv = await expectOk(primary, '/governance/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tightened,
          localAuthEnabled: false
        })
      }, 'disable local auth');
      assert(disableLocalEnv.data?.policy?.localAuthEnabled === false, 'Expected local auth disabled when OIDC is enabled.');

      const deniedLogin = await challenger.requestJson('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: professorUsername, password: professorPassword })
      });
      assert(deniedLogin.response.status === 403, 'Expected local login to be blocked when local auth is disabled.');
      console.log('local auth disable gate: verified');
    } else {
      console.log('local auth disable gate: skipped (OIDC not configured)');
    }

    console.log('hardening e2e: passed');
  } finally {
    if (originalPolicy) {
      await expectOk(primary, '/governance/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(originalPolicy)
      }, 'restore original policy');
      console.log('policy: restored');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
