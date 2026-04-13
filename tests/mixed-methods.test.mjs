import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCase,
  createCode,
  createCodeApplication,
  createProject,
  createSegment,
  createSource,
  createVariable
} from '../packages/core-domain/src/index.mjs';
import { deriveBinaryCodeVariable } from '../packages/mixed-methods/src/index.mjs';

test('mixed-methods bridge derives a binary variable from coding', () => {
  const project = createProject({ id: 'p1', name: 'Pilot' });
  const source = createSource({ id: 's1', projectId: project.id, kind: 'transcript', title: 'Interview', contentType: 'text/plain' });
  const segment = createSegment({
    id: 'seg1',
    projectId: project.id,
    sourceId: source.id,
    kind: 'text_range',
    anchor: { kind: 'text_range', start: 0, end: 24 },
    text: 'I do not trust this yet.'
  });
  const code = createCode({ id: 'c1', projectId: project.id, name: 'Trust Concern' });
  const caseEntity = createCase({ id: 'case1', projectId: project.id, label: 'Participant 1', sourceIds: [source.id] });
  const application = createCodeApplication({ id: 'a1', projectId: project.id, segmentId: segment.id, codeId: code.id, caseId: caseEntity.id });
  const variable = createVariable({ id: 'v1', projectId: project.id, name: 'trust_concern_flag', label: 'Trust concern', kind: 'binary', sourceKind: 'derived_code' });

  const rows = deriveBinaryCodeVariable({
    variable,
    code,
    cases: [caseEntity],
    segments: [segment],
    applications: [application]
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, 1);
  assert.deepEqual(rows[0].trace.supportingCodeApplicationIds, ['a1']);
});
