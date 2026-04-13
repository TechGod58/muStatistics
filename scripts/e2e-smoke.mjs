import process from 'node:process';

const apiBase = process.env.MU_API_BASE?.trim() || 'http://localhost:4000';
const username = process.env.MU_SMOKE_USERNAME?.trim() || 'student1';
const password = process.env.MU_SMOKE_PASSWORD?.trim() || 'demo123';

let cookieHeader = '';

async function request(path, init = {}) {
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
}

async function requestJson(path, init = {}) {
  const response = await request(path, init);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }
  if (!response.ok || payload.ok === false) {
    const message = payload?.error?.message || payload?.message || `Request failed: ${response.status}`;
    throw new Error(`${path}: ${message}`);
  }
  return payload;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
  const health = await requestJson('/health');
  console.log(`health: ${health.data?.status ?? 'unknown'}`);

  await requestJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  console.log(`login: ${username}`);

  const projectName = `Pilot Smoke ${new Date().toISOString()}`;
  const projectEnv = await requestJson('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: projectName, description: 'pilot workflow smoke', workspaceMode: 'solo' })
  });
  const projectId = projectEnv.data.project.id;
  console.log(`project: ${projectId}`);

  const transcriptText = [
    'Participant noted trust concerns about the reporting workflow.',
    'They also described a stronger process after the intervention.',
    'Follow-up comments referenced trust, review, and implementation quality.'
  ].join('\n');
  const csvText = [
    'participant,department,score_pre,score_post,trust_score',
    'P-001,Assessment,2,4,3',
    'P-002,Research,3,5,4',
    'P-003,Student Affairs,1,4,2',
    'P-004,Assessment,2,5,5'
  ].join('\n');
  const importForm = new FormData();
  importForm.append('projectId', projectId);
  importForm.append('file', new Blob([transcriptText], { type: 'text/plain' }), 'pilot-transcript.txt');
  importForm.append('file', new Blob([csvText], { type: 'text/csv' }), 'participants.csv');
  const importEnv = await requestJson('/imports/files', {
    method: 'POST',
    body: importForm
  });
  assert((importEnv.data.importedCount ?? 0) >= 2, 'Expected both pilot files to import.');
  console.log(`import: ${importEnv.data.importedCount} imported, ${importEnv.data.errorCount} failed`);

  const sourcesEnv = await requestJson(`/sources?projectId=${encodeURIComponent(projectId)}`);
  const casesEnv = await requestJson(`/cases?projectId=${encodeURIComponent(projectId)}`);
  const sourceId = sourcesEnv.data.items?.[0]?.id;
  const caseId = casesEnv.data.items?.[0]?.id;
  assert(sourceId, 'Expected an imported source.');
  assert(caseId, 'Expected imported cases.');
  console.log(`source: ${sourceId}`);
  console.log(`cases: ${casesEnv.data.total}`);

  const codeEnv = await requestJson('/codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      name: 'Trust concern',
      description: 'Pilot smoke code',
      colorToken: 'amber'
    })
  });
  const codeId = codeEnv.data.code.id;
  console.log(`code: ${codeId}`);

  const segmentEnv = await requestJson('/segments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      sourceId,
      kind: 'excerpt',
      anchor: { kind: 'text_range', start: 19, end: 67 },
      text: 'trust concerns about the reporting workflow'
    })
  });
  const segmentId = segmentEnv.data.segment.id;
  console.log(`segment: ${segmentId}`);

  await requestJson('/code-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      segmentId,
      codeId,
      caseId,
      confidence: 0.92
    })
  });
  console.log('code application: created');

  await requestJson('/memos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      targetType: 'segment',
      targetId: segmentId,
      title: 'Pilot memo',
      body: 'Trust concern should map into a derived quantitative field.'
    })
  });
  await requestJson('/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      targetType: 'segment',
      targetId: segmentId,
      quoteText: 'trust concerns about the reporting workflow',
      note: 'Highlighted during pilot smoke run.',
      startOffset: 19,
      endOffset: 67,
      colorToken: 'amber'
    })
  });
  console.log('memo + annotation: created');

  const variableEnv = await requestJson('/variables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      name: 'trust_concern_count_smoke',
      label: 'Trust concern count smoke',
      kind: 'continuous',
      sourceKind: 'derived_code',
      derivedFromCodeId: codeId,
      derivationRule: 'count'
    })
  });
  console.log(`variable: ${variableEnv.data.variable.id}`);

  const deriveEnv = await requestJson('/trace-links/derive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId })
  });
  console.log(`trace derive: ${JSON.stringify(deriveEnv.data.result)}`);

  const descriptivesEnv = await requestJson(`/descriptives?projectId=${encodeURIComponent(projectId)}`);
  const report = descriptivesEnv.data.report;
  assert((report?.caseCount ?? 0) >= 4, 'Expected at least four dataset rows after import.');
  const scorePreField = findFieldKey(report, 'score_pre');
  const scorePostField = findFieldKey(report, 'score_post');
  const trustScoreField = findFieldKey(report, 'trust_score');
  const derivedField = findFieldKey(report, 'trust_concern_count_smoke');
  assert(scorePreField && scorePostField && trustScoreField && derivedField, 'Expected imported and derived quantitative fields in descriptives.');
  console.log(`descriptives: ${report.caseCount} cases, ${report.fieldCount} fields`);

  const retrievalEnv = await requestJson(`/retrieval?projectId=${encodeURIComponent(projectId)}&codeId=${encodeURIComponent(codeId)}`);
  assert((retrievalEnv.data.items ?? []).length >= 1, 'Expected coded evidence retrieval results.');
  console.log(`retrieval: ${retrievalEnv.data.items.length} matches`);

  const reliabilityEnv = await requestJson('/reliability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      fields: [scorePreField, scorePostField, trustScoreField],
      subscales: [{ label: 'Process', fields: [scorePreField, scorePostField] }]
    })
  });
  assert(Array.isArray(reliabilityEnv.data.reliability?.items), 'Expected reliability output.');
  console.log(`reliability: alpha ${reliabilityEnv.data.reliability.alpha}`);

  const factorEnv = await requestJson('/factor-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      fields: [scorePreField, scorePostField, trustScoreField],
      factorCount: 2,
      rotation: 'varimax'
    })
  });
  assert((factorEnv.data.factorAnalysis?.factors ?? []).length >= 1, 'Expected factor analysis output.');
  console.log(`factor analysis: rotation ${factorEnv.data.factorAnalysis.rotation}`);

  const regressionEnv = await requestJson('/regression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      dependentField: scorePostField,
      predictorFields: [scorePreField, trustScoreField],
      model: 'linear'
    })
  });
  assert((regressionEnv.data.regression?.coefficients ?? []).length >= 2, 'Expected regression coefficients.');
  console.log(`regression: ${regressionEnv.data.regression.coefficients.length} coefficients`);

  const datasetExport = await request(`/exports/dataset?projectId=${encodeURIComponent(projectId)}&format=xlsx`);
  assert(datasetExport.ok, `Dataset export failed: ${datasetExport.status}`);
  const evidenceExport = await request(`/exports/evidence?projectId=${encodeURIComponent(projectId)}&format=json&codeId=${encodeURIComponent(codeId)}`);
  assert(evidenceExport.ok, `Evidence export failed: ${evidenceExport.status}`);
  const frameworkExport = await request(`/exports/reports?projectId=${encodeURIComponent(projectId)}&kind=framework-matrix&format=docx&codeId=${encodeURIComponent(codeId)}`);
  assert(frameworkExport.ok, `Framework export failed: ${frameworkExport.status}`);
  console.log('exports: dataset, evidence, framework');

  const backupEnv = await requestJson('/backups/project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId })
  });
  const relativePath = backupEnv.data.backup.relativePath;
  console.log(`backup: ${relativePath}`);

  const restoreEnv = await requestJson('/backups/project/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, relativePath, newProjectName: `${projectName} Restored` })
  });
  assert(restoreEnv.data.restored?.projectId, 'Expected restored project.');
  console.log(`restore: ${restoreEnv.data.restored.projectId}`);

  const auditEnv = await requestJson(`/audit-events?projectId=${encodeURIComponent(projectId)}&limit=100`);
  assert((auditEnv.data.total ?? 0) > 0, 'Expected audit events for pilot workflow.');
  console.log(`audit events: ${auditEnv.data.total}`);

  const governanceResponse = await request('/governance/status');
  assert(governanceResponse.ok, `Governance status failed: ${governanceResponse.status}`);
  console.log('governance: ok');

  console.log('pilot smoke: passed');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
