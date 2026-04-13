function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNonEmptyString(value, field) {
  assert(typeof value === 'string' && value.trim().length > 0, `${field} must be a non-empty string`);
}

function assertEnum(value, field, allowed) {
  assert(allowed.includes(value), `${field} must be one of: ${allowed.join(', ')}`);
}

function nowIso() {
  return new Date().toISOString();
}

export const SOURCE_KINDS = Object.freeze([
  'document',
  'transcript',
  'audio',
  'video',
  'pdf',
  'dataset',
  'survey'
]);

export const SEGMENT_KINDS = Object.freeze(['text_range', 'time_range', 'page_region']);
export const VARIABLE_KINDS = Object.freeze(['binary', 'categorical', 'continuous', 'text']);
export const ANALYSIS_KINDS = Object.freeze([
  'manual',
  'derived_code',
  'imported',
  'statistical_model',
  'dataset_derivation'
]);
export const DERIVATION_RULES = Object.freeze(['presence', 'count', 'intensity']);
export const PROJECT_WORKSPACE_MODES = Object.freeze(['solo', 'collaborative']);
export const MEMO_TARGET_TYPES = Object.freeze(['project', 'source', 'segment', 'code', 'case', 'analysis_run']);
export const ATTRIBUTE_TARGET_TYPES = Object.freeze(['case', 'source']);
export const ANNOTATION_TARGET_TYPES = Object.freeze(['project', 'source', 'segment', 'code', 'case']);
export const RELATIONSHIP_TARGET_TYPES = Object.freeze(['source', 'segment', 'code', 'case']);
export const RELATIONSHIP_TYPES = Object.freeze(['see_also', 'supports', 'contradicts', 'follows_up']);

function withTimestamps(input) {
  return {
    createdAt: input.createdAt ?? nowIso(),
    updatedAt: input.updatedAt ?? nowIso()
  };
}

function validateAnchor(anchor) {
  assert(anchor && typeof anchor === 'object', 'anchor must be an object');
  assertEnum(anchor.kind, 'anchor.kind', SEGMENT_KINDS);

  if (anchor.kind === 'text_range') {
    assert(Number.isInteger(anchor.start) && anchor.start >= 0, 'anchor.start must be a non-negative integer');
    assert(Number.isInteger(anchor.end) && anchor.end >= anchor.start, 'anchor.end must be an integer >= anchor.start');
  }

  if (anchor.kind === 'time_range') {
    assert(Number.isInteger(anchor.startMs) && anchor.startMs >= 0, 'anchor.startMs must be a non-negative integer');
    assert(Number.isInteger(anchor.endMs) && anchor.endMs >= anchor.startMs, 'anchor.endMs must be an integer >= anchor.startMs');
  }

  if (anchor.kind === 'page_region') {
    assert(Number.isInteger(anchor.page) && anchor.page > 0, 'anchor.page must be a positive integer');
    for (const field of ['x', 'y', 'width', 'height']) {
      assert(typeof anchor[field] === 'number' && Number.isFinite(anchor[field]), `anchor.${field} must be a finite number`);
    }
    assert(anchor.width > 0, 'anchor.width must be > 0');
    assert(anchor.height > 0, 'anchor.height must be > 0');
  }

  return anchor;
}

export function createProject(input) {
  assert(input && typeof input === 'object', 'project input is required');
  assertNonEmptyString(input.id, 'project.id');
  assertNonEmptyString(input.name, 'project.name');
  assertEnum(input.workspaceMode ?? 'solo', 'project.workspaceMode', PROJECT_WORKSPACE_MODES);

  return {
    id: input.id,
    name: input.name,
    workspaceMode: typeof input.workspaceMode === 'string' ? input.workspaceMode : 'solo',
    description: typeof input.description === 'string' ? input.description : '',
    ...withTimestamps(input)
  };
}

