import { z } from 'zod';

const isoDate = z.string().datetime({ offset: true });
const nowIso = (): string => new Date().toISOString();

export const SourceKindSchema = z.enum([
  'document',
  'transcript',
  'audio',
  'video',
  'pdf',
  'dataset',
  'survey'
]);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const SegmentKindSchema = z.enum(['text_range', 'time_range', 'page_region']);
export type SegmentKind = z.infer<typeof SegmentKindSchema>;

export const AttributeValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type AttributeValue = z.infer<typeof AttributeValueSchema>;
export const ProjectWorkspaceModeSchema = z.enum(['solo', 'collaborative']);
export type ProjectWorkspaceMode = z.infer<typeof ProjectWorkspaceModeSchema>;
export const MemoTargetTypeSchema = z.enum(['project', 'source', 'segment', 'code', 'case', 'analysis_run']);
export type MemoTargetType = z.infer<typeof MemoTargetTypeSchema>;
export const AttributeTargetTypeSchema = z.enum(['case', 'source']);
export type AttributeTargetType = z.infer<typeof AttributeTargetTypeSchema>;
export const AnnotationTargetTypeSchema = z.enum(['project', 'source', 'segment', 'code', 'case']);
export type AnnotationTargetType = z.infer<typeof AnnotationTargetTypeSchema>;
export const RelationshipTargetTypeSchema = z.enum(['source', 'segment', 'code', 'case']);
export type RelationshipTargetType = z.infer<typeof RelationshipTargetTypeSchema>;
export const RelationshipTypeSchema = z.enum(['see_also', 'supports', 'contradicts', 'follows_up']);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  workspaceMode: ProjectWorkspaceModeSchema.default('solo'),
  description: z.string().default(''),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Project = z.infer<typeof ProjectSchema>;

export const SourceSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  kind: SourceKindSchema,
  title: z.string().min(1),
  language: z.string().default('en'),
  contentType: z.string().min(1),
  contentUrl: z.string().url().nullable().default(null),
  contentText: z.string().default(''),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Source = z.infer<typeof SourceSchema>;

export const SegmentAnchorSchema = z.union([
  z.object({ kind: z.literal('text_range'), start: z.number().int().nonnegative(), end: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('time_range'), startMs: z.number().int().nonnegative(), endMs: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('page_region'),
    page: z.number().int().positive(),
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive()
  })
]);
export type SegmentAnchor = z.infer<typeof SegmentAnchorSchema>;

export const SegmentSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  sourceId: z.string().min(1),
  kind: SegmentKindSchema,
  anchor: SegmentAnchorSchema,
  text: z.string().default(''),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Segment = z.infer<typeof SegmentSchema>;

export const CodeSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  parentCodeId: z.string().nullable().default(null),
  name: z.string().min(1),
  description: z.string().default(''),
  colorToken: z.string().default('blue'),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Code = z.infer<typeof CodeSchema>;

export const MemoSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  targetType: MemoTargetTypeSchema,
  targetId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().default(''),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Memo = z.infer<typeof MemoSchema>;

export const CaseSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  label: z.string().min(1),
  sourceIds: z.array(z.string()).default([]),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type CaseEntity = z.infer<typeof CaseSchema>;

export const AttributeSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  targetType: AttributeTargetTypeSchema,
  targetId: z.string().min(1),
  name: z.string().min(1),
  value: AttributeValueSchema,
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Attribute = z.infer<typeof AttributeSchema>;

export const AnnotationSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  targetType: AnnotationTargetTypeSchema,
  targetId: z.string().min(1),
  quoteText: z.string().default(''),
  note: z.string().min(1),
  startOffset: z.number().int().nonnegative().nullable().default(null),
  endOffset: z.number().int().nonnegative().nullable().default(null),
  colorToken: z.string().default('amber'),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Annotation = z.infer<typeof AnnotationSchema>;

export const RelationshipSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  relationshipType: RelationshipTypeSchema.default('see_also'),
  leftTargetType: RelationshipTargetTypeSchema,
  leftTargetId: z.string().min(1),
  rightTargetType: RelationshipTargetTypeSchema,
  rightTargetId: z.string().min(1),
  note: z.string().default(''),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const AnalysisKindSchema = z.enum(['manual', 'derived_code', 'imported', 'statistical_model', 'dataset_derivation']);
