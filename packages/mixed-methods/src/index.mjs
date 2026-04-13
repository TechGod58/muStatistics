import {
  createCase,
  createCode,
  createCodeApplication,
  createProject,
  createSegment,
  createSource,
  createTraceLink,
  createVariable
} from '../../core-domain/src/index.mjs';

export function deriveBinaryCodeVariable({ variable, code, cases, segments, applications }) {
  const segmentMap = new Map(segments.map((segment) => [segment.id, segment]));

  return cases.map((caseEntity) => {
    const supporting = applications.filter((application) => {
      if (application.codeId !== code.id) return false;
      if (application.caseId !== caseEntity.id) return false;
      return segmentMap.has(application.segmentId);
    });

    return {
      caseId: caseEntity.id,
      caseLabel: caseEntity.label,
      variableName: variable.name,
      value: supporting.length > 0 ? 1 : 0,
      trace: createTraceLink({
        variableId: variable.id,
        caseId: caseEntity.id,
        supportingCodeApplicationIds: supporting.map((item) => item.id)
      })
    };
  });
}

export function projectSnapshotExample() {
  const project = createProject({
    id: 'project-demo',
    name: 'Mixed Methods Demo',
    description: 'One project model spanning qualitative and quantitative analysis.'
  });

  const source = createSource({
    id: 'source-001',
    projectId: project.id,
    kind: 'transcript',
    title: 'Participant interview 001',
    contentType: 'text/plain'
  });

  const code = createCode({
    id: 'code-trust',
    projectId: project.id,
    name: 'Trust Concern',
    description: 'Participant expresses uncertainty or skepticism.'
  });

  const segment = createSegment({
    id: 'segment-001',
    projectId: project.id,
    sourceId: source.id,
    kind: 'text_range',
    anchor: { kind: 'text_range', start: 14, end: 54 },
    text: 'I still do not trust the automated scoring.'
  });

  const caseEntity = createCase({
    id: 'case-001',
    projectId: project.id,
    label: 'Participant 001',
    sourceIds: [source.id]
  });

  const application = createCodeApplication({
    id: 'application-001',
    projectId: project.id,
    segmentId: segment.id,
    codeId: code.id,
    caseId: caseEntity.id
  });

  const variable = createVariable({
    id: 'variable-001',
    projectId: project.id,
    name: 'trust_concern_flag',
    label: 'Trust concern flagged',
    kind: 'binary',
    sourceKind: 'derived_code'
  });

  const dataset = deriveBinaryCodeVariable({
    variable,
    code,
    cases: [caseEntity],
    segments: [segment],
    applications: [application]
  });

  return {
    project,
    sources: [source],
    codes: [code],
    segments: [segment],
    cases: [caseEntity],
    variables: [variable],
    dataset
  };
}