export function createSource(input) {
  assert(input && typeof input === 'object', 'source input is required');
  assertNonEmptyString(input.id, 'source.id');
  assertNonEmptyString(input.projectId, 'source.projectId');
  assertEnum(input.kind, 'source.kind', SOURCE_KINDS);
  assertNonEmptyString(input.title, 'source.title');
  assertNonEmptyString(input.contentType, 'source.contentType');

  return {
    id: input.id,
    projectId: input.projectId,
    kind: input.kind,
    title: input.title,
    language: typeof input.language === 'string' ? input.language : 'en',
    contentType: input.contentType,
    contentUrl: typeof input.contentUrl === 'string' && input.contentUrl.trim().length > 0 ? input.contentUrl : null,
    contentText: typeof input.contentText === 'string' ? input.contentText : '',
    ...withTimestamps(input)
  };
}

export function createSegment(input) {
  assert(input && typeof input === 'object', 'segment input is required');
  assertNonEmptyString(input.id, 'segment.id');
  assertNonEmptyString(input.projectId, 'segment.projectId');
  assertNonEmptyString(input.sourceId, 'segment.sourceId');
  assertEnum(input.kind, 'segment.kind', SEGMENT_KINDS);

  const anchor = validateAnchor(input.anchor);
  assert(anchor.kind === input.kind, 'segment.kind must match anchor.kind');

  return {
    id: input.id,
    projectId: input.projectId,
    sourceId: input.sourceId,
    kind: input.kind,
    anchor,
    text: typeof input.text === 'string' ? input.text : '',
    ...withTimestamps(input)
  };
}

export function createCode(input) {
  assert(input && typeof input === 'object', 'code input is required');
  assertNonEmptyString(input.id, 'code.id');
  assertNonEmptyString(input.projectId, 'code.projectId');
  assertNonEmptyString(input.name, 'code.name');

  return {
    id: input.id,
    projectId: input.projectId,
    parentCodeId: input.parentCodeId ?? null,
    name: input.name,
    description: typeof input.description === 'string' ? input.description : '',
    colorToken: typeof input.colorToken === 'string' ? input.colorToken : 'blue',
    ...withTimestamps(input)
  };
}

export function createMemo(input) {
  assert(input && typeof input === 'object', 'memo input is required');
  assertNonEmptyString(input.id, 'memo.id');
  assertNonEmptyString(input.projectId, 'memo.projectId');
  assertEnum(input.targetType, 'memo.targetType', MEMO_TARGET_TYPES);
  assertNonEmptyString(input.targetId, 'memo.targetId');
  assertNonEmptyString(input.title, 'memo.title');

  return {
    id: input.id,
    projectId: input.projectId,
    targetType: input.targetType,
    targetId: input.targetId,
    title: input.title,
    body: typeof input.body === 'string' ? input.body : '',
    ...withTimestamps(input)
  };
}

export function createCase(input) {
  assert(input && typeof input === 'object', 'case input is required');
  assertNonEmptyString(input.id, 'case.id');
  assertNonEmptyString(input.projectId, 'case.projectId');
  assertNonEmptyString(input.label, 'case.label');

  return {
    id: input.id,
    projectId: input.projectId,
    label: input.label,
    sourceIds: Array.isArray(input.sourceIds) ? input.sourceIds : [],
    ...withTimestamps(input)
  };
}

export function createAttribute(input) {
  assert(input && typeof input === 'object', 'attribute input is required');
  assertNonEmptyString(input.id, 'attribute.id');
  assertNonEmptyString(input.projectId, 'attribute.projectId');
  assertEnum(input.targetType, 'attribute.targetType', ATTRIBUTE_TARGET_TYPES);
  assertNonEmptyString(input.targetId, 'attribute.targetId');
  assertNonEmptyString(input.name, 'attribute.name');

  const allowed = ['string', 'number', 'boolean'];
  const type = input.value === null ? 'null' : typeof input.value;
  assert(allowed.includes(type) || type === 'null', 'attribute.value must be string, number, boolean, or null');

  return {
    id: input.id,
    projectId: input.projectId,
    targetType: input.targetType,
    targetId: input.targetId,
    name: input.name,
    value: input.value,
    ...withTimestamps(input)
  };
}

