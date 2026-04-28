import process from 'node:process';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const apiBase = process.env.MU_API_BASE?.trim() || 'http://localhost:4000';
const logsDir = path.resolve(process.cwd(), '.logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const studentUsername = 'Peter';
const studentPassword = 'Statistics!';
const collaboratorUsername = process.env.MU_COLLAB_USERNAME?.trim() || 'student_collab_online';
const collaboratorPassword = process.env.MU_COLLAB_PASSWORD?.trim() || 'Statistics!2';
let resolvedStudentPassword = studentPassword;

const onlineData = {
  tipsCsv: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/tips.csv',
  irisCsv: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv',
  aliceTxt: 'https://www.gutenberg.org/files/11/11-0.txt',
  dummyPdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseEnvFile(filePath) {
  try {
    const contents = readFileSync(filePath, 'utf8');
    const values = {};
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      values[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return values;
  } catch {
    return {};
  }
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

async function ensureUser(username, password, role = 'student') {
  const session = createSession();
  const firstLogin = await session.requestJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (firstLogin.response.ok && firstLogin.payload?.ok !== false) {
    return { session, passwordUsed: password, created: false };
  }

  const temp = createSession();
  const registerEnv = await temp.requestJson('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  });
  if (registerEnv.response.ok) {
    await expectOk(session, '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }, `login ${username}`);
    return { session, passwordUsed: password, created: true };
  }
  if (registerEnv.response.status === 409) {
    throw new Error(`User ${username} already exists and login failed with provided password.`);
  }

  const registerMessage = registerEnv.payload?.error?.message || registerEnv.payload?.message || '';
  if (username === studentUsername && /at least one number/i.test(registerMessage)) {
    const fallbackPassword = `${password}1`;
    const fallbackRegister = await temp.requestJson('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: fallbackPassword, role })
    });
    if (!(fallbackRegister.response.ok || fallbackRegister.response.status === 409)) {
      const fallbackMessage = fallbackRegister.payload?.error?.message || fallbackRegister.payload?.message || `status ${fallbackRegister.response.status}`;
      throw new Error(`register ${username} fallback failed: ${fallbackMessage}`);
    }
    await expectOk(session, '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: fallbackPassword })
    }, `login ${username} fallback`);
    return { session, passwordUsed: fallbackPassword, created: true };
  }

  throw new Error(`register ${username}: ${registerMessage || registerEnv.response.status}`);
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

async function downloadOnlineFixtures() {
  const [tipsRes, irisRes, aliceRes, pdfRes] = await Promise.all([
    fetch(onlineData.tipsCsv),
    fetch(onlineData.irisCsv),
    fetch(onlineData.aliceTxt),
    fetch(onlineData.dummyPdf)
  ]);
  if (!tipsRes.ok || !irisRes.ok || !aliceRes.ok || !pdfRes.ok) {
    throw new Error('Unable to download one or more online fixtures.');
  }
  const tipsCsv = await tipsRes.text();
  const irisCsv = await irisRes.text();
  const aliceRaw = await aliceRes.text();
  const dummyPdf = await pdfRes.arrayBuffer();
  const aliceTrimmed = aliceRaw.slice(0, 18000);
  return { tipsCsv, irisCsv, aliceTrimmed, dummyPdf: new Uint8Array(dummyPdf) };
}

function parseDatabaseUrl() {
  const env = {
    ...parseEnvFile(path.resolve(process.cwd(), '.env')),
    ...parseEnvFile(path.resolve(process.cwd(), 'apps/api/.env')),
    ...process.env
  };
  const raw = String(env.DATABASE_URL ?? '').trim();
  if (!raw) throw new Error('DATABASE_URL is required for SQL integration checks.');
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 5432,
    user: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname.replace(/^\//, '')
  };
}

function resolvePsqlBinary() {
  const candidates = [
    'psql',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe'
  ];
  for (const candidate of candidates) {
    try {
      if (candidate.includes(':') && !existsSync(candidate)) continue;
      execFileSync(candidate, ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8'
      });
      return candidate;
    } catch {
      // Try next candidate.
    }
  }
  throw new Error('psql binary not found. Install PostgreSQL client tools or add psql to PATH.');
}

function runPsql(connection, database, sql) {
  const psqlBinary = resolvePsqlBinary();
  execFileSync(psqlBinary, [
    '-h',
    connection.host,
    '-p',
    String(connection.port),
    '-U',
    connection.user,
    '-d',
    database,
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    sql
  ], {
    env: {
      ...process.env,
      PGPASSWORD: connection.password
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  });
}

function runPsqlFileCopy(connection, database, sqlMetaCommand) {
  const psqlBinary = resolvePsqlBinary();
  execFileSync(psqlBinary, [
    '-h',
    connection.host,
    '-p',
    String(connection.port),
    '-U',
    connection.user,
    '-d',
    database,
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    sqlMetaCommand
  ], {
    env: {
      ...process.env,
      PGPASSWORD: connection.password
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  });
}

function setupOnlineSqlFixture(tipsCsv) {
  const connection = parseDatabaseUrl();
  assert(connection.user && connection.password, 'DATABASE_URL must include username/password for SQL fixture setup.');
  mkdirSync(logsDir, { recursive: true });
  const csvPath = path.join(logsDir, `online-tips-${timestamp}.csv`);
  writeFileSync(csvPath, tipsCsv, 'utf8');

  const targetDb = 'mu_online_sql_test';
  try {
    runPsql(connection, connection.database, `DROP DATABASE IF EXISTS "${targetDb}";`);
    runPsql(connection, connection.database, `CREATE DATABASE "${targetDb}";`);
  } catch {
    // Fall back to app database if create/drop privileges are unavailable.
  }

  const useDatabase = (() => {
    try {
      runPsql(connection, targetDb, 'SELECT 1;');
      return targetDb;
    } catch {
      return connection.database;
    }
  })();

  const schemaName = useDatabase === targetDb ? 'public' : 'online_sql_test';
  const tableName = 'online_tips';
  runPsql(connection, useDatabase, `CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
  runPsql(connection, useDatabase, `
    DROP TABLE IF EXISTS "${schemaName}"."${tableName}";
    CREATE TABLE "${schemaName}"."${tableName}" (
      row_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      total_bill DOUBLE PRECISION,
      tip DOUBLE PRECISION,
      sex TEXT,
      smoker TEXT,
      day TEXT,
      time TEXT,
      size INTEGER
    );
  `);
  const normalizedPath = csvPath.replace(/\\/g, '/').replace(/'/g, "''");
  runPsqlFileCopy(
    connection,
    useDatabase,
    `\\copy "${schemaName}"."${tableName}" (total_bill, tip, sex, smoker, day, time, size) FROM '${normalizedPath}' WITH (FORMAT csv, HEADER true)`
  );

  return {
    connection: {
      host: connection.host,
      port: connection.port,
      database: useDatabase,
      user: connection.user,
      password: connection.password,
      ssl: false
    },
    schemaName,
    tableName
  };
}

async function main() {
  const checks = [];
  let projectId = '';
  let codeId = '';
  let sourceId = '';
  let caseId = '';
  let tipsFieldMap = {};
  let sessions = { student: null, collaborator: null };
  let sqlFixture = null;

  async function runCheck(name, fn) {
    const start = Date.now();
    try {
      const details = await fn();
      const durationMs = Date.now() - start;
      checks.push({ name, status: 'pass', durationMs, details: details ?? '' });
      console.log(`PASS ${checks.length}. ${name} (${durationMs} ms)${details ? ` - ${details}` : ''}`);
    } catch (error) {
      const durationMs = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      checks.push({ name, status: 'fail', durationMs, details: message });
      console.error(`FAIL ${checks.length}. ${name} (${durationMs} ms) - ${message}`);
    }
  }

  await runCheck('API health + student account login (Peter)', async () => {
    const healthSession = createSession();
    const health = await expectOk(healthSession, '/health');
    assert((health.data?.status ?? '').toLowerCase() === 'ok', 'Health endpoint did not return ok.');
    const student = await ensureUser(studentUsername, studentPassword, 'student');
    sessions.student = student.session;
    resolvedStudentPassword = student.passwordUsed;
    return `status=${health.data?.status ?? 'unknown'}, student=${studentUsername}, passwordPolicyFallbackUsed=${resolvedStudentPassword !== studentPassword}`;
  });

  await runCheck('Collaborator account login', async () => {
    const collaborator = await ensureUser(collaboratorUsername, collaboratorPassword, 'student');
    sessions.collaborator = collaborator.session;
    return `collaborator=${collaboratorUsername}`;
  });

  await runCheck('Project creation + collaborator membership', async () => {
    assert(sessions.student, 'Precondition failed: student session unavailable.');
    assert(sessions.collaborator, 'Precondition failed: collaborator session unavailable.');
    const projectEnv = await expectOk(sessions.student, '/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Online Heavy Validation ${new Date().toISOString()}`,
        description: 'Online dataset/database heavy e2e',
        workspaceMode: 'collaborative'
      })
    }, 'create project');
    projectId = projectEnv.data?.project?.id;
    assert(projectId, 'Project id missing.');
    await expectOk(sessions.student, `/projects/${encodeURIComponent(projectId)}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: collaboratorUsername, role: 'collaborator' })
    }, 'add collaborator');
    const membersEnv = await expectOk(sessions.student, `/projects/${encodeURIComponent(projectId)}/members`);
    assert((membersEnv.data?.members ?? []).length >= 2, 'Expected both student and collaborator in project members.');
    return `project=${projectId}`;
  });

  await runCheck('Collaboration presence + chat flow', async () => {
    assert(projectId, 'Precondition failed: project id unavailable.');
    await expectOk(sessions.student, '/presence/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    }, 'student presence ping');
    await expectOk(sessions.collaborator, '/presence/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    }, 'collaborator presence ping');
    await expectOk(sessions.student, '/project-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, body: 'Peter message for collaboration test.' })
    }, 'student chat post');
    await expectOk(sessions.collaborator, '/project-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, body: 'Collaborator reply for collaboration test.' })
    }, 'collaborator chat post');
    const feed = await expectOk(sessions.student, `/project-messages?projectId=${encodeURIComponent(projectId)}&limit=50`);
    assert((feed.data?.total ?? 0) >= 2, 'Expected at least two chat messages.');
    return `messages=${feed.data?.total ?? 0}`;
  });

  await runCheck('Online dataset/file download + import', async () => {
    assert(projectId, 'Precondition failed: project id unavailable.');
    const fixture = await downloadOnlineFixtures();
    const form = new FormData();
    form.append('projectId', projectId);
    form.append('file', new Blob([fixture.tipsCsv], { type: 'text/csv' }), 'tips-online.csv');
    form.append('file', new Blob([fixture.irisCsv], { type: 'text/csv' }), 'iris-online.csv');
    form.append('file', new Blob([fixture.aliceTrimmed], { type: 'text/plain' }), 'alice-online.txt');
    form.append('file', new Blob([fixture.dummyPdf], { type: 'application/pdf' }), 'dummy-online.pdf');
    const importEnv = await expectOk(sessions.student, '/imports/files', {
      method: 'POST',
      body: form
    }, 'import online fixtures');
    assert((importEnv.data?.importedCount ?? 0) >= 3, 'Expected at least three online files to import.');
    return `imported=${importEnv.data?.importedCount ?? 0}, errors=${importEnv.data?.errorCount ?? 0}`;
  });

  await runCheck('Qualitative coding artifacts (code/segment/app/memo/annotation)', async () => {
    assert(projectId, 'Precondition failed: project id unavailable.');
    const sourcesEnv = await expectOk(sessions.student, `/sources?projectId=${encodeURIComponent(projectId)}`);
    const casesEnv = await expectOk(sessions.student, `/cases?projectId=${encodeURIComponent(projectId)}`);
    const sources = sourcesEnv.data?.items ?? [];
    const textSource = sources.find((item) => String(item?.title ?? '').toLowerCase().includes('alice'))
      ?? sources.find((item) => item?.kind === 'text')
      ?? sources[0];
    assert(textSource?.id, 'Expected a source for coding.');
    sourceId = textSource.id;
    caseId = casesEnv.data?.items?.[0]?.id;
    assert(caseId, 'Expected at least one case.');

    const codeEnv = await expectOk(sessions.student, '/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: 'Alice context',
        description: 'Online qualitative coding check',
        colorToken: 'blue'
      })
    }, 'create code');
    codeId = codeEnv.data?.code?.id;
    assert(codeId, 'Expected code id.');

    const sourceText = String(textSource?.contentText ?? 'Alice was beginning to get very tired of sitting by her sister on the bank.');
    const anchorStart = Math.max(0, sourceText.indexOf('Alice') >= 0 ? sourceText.indexOf('Alice') : 0);
    const anchorEnd = Math.min(sourceText.length, anchorStart + 80);
    const excerpt = sourceText.slice(anchorStart, anchorEnd);
    const segmentEnv = await expectOk(sessions.student, '/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        sourceId,
        kind: 'excerpt',
        anchor: { kind: 'text_range', start: anchorStart, end: anchorEnd },
        text: excerpt
      })
    }, 'create segment');
    const segmentId = segmentEnv.data?.segment?.id;
    assert(segmentId, 'Expected segment id.');

    await expectOk(sessions.student, '/code-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        segmentId,
        codeId,
        caseId,
        confidence: 0.9
      })
    }, 'create code application');

    await expectOk(sessions.student, '/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        targetType: 'segment',
        targetId: segmentId,
        title: 'Online memo',
        body: 'Memo linked to online text evidence.'
      })
    }, 'create memo');

    await expectOk(sessions.student, '/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        targetType: 'segment',
        targetId: segmentId,
        quoteText: excerpt,
        note: 'Annotation for online qualitative validation.',
        startOffset: anchorStart,
        endOffset: anchorEnd,
        colorToken: 'blue'
      })
    }, 'create annotation');

    return `source=${sourceId}, case=${caseId}, code=${codeId}`;
  });

  await runCheck('Qualitative query suite', async () => {
    assert(projectId && codeId, 'Precondition failed: qualitative setup missing.');
    const retrieval = await expectOk(sessions.student, `/retrieval?projectId=${encodeURIComponent(projectId)}&codeId=${encodeURIComponent(codeId)}`);
    assert((retrieval.data?.items ?? []).length >= 1, 'Expected retrieval matches.');
    await expectOk(sessions.student, `/text-search?projectId=${encodeURIComponent(projectId)}&searchText=${encodeURIComponent('Alice')}`);
    await expectOk(sessions.student, `/word-frequency?projectId=${encodeURIComponent(projectId)}&searchText=${encodeURIComponent('Alice')}`);
    await expectOk(sessions.student, '/compound-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        operator: 'all',
        clauses: [
          { field: 'text', operator: 'contains', value: 'Alice' },
          { field: 'code', operator: 'present' }
        ]
      })
    });
    await expectOk(sessions.student, `/matrix-coding?projectId=${encodeURIComponent(projectId)}`);
    await expectOk(sessions.student, `/code-by-case?projectId=${encodeURIComponent(projectId)}`);
    await expectOk(sessions.student, `/code-cooccurrence?projectId=${encodeURIComponent(projectId)}`);
    await expectOk(sessions.student, `/matrix-coding-codes?projectId=${encodeURIComponent(projectId)}`);
    await expectOk(sessions.student, `/query-report?projectId=${encodeURIComponent(projectId)}`);
    await expectOk(sessions.student, `/framework-matrix?projectId=${encodeURIComponent(projectId)}`);
    return `retrieval=${retrieval.data?.items?.length ?? 0}`;
  });

  await runCheck('Derived variable + trace links', async () => {
    assert(projectId && codeId, 'Precondition failed: qualitative setup missing.');
    await expectOk(sessions.student, '/variables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: 'alice_presence_online',
        label: 'Alice presence online',
        kind: 'binary',
        sourceKind: 'derived_code',
        derivedFromCodeId: codeId,
        derivationRule: 'presence'
      })
    }, 'create derived variable');
    const derive = await expectOk(sessions.student, '/trace-links/derive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    }, 'derive trace links');
    return `traceLinks=${derive.data?.result?.traceLinksCreated ?? 0}`;
  });

  await runCheck('Descriptives + field mapping', async () => {
    assert(projectId, 'Precondition failed: project id unavailable.');
    const env = await expectOk(sessions.student, `/descriptives?projectId=${encodeURIComponent(projectId)}`);
    const report = env.data?.report;
    assert((report?.fieldCount ?? 0) >= 6, 'Expected multiple quantitative fields.');
    const pickField = (...fragments) => fragments.map((fragment) => findFieldKey(report, fragment)).find(Boolean) ?? null;
    const tipsNumeric1 = pickField('tip', 'total_bill');
    const tipsNumeric2 = pickField('size', 'total_bill', 'tip');
    const binaryGroup = pickField('sex', 'smoker');
    const irisNumeric1 = pickField('petal_length', 'sepal_length');
    const irisNumeric2 = pickField('petal_width', 'sepal_width');
    const irisNumeric3 = pickField('sepal_width', 'petal_width');
    const grouping = pickField('species') || binaryGroup;
    const crosstabColumn = pickField('day', 'time', 'species', 'size');
    assert(tipsNumeric1 && tipsNumeric2 && binaryGroup && irisNumeric1 && irisNumeric2 && irisNumeric3 && grouping && crosstabColumn, 'Expected quantitative fields in descriptives.');
    tipsFieldMap = {
      tipsNumeric1,
      tipsNumeric2,
      irisNumeric1,
      irisNumeric2,
      irisNumeric3,
      binaryGroup,
      grouping,
      crosstabColumn
    };
    return `cases=${report?.caseCount ?? 0}, fields=${report?.fieldCount ?? 0}`;
  });

  await runCheck('Quant inferential suite', async () => {
    assert(projectId && tipsFieldMap.tipsNumeric1 && tipsFieldMap.tipsNumeric2 && tipsFieldMap.binaryGroup && tipsFieldMap.irisNumeric1 && tipsFieldMap.irisNumeric2 && tipsFieldMap.irisNumeric3, 'Precondition failed: quantitative field map missing.');
    await expectOk(
      sessions.student,
      `/crosstabs?projectId=${encodeURIComponent(projectId)}&rowField=${encodeURIComponent(tipsFieldMap.grouping)}&columnField=${encodeURIComponent(tipsFieldMap.crosstabColumn)}`
    );
    await expectOk(sessions.student, '/compare-means', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        outcomeField: tipsFieldMap.irisNumeric1,
        groupField: tipsFieldMap.grouping
      })
    });
    await expectOk(sessions.student, '/correlation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        xField: tipsFieldMap.tipsNumeric1,
        yField: tipsFieldMap.tipsNumeric2
      })
    });
    await expectOk(sessions.student, '/t-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        outcomeField: tipsFieldMap.tipsNumeric1,
        groupField: tipsFieldMap.binaryGroup
      })
    });
    await expectOk(sessions.student, '/paired-t-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        beforeField: tipsFieldMap.tipsNumeric2,
        afterField: tipsFieldMap.tipsNumeric1
      })
    });
    await expectOk(sessions.student, '/nonparametric-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        outcomeField: tipsFieldMap.tipsNumeric1,
        groupField: tipsFieldMap.binaryGroup,
        method: 'mann_whitney_u'
      })
    });
    await expectOk(sessions.student, '/regression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        dependentField: tipsFieldMap.irisNumeric1,
        predictorFields: [tipsFieldMap.irisNumeric2, tipsFieldMap.irisNumeric3]
      })
    });
    return 'crosstabs + compare-means + correlation + t-tests + paired + nonparametric + regression';
  });

  await runCheck('Reliability + factor analysis', async () => {
    assert(projectId && tipsFieldMap.irisNumeric1 && tipsFieldMap.irisNumeric2 && tipsFieldMap.irisNumeric3, 'Precondition failed: quantitative field map missing.');
    const reliability = await expectOk(sessions.student, '/reliability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        fields: [tipsFieldMap.irisNumeric1, tipsFieldMap.irisNumeric2, tipsFieldMap.irisNumeric3]
      })
    });
    assert(Array.isArray(reliability.data?.reliability?.items), 'Expected reliability output items.');
    const factor = await expectOk(sessions.student, '/factor-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        fields: [tipsFieldMap.irisNumeric1, tipsFieldMap.irisNumeric2, tipsFieldMap.irisNumeric3],
        factorCount: 2,
        rotation: 'varimax'
      })
    });
    assert((factor.data?.factorAnalysis?.factors ?? []).length >= 1, 'Expected factor analysis factors.');
    return `alpha=${reliability.data?.reliability?.alpha ?? 'n/a'}, factors=${factor.data?.factorAnalysis?.factors?.length ?? 0}`;
  });

  await runCheck('Export suite (dataset/evidence/report)', async () => {
    assert(projectId && codeId, 'Precondition failed: export prerequisites missing.');
    const datasetXlsx = await sessions.student.request(`/exports/dataset?projectId=${encodeURIComponent(projectId)}&format=xlsx`);
    const datasetCsv = await sessions.student.request(`/exports/dataset?projectId=${encodeURIComponent(projectId)}&format=csv`);
    const evidenceJson = await sessions.student.request(`/exports/evidence?projectId=${encodeURIComponent(projectId)}&format=json&codeId=${encodeURIComponent(codeId)}`);
    const reportDocx = await sessions.student.request(`/exports/reports?projectId=${encodeURIComponent(projectId)}&kind=framework-matrix&format=docx&codeId=${encodeURIComponent(codeId)}`);
    assert(datasetXlsx.ok && datasetCsv.ok && evidenceJson.ok && reportDocx.ok, 'One or more export endpoints failed.');
    return 'xlsx + csv + evidence json + report docx';
  });

  await runCheck('SQL profile + preview + SQL import', async () => {
    assert(projectId, 'Precondition failed: project id unavailable.');
    const fixtures = await downloadOnlineFixtures();
    sqlFixture = setupOnlineSqlFixture(fixtures.tipsCsv);
    const saveProfile = await expectOk(sessions.student, '/sql-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        label: 'Online SQL Tips',
        clientType: 'postgres',
        connection: sqlFixture.connection
      })
    }, 'save sql profile');
    const profileId = saveProfile.data?.profile?.id;
    assert(profileId, 'Expected SQL profile id.');

    const tableList = await expectOk(
      sessions.student,
      `/sql-profiles/${encodeURIComponent(profileId)}/tables?projectId=${encodeURIComponent(projectId)}`
    );
    assert((tableList.data?.items ?? []).some((item) => item.schema === sqlFixture.schemaName && item.table === sqlFixture.tableName), 'Expected online SQL table in profile.');

    const preview = await expectOk(
      sessions.student,
      `/sql-profiles/${encodeURIComponent(profileId)}/preview?projectId=${encodeURIComponent(projectId)}&schemaName=${encodeURIComponent(sqlFixture.schemaName)}&tableName=${encodeURIComponent(sqlFixture.tableName)}&limit=10`
    );
    assert((preview.data?.rows ?? []).length >= 1, 'Expected SQL preview rows.');

    const imported = await expectOk(sessions.student, '/sql-import/table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        profileId,
        schemaName: sqlFixture.schemaName,
        tableName: sqlFixture.tableName,
        caseLabelColumn: 'row_id',
        maxRows: 100,
        selectedColumns: ['row_id', 'total_bill', 'tip', 'sex', 'smoker', 'day', 'time', 'size'],
        variableColumns: [
          { column: 'total_bill', kind: 'continuous' },
          { column: 'tip', kind: 'continuous' },
          { column: 'size', kind: 'continuous' },
          { column: 'sex', kind: 'categorical' },
          { column: 'smoker', kind: 'categorical' }
        ]
      })
    }, 'sql import table');
    assert((imported.data?.imported?.casesCreated ?? 0) >= 1, 'Expected SQL import to create cases.');
    return `rows=${preview.data?.rows?.length ?? 0}, casesCreated=${imported.data?.imported?.casesCreated ?? 0}`;
  });

  await runCheck('Backup + restore + audit trail', async () => {
    assert(projectId, 'Precondition failed: project id unavailable.');
    const backup = await expectOk(sessions.student, '/backups/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    }, 'create backup');
    const relativePath = backup.data?.backup?.relativePath;
    assert(relativePath, 'Expected backup relative path.');
    const restore = await expectOk(sessions.student, '/backups/project/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        relativePath,
        newProjectName: `Restored ${new Date().toISOString()}`
      })
    }, 'restore backup');
    assert(restore.data?.restored?.projectId, 'Expected restored project id.');
    const audit = await expectOk(sessions.student, `/audit-events?projectId=${encodeURIComponent(projectId)}&limit=500`);
    assert((audit.data?.total ?? 0) >= 1, 'Expected audit events to exist.');
    return `backup=${relativePath}, auditEvents=${audit.data?.total ?? 0}`;
  });

  await runCheck('Heavy parallel usage (collab + analytics)', async () => {
    assert(projectId && sessions.student && sessions.collaborator, 'Precondition failed: collaboration setup missing.');
    const workers = [];
    const iterations = 30;
    const errors = [];
    for (let index = 0; index < iterations; index += 1) {
      const actor = index % 2 === 0 ? sessions.student : sessions.collaborator;
      workers.push((async () => {
        try {
          await expectOk(actor, '/presence/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
          });
          await expectOk(actor, '/project-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, body: `Heavy test message ${index}` })
          });
          await expectOk(actor, `/project-messages?projectId=${encodeURIComponent(projectId)}&limit=25`);
          await expectOk(actor, `/descriptives?projectId=${encodeURIComponent(projectId)}`);
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      })());
    }
    await Promise.all(workers);
    assert(errors.length === 0, `Heavy parallel usage produced ${errors.length} errors.`);
    return `parallelOps=${iterations * 4}, errors=0`;
  });

  const passed = checks.filter((item) => item.status === 'pass').length;
  const failed = checks.filter((item) => item.status === 'fail').length;
  const summaryPath = path.join(logsDir, `online-heavy-summary-${timestamp}.json`);
  mkdirSync(logsDir, { recursive: true });
  writeFileSync(summaryPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    apiBase,
    student: studentUsername,
    studentPasswordPolicyFallbackUsed: resolvedStudentPassword !== studentPassword,
    collaborator: collaboratorUsername,
    projectId,
    dataSources: onlineData,
    sqlFixture: sqlFixture ? {
      host: sqlFixture.connection.host,
      port: sqlFixture.connection.port,
      database: sqlFixture.connection.database,
      schemaName: sqlFixture.schemaName,
      tableName: sqlFixture.tableName
    } : null,
    passed,
    failed,
    checks
  }, null, 2)}\n`, 'utf8');

  console.log(`summary: ${summaryPath}`);
  console.log(`checks: pass=${passed}, fail=${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
