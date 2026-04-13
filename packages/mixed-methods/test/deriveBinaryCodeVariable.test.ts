import { describe, expect, it } from 'vitest';
import {
  createCase,
  createCode,
  createCodeApplication,
  createProject,
  createSegment,
  createSource,
  createVariable
} from '@mu/core-domain';
import { deriveBinaryCodeVariable } from '../src/index';

describe('deriveBinaryCodeVariable', () => {
  it('derives a binary variable from coded segments', () => {
    const project = createProject({ id: 'project-1', name: 'Pilot', description: 'Pilot' });
    const source = createSource({
      id: 'source-1',
      projectId: project.id,
      kind: 'transcript',
      title: 'Interview 1',
      contentType: 'text/plain'
    });
    const segment = createSegment({
      id: 'segment-1',
      projectId: project.id,
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 12 },
      text: 'Low trust'
    });
    const caseEntity = createCase({
      id: 'case-1',
      projectId: project.id,
      label: 'Participant 1',
      sourceIds: [source.id]
    });
    const code = createCode({
      id: 'code-1',
      projectId: project.id,
      name: 'Trust Concern'
    });
    const application = createCodeApplication({
      id: 'application-1',
      projectId: project.id,
      segmentId: segment.id,
      codeId: code.id,
      caseId: caseEntity.id
    });
    const variable = createVariable({
      id: 'variable-1',
      projectId: project.id,
      name: 'trust_concern_flag',
      label: 'Trust concern flag',
      kind: 'binary',
      sourceKind: 'derived_code'
    });

    const rows = deriveBinaryCodeVariable({
      variable,
      code,
      cases: [caseEntity],
      segments: [segment],
      applications: [application]
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.value).toBe(1);
    expect(rows[0]?.trace.supportingCodeApplicationIds).toEqual(['application-1']);
  });
});
