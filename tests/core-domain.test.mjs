import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAuditEvent,
  createAttribute,
  createCase,
  createCode,
  createCodeApplication,
  createMemo,
  createProject,
  createSegment,
  createSource,
  createVariable
} from '../packages/core-domain/src/index.mjs';

test('core domain creates a valid mixed-methods graph', () => {
  const project = createProject({
    id: 'project-1',
    name: 'Pilot',
    workspaceMode: 'collaborative',
    description: 'Mixed-methods pilot project'
  });

  const source = createSource({
    id: 'source-1',
    projectId: project.id,
    kind: 'transcript',
    title: 'Interview 1',
    contentType: 'text/plain',
    contentUrl: null
  });

  const segment = createSegment({
    id: 'segment-1',
    projectId: project.id,
    sourceId: source.id,
    kind: 'text_range',
    anchor: { kind: 'text_range', start: 0, end: 40 },
    text: 'I do not trust the dashboard output yet.'
  });

  const code = createCode({
    id: 'code-1',
    projectId: project.id,
    name: 'Trust Concern'
  });

  const caseEntity = createCase({
    id: 'case-1',
    projectId: project.id,
    label: 'Participant 1',
    sourceIds: [source.id]
  });

  const application = createCodeApplication({
    id: 'apply-1',
    projectId: project.id,
    segmentId: segment.id,
    codeId: code.id,
    caseId: caseEntity.id
  });

  const variable = createVariable({
    id: 'variable-1',
    projectId: project.id,
    name: 'trust_concern_flag',
    label: 'Trust concern',
    kind: 'binary',
    sourceKind: 'derived_code',
    derivedFromCodeId: code.id,
    derivationRule: 'presence'
  });

  const memo = createMemo({
    id: 'memo-1',
    projectId: project.id,
    targetType: 'source',
    targetId: source.id,
    title: 'Trust note',
    body: 'Source highlights trust as a recurring concern.'
  });

  const attribute = createAttribute({
    id: 'attr-1',
    projectId: project.id,
    targetType: 'case',
    targetId: caseEntity.id,
    name: 'department',
    value: 'Admissions'
  });

  const auditEvent = createAuditEvent({
    id: 'audit-1',
    projectId: project.id,
    actorUserId: 'user-1',
    actorUsername: 'student1',
    actorRole: 'student',
    action: 'code.create',
    entityType: 'code',
    entityId: code.id,
    details: { name: code.name }
  });

  assert.equal(project.name, 'Pilot');
  assert.equal(project.workspaceMode, 'collaborative');
  assert.equal(source.contentUrl, null);
  assert.match(segment.text, /trust/i);
  assert.equal(application.caseId, caseEntity.id);
  assert.equal(variable.kind, 'binary');
  assert.equal(variable.derivationRule, 'presence');
  assert.equal(memo.targetId, source.id);
  assert.equal(attribute.targetType, 'case');
  assert.equal(auditEvent.entityId, code.id);
});