export function createAnnotation(input) {
  assert(input && typeof input === 'object', 'annotation input is required');
  assertNonEmptyString(input.id, 'annotation.id');
  assertNonEmptyString(input.projectId, 'annotation.projectId');
  assertEnum(input.targetType, 'annotation.targetType', ANNOTATION_TARGET_TYPES);
  assertNonEmptyString(input.targetId, 'annotation.targetId');
  assertNonEmptyString(input.note, 'annotation.note');
  if (input.startOffset !== undefined && input.startOffset !== null) {
    assert(Number.isInteger(input.startOffset) && input.startOffset >= 0, 'annotation.startOffset must be a non-negative integer or null');
  }
  if (input.endOffset !== undefined && input.endOffset !== null) {
    assert(Number.isInteger(input.endOffset) && input.endOffset >= 0, 'annotation.endOffset must be a non-negative integer or null');
  }
  if (input.startOffset !== undefined && input.startOffset !== null && input.endOffset !== undefined && input.endOffset !== null) {
    assert(input.endOffset >= input.startOffset, 'annotation.endOffset must be >= annotation.startOffset');
  }
  return {
    id: input.id,
    projectId: input.projectId,
    targetType: input.targetType,
    targetId: input.targetId,
    quoteText: typeof input.quoteText === 'string' ? input.quoteText : '',
    note: input.note,
    startOffset: Number.isInteger(input.startOffset) ? input.startOffset : null,
    endOffset: Number.isInteger(input.endOffset) ? input.endOffset : null,
    colorToken: typeof input.colorToken === 'string' ? input.colorToken : 'amber',
    ...withTimestamps(input)
  };
}

export function createRelationship(input) {
  assert(input && typeof input === 'object', 'relationship input is required');
  assertNonEmptyString(input.id, 'relationship.id');
  assertNonEmptyString(input.projectId, 'relationship.projectId');
  assertEnum(input.relationshipType ?? 'see_also', 'relationship.relationshipType', RELATIONSHIP_TYPES);
  assertEnum(input.leftTargetType, 'relationship.leftTargetType', RELATIONSHIP_TARGET_TYPES);
  assertNonEmptyString(input.leftTargetId, 'relationship.leftTargetId');
  assertEnum(input.rightTargetType, 'relationship.rightTargetType', RELATIONSHIP_TARGET_TYPES);
  assertNonEmptyString(input.rightTargetId, 'relationship.rightTargetId');
  return {
    id: input.id,
    projectId: input.projectId,
    relationshipType: typeof input.relationshipType === 'string' ? input.relationshipType : 'see_also',
    leftTargetType: input.leftTargetType,
    leftTargetId: input.leftTargetId,
    rightTargetType: input.rightTargetType,
    rightTargetId: input.rightTargetId,
    note: typeof input.note === 'string' ? input.note : '',
    ...withTimestamps(input)
  };
}

export function createVariable(input) {
  assert(input && typeof input === 'object', 'variable input is required');
  assertNonEmptyString(input.id, 'variable.id');
  assertNonEmptyString(input.projectId, 'variable.projectId');
  assertNonEmptyString(input.name, 'variable.name');
  assertNonEmptyString(input.label, 'variable.label');
  assertEnum(input.kind, 'variable.kind', VARIABLE_KINDS);
  assertEnum(input.sourceKind, 'variable.sourceKind', ANALYSIS_KINDS);
  assertEnum(input.derivationRule ?? 'presence', 'variable.derivationRule', DERIVATION_RULES);

  return {
    id: input.id,
    projectId: input.projectId,
    name: input.name,
    label: input.label,
    kind: input.kind,
    sourceKind: input.sourceKind,
    derivedFromCodeId: typeof input.derivedFromCodeId === 'string' && input.derivedFromCodeId.trim().length > 0
      ? input.derivedFromCodeId
      : null,
    derivationRule: typeof input.derivationRule === 'string' ? input.derivationRule : 'presence',
    ...withTimestamps(input)
  };
}

