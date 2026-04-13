import {
  createCase,
  createCode,
  createCodeApplication,
  createProject,
  createSegment,
  createSource,
  createTraceLink,
  createVariable,
  type CaseEntity,
  type Code,
  type CodeApplication,
  type Segment,
  type TraceLink,
  type Variable
} from '@mu/core-domain';

export type DerivedDatasetRow<TValue = 0 | 1> = {
  caseId: string;
  caseLabel: string;
  variableName: string;
  value: TValue;
  trace: TraceLink;
};

function findSupportingApplications(params: {
  code: Code;
  caseEntity: CaseEntity;
  segments: Segment[];
  applications: CodeApplication[];
}): CodeApplication[] {
  const { code, caseEntity, segments, applications } = params;
  const segmentMap = new Map(segments.map((segment) => [segment.id, segment]));

  return applications.filter((application) => {
    if (application.codeId !== code.id) return false;

    const segment = segmentMap.get(application.segmentId);
    if (!segment) return false;

    return application.caseId === caseEntity.id || caseEntity.sourceIds.includes(segment.sourceId);
  });
}

export function deriveBinaryCodeVariable(params: {
  variable: Variable;
  code: Code;
  cases: CaseEntity[];
  segments: Segment[];
  applications: CodeApplication[];
}): DerivedDatasetRow[] {
  const { variable, code, cases, segments, applications } = params;

  return cases.map((caseEntity) => {
    const supporting = findSupportingApplications({ code, caseEntity, segments, applications });

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

export function deriveCountCodeVariable(params: {
  variable: Variable;
  code: Code;
  cases: CaseEntity[];
  segments: Segment[];
  applications: CodeApplication[];
}): Array<DerivedDatasetRow<number>> {
  const { variable, code, cases, segments, applications } = params;

  return cases.map((caseEntity) => {
    const supporting = findSupportingApplications({ code, caseEntity, segments, applications });
    return {
      caseId: caseEntity.id,
      caseLabel: caseEntity.label,
      variableName: variable.name,
      value: supporting.length,
      trace: createTraceLink({
        variableId: variable.id,
        caseId: caseEntity.id,
        supportingCodeApplicationIds: supporting.map((item) => item.id)
      })
    };
  });
}

export function deriveIntensityCodeVariable(params: {
  variable: Variable;
  code: Code;
  cases: CaseEntity[];
  segments: Segment[];
  applications: CodeApplication[];
}): Array<DerivedDatasetRow<string>> {
  return deriveCountCodeVariable(params).map((row) => ({
    ...row,
    value: row.value === 0 ? 'none' : row.value === 1 ? 'single' : 'multiple'
  }));
}

export function projectSnapshotExample() {
  const project = createProject({
    id: 'project-snapshot',
    name: 'Research Operations Pilot',
    description: 'Single project model spanning qual, quant, and bridge logic.'
  });

  const source = createSource({
    id: 'source-001',
    projectId: project.id,
    kind: 'transcript',
    title: 'Participant interview 001',
    contentType: 'text/plain'
  });

  const trustCode = createCode({
    id: 'code-trust',
    projectId: project.id,
    name: 'Trust Concern'
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
    codeId: trustCode.id,
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
    code: trustCode,
    cases: [caseEntity],
    segments: [segment],
    applications: [application]
  });

  return {
    project,
    sources: [source],
    codes: [trustCode],
    segments: [segment],
    cases: [caseEntity],
    variables: [variable],
    dataset
  };
}
