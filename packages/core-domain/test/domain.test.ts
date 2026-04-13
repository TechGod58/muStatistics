import { describe, expect, it } from 'vitest';
import {
  createAuditEvent,
  createAttribute,
  createCase,
  createCode,
  createCodeApplication,
  createMemo,
  createProject,
  createRelationship,
  createSegment,
  createSource,
  createVariable,
  type TraceLink
} from '../src/index';

describe('core domain', () => {
  it('creates a valid mixed-methods project graph', () => {
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

    const trace: TraceLink = {
      variableId: variable.id,
      caseId: caseEntity.id,
      supportingCodeApplicationIds: [application.id]
    };

    const memo = createMemo({
      id: 'memo-1',
      projectId: project.id,
      targetType: 'source',
      targetId: source.id,
      title: 'Trust note'
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

    const relationship = createRelationship({
      id: 'relationship-1',
      projectId: project.id,
      relationshipType: 'see_also',
      leftTargetType: 'segment',
      leftTargetId: segment.id,
      rightTargetType: 'code',
      rightTargetId: code.id,
      note: 'This excerpt should stay linked to the trust concern code.'
    });

    expect(project.name).toBe('Pilot');
    expect(project.workspaceMode).toBe('collaborative');
    expect(source.contentUrl).toBeNull();
    expect(segment.text).toContain('trust');
    expect(trace.supportingCodeApplicationIds).toContain('apply-1');
    expect(memo.targetType).toBe('source');
    expect(attribute.targetId).toBe(caseEntity.id);
    expect(variable.derivationRule).toBe('presence');
    expect(auditEvent.action).toBe('code.create');
    expect(relationship.relationshipType).toBe('see_also');
  });
});