export function createCodeApplication(input) {
  assert(input && typeof input === 'object', 'code application input is required');
  assertNonEmptyString(input.id, 'codeApplication.id');
  assertNonEmptyString(input.projectId, 'codeApplication.projectId');
  assertNonEmptyString(input.segmentId, 'codeApplication.segmentId');
  assertNonEmptyString(input.codeId, 'codeApplication.codeId');

  const confidence = input.confidence ?? 1;
  assert(typeof confidence === 'number' && confidence >= 0 && confidence <= 1, 'codeApplication.confidence must be between 0 and 1');

  return {
    id: input.id,
    projectId: input.projectId,
    segmentId: input.segmentId,
    codeId: input.codeId,
    caseId: input.caseId ?? null,
    coderId: typeof input.coderId === 'string' ? input.coderId : 'system',
    confidence,
    createdAt: input.createdAt ?? nowIso()
  };
}

export function createAnalysisRun(input) {
  assert(input && typeof input === 'object', 'analysis run input is required');
  assertNonEmptyString(input.id, 'analysisRun.id');
  assertNonEmptyString(input.projectId, 'analysisRun.projectId');
  assertEnum(input.kind, 'analysisRun.kind', ANALYSIS_KINDS);
  assertEnum(input.status, 'analysisRun.status', ['queued', 'running', 'completed', 'failed']);
  assertNonEmptyString(input.label, 'analysisRun.label');

  return {
    id: input.id,
    projectId: input.projectId,
    kind: input.kind,
    status: input.status,
    label: input.label,
    ...withTimestamps(input)
  };
}

export function createExport(input) {
  assert(input && typeof input === 'object', 'export input is required');
  assertNonEmptyString(input.id, 'export.id');
  assertNonEmptyString(input.projectId, 'export.projectId');
  assertEnum(input.format, 'export.format', ['csv', 'json', 'docx', 'pdf']);
  assertNonEmptyString(input.label, 'export.label');

  return {
    id: input.id,
    projectId: input.projectId,
    format: input.format,
    label: input.label,
    createdAt: input.createdAt ?? nowIso()
  };
}

export function createTraceLink(input) {
  assert(input && typeof input === 'object', 'trace link input is required');
  assertNonEmptyString(input.variableId, 'traceLink.variableId');
  assertNonEmptyString(input.caseId, 'traceLink.caseId');
  assert(Array.isArray(input.supportingCodeApplicationIds), 'traceLink.supportingCodeApplicationIds must be an array');

  return {
    variableId: input.variableId,
    caseId: input.caseId,
    supportingCodeApplicationIds: input.supportingCodeApplicationIds
  };
}

export function createAuditEvent(input) {
  assert(input && typeof input === 'object', 'audit event input is required');
  assertNonEmptyString(input.id, 'auditEvent.id');
  assertNonEmptyString(input.projectId, 'auditEvent.projectId');
  assertNonEmptyString(input.actorUserId, 'auditEvent.actorUserId');
  assertNonEmptyString(input.actorUsername, 'auditEvent.actorUsername');
  assertEnum(input.actorRole, 'auditEvent.actorRole', ['student', 'professor', 'system']);
  assertNonEmptyString(input.action, 'auditEvent.action');
  assertNonEmptyString(input.entityType, 'auditEvent.entityType');
  assertNonEmptyString(input.entityId, 'auditEvent.entityId');
  assert(input.details === undefined || (input.details && typeof input.details === 'object' && !Array.isArray(input.details)), 'auditEvent.details must be an object');

  return {
    id: input.id,
    projectId: input.projectId,
    actorUserId: input.actorUserId,
    actorUsername: input.actorUsername,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details ?? {},
    createdAt: input.createdAt ?? nowIso()
  };
}