export type AnalysisKind = z.infer<typeof AnalysisKindSchema>;
export const DerivationRuleSchema = z.enum(['presence', 'count', 'intensity']);
export type DerivationRule = z.infer<typeof DerivationRuleSchema>;

export const VariableSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['binary', 'categorical', 'continuous', 'text']),
  sourceKind: AnalysisKindSchema,
  derivedFromCodeId: z.string().nullable().default(null),
  derivationRule: DerivationRuleSchema.default('presence'),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type Variable = z.infer<typeof VariableSchema>;

export const CodeApplicationSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  segmentId: z.string().min(1),
  codeId: z.string().min(1),
  caseId: z.string().nullable().default(null),
  coderId: z.string().default('system'),
  confidence: z.number().min(0).max(1).default(1),
  createdAt: isoDate.default(nowIso)
});
export type CodeApplication = z.infer<typeof CodeApplicationSchema>;

export const AnalysisRunSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  kind: AnalysisKindSchema,
  status: z.enum(['queued', 'running', 'completed', 'failed']),
  label: z.string().min(1),
  createdAt: isoDate.default(nowIso),
  updatedAt: isoDate.default(nowIso)
});
export type AnalysisRun = z.infer<typeof AnalysisRunSchema>;

export const ExportSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  format: z.enum(['csv', 'json', 'docx', 'pdf']),
  label: z.string().min(1),
  createdAt: isoDate.default(nowIso)
});
export type ExportArtifact = z.infer<typeof ExportSchema>;

export const TraceLinkSchema = z.object({
  variableId: z.string().min(1),
  caseId: z.string().min(1),
  supportingCodeApplicationIds: z.array(z.string()).default([])
});
export type TraceLink = z.infer<typeof TraceLinkSchema>;

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  actorUserId: z.string().min(1),
  actorUsername: z.string().min(1),
  actorRole: z.enum(['student', 'professor', 'system']),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  details: z.record(z.string(), z.unknown()).default({}),
  createdAt: isoDate.default(nowIso)
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export function createProject(input: z.input<typeof ProjectSchema>): Project {
  return ProjectSchema.parse(input);
}

export function createSource(input: z.input<typeof SourceSchema>): Source {
  return SourceSchema.parse(input);
}

export function createSegment(input: z.input<typeof SegmentSchema>): Segment {
  return SegmentSchema.parse(input);
}

export function createCode(input: z.input<typeof CodeSchema>): Code {
  return CodeSchema.parse(input);
}

export function createMemo(input: z.input<typeof MemoSchema>): Memo {
  return MemoSchema.parse(input);
}

export function createCase(input: z.input<typeof CaseSchema>): CaseEntity {
  return CaseSchema.parse(input);
}

export function createAttribute(input: z.input<typeof AttributeSchema>): Attribute {
  return AttributeSchema.parse(input);
}

export function createAnnotation(input: z.input<typeof AnnotationSchema>): Annotation {
  return AnnotationSchema.parse(input);
}

export function createRelationship(input: z.input<typeof RelationshipSchema>): Relationship {
  return RelationshipSchema.parse(input);
}

export function createVariable(input: z.input<typeof VariableSchema>): Variable {
  return VariableSchema.parse(input);
}

export function createCodeApplication(input: z.input<typeof CodeApplicationSchema>): CodeApplication {
  return CodeApplicationSchema.parse(input);
}

export function createAnalysisRun(input: z.input<typeof AnalysisRunSchema>): AnalysisRun {
  return AnalysisRunSchema.parse(input);
}

export function createExport(input: z.input<typeof ExportSchema>): ExportArtifact {
  return ExportSchema.parse(input);
}

export function createTraceLink(input: z.input<typeof TraceLinkSchema>): TraceLink {
  return TraceLinkSchema.parse(input);
}

export function createAuditEvent(input: z.input<typeof AuditEventSchema>): AuditEvent {
  return AuditEventSchema.parse(input);
}
