import path from 'node:path';
import { mkdirSync } from 'node:fs';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcryptjs';
import {
  createAuditEvent,
  createAnnotation,
  createAttribute,
  createCase,
  createCode,
  createCodeApplication,
  createMemo,
  createProject,
  createRelationship,
  createSegment,
  createSource,
  createTraceLink,
  createVariable,
  type AuditEvent,
  type Annotation,
  type Attribute,
  type CaseEntity,
  type Code,
  type CodeApplication,
  type Memo,
  type Project,
  type Relationship,
  type Segment,
  type Source,
  type TraceLink,
  type Variable
} from '@mu/core-domain';

const { Pool } = pg;

type QueryResultLike = {
  rows: any[];
  rowCount?: number;
};

type QueryableClient = {
  query(text: string, params?: unknown[]): Promise<QueryResultLike>;
  release(): void;
};

type QueryablePool = {
  query(text: string, params?: unknown[]): Promise<QueryResultLike>;
  connect(): Promise<QueryableClient>;
};

export type User = {
  id: string;
  username: string;
  role: 'student' | 'professor';
  createdAt: string;
  expiresAt: string | null;
};

export type MembershipRole = 'owner' | 'collaborator';

export type ProjectMembership = {
  userId: string;
  projectId: string;
  role: MembershipRole;
  joinedAt: string;
};

export type ProjectPresence = {
  userId: string;
  username: string;
  role: 'student' | 'professor';
  projectId: string;
  lastSeenAt: string;
};

export type ProjectSummary = {
  project: Project;
  source: Source | null;
  code: Code | null;
  variable: Variable | null;
  counts: {
    projects: number;
    projectSources: number;
    projectCodes: number;
    projectVariables: number;
    projectCases: number;
    projectSegments: number;
    projectCodeApplications: number;
    traceLinks: number;
  };
  db: { host: string };
};

export type TraceLinkRecord = {
  variableId: string;
  variableName: string;
  variableLabel: string;
  caseId: string;
  caseLabel: string;
  supportingCodeApplicationIds: string[];
  derivedFromCodeId: string | null;
};

export type DeriveResult = {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
};

export type ProjectMessage = {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  body: string;
  createdAt: string;
};

export type SavedTransform = {
  id: string;
  projectId: string;
  label: string;
  filtersJson: string;
  recodesJson: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedQualitativeQuery = {
  id: string;
  projectId: string;
  label: string;
  mode: string;
  queryJson: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedAnalysisJob = {
  id: string;
  projectId: string;
  label: string;
  analysisKind: string;
  analysisJson: string;
  createdAt: string;
  updatedAt: string;
};

export type CodingAssignmentStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type CodingAssignmentPriority = 'low' | 'normal' | 'high';

export type CodingAssignment = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  sourceId: string | null;
  codeId: string | null;
  caseId: string | null;
  assigneeUserId: string | null;
  assigneeUsername: string | null;
  status: CodingAssignmentStatus;
  priority: CodingAssignmentPriority;
  dueAt: string | null;
  createdByUserId: string | null;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type CodingConflictResolutionStatus = 'resolved' | 'deferred' | 'reopened' | 'restored';

export type CodingConflictResolution = {
  id: string;
  projectId: string;
  segmentId: string;
  codeId: string;
  status: CodingConflictResolutionStatus;
  keepMode: string | null;
  keepApplicationId: string | null;
  keepCoderId: string | null;
  removedApplicationIdsJson: string;
  removedCount: number;
  resolutionNote: string;
  actorUserId: string | null;
  actorUsername: string;
  metadataJson: string;
  createdAt: string;
};

export type ArchivedCodeApplication = {
  id: string;
  resolutionId: string;
  projectId: string;
  applicationId: string;
  segmentId: string;
  codeId: string;
  caseId: string | null;
  coderId: string;
  confidence: number;
  originalCreatedAt: string;
  archivedAt: string;
  archivedByUserId: string | null;
  archivedByUsername: string;
  restoredAt: string | null;
  restoredByUserId: string | null;
  restoredByUsername: string;
};

export type CodingCalibrationSessionStatus = 'draft' | 'running' | 'completed' | 'archived';

export type CodingCalibrationSession = {
  id: string;
  projectId: string;
  label: string;
  scopeJson: string;
  targetCodeId: string | null;
  coderAId: string | null;
  coderBId: string | null;
  sampleSegmentIdsJson: string;
  status: CodingCalibrationSessionStatus;
  targetAgreement: number;
  targetKappa: number;
  minSamples: number;
  latestResultJson: string;
  createdByUserId: string | null;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type CodingConflictTriageStatus = 'open' | 'in_review' | 'ready_to_merge' | 'deferred' | 'escalated' | 'resolved';
export type CodingConflictTriageSeverity = 'low' | 'medium' | 'high' | 'critical';

export type CodingConflictTriage = {
  id: string;
  projectId: string;
  segmentId: string;
  codeId: string;
  status: CodingConflictTriageStatus;
  severity: CodingConflictTriageSeverity;
  assigneeUserId: string | null;
  assigneeUsername: string | null;
  reviewerUserId: string | null;
  reviewerUsername: string | null;
  dueAt: string | null;
  triageNote: string;
  labelsJson: string;
  metadataJson: string;
  createdByUserId: string | null;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
};

export type CodingMergeGovernancePolicy = {
  projectId: string;
  requireResolutionNote: boolean;
  restrictResolutionToOwnerOrProfessor: boolean;
  requireSecondReviewerForHighRisk: boolean;
  highRiskMinCoderCount: number;
  highRiskMinConfidenceSpread: number;
  requiredApprovalCountForHighRisk: number;
  approvalExpiryHours: number;
  defaultTriageSlaHours: number;
  updatedAt: string;
  updatedByUserId: string | null;
};

export type CodingMergeApproval = {
  id: string;
  projectId: string;
  segmentId: string;
  codeId: string;
  approvedByUserId: string | null;
  approvedByUsername: string;
  note: string;
  createdAt: string;
  usedAt: string | null;
  revokedAt: string | null;
};

export type TranscriptSyncLink = {
  id: string;
  projectId: string;
  mediaSourceId: string;
  transcriptSourceId: string;
  segmentId: string | null;
  startMs: number;
  endMs: number;
  transcriptText: string;
  speakerLabel: string;
  confidence: number | null;
  syncScore: number | null;
  tokenTimelineJson: string;
  createdAt: string;
  updatedAt: string;
};

export type TranscriptionJob = {
  id: string;
  projectId: string;
  mediaSourceId: string;
  outputSourceId: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  mode: 'segment_assembly' | 'timeline_chunked' | 'hybrid';
  note: string;
  pipelineJson: string;
  progressPercent: number;
  startedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type ExternalSqlProfile = {
  id: string;
  projectId: string;
  label: string;
  clientType: 'postgres' | 'sqlserver';
  connectionJson: string;
  createdAt: string;
  updatedAt: string;
};

export type ExternalSqlImportJob = {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  schemaName: string;
  tableName: string;
  caseLabelColumn: string;
  selectedColumnsJson: string;
  variableColumnsJson: string;
  maxRows: number;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OfficeConnectorProfile = {
  id: string;
  projectId: string;
  label: string;
  rootPath: string;
  includeSubdirectories: boolean;
  allowedExtensionsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type OfficeConnectorJob = {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  syncOptionsJson: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  lastRunStatsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type ReferenceConnectorProvider = 'crossref' | 'openalex';

export type ReferenceConnectorProfile = {
  id: string;
  projectId: string;
  label: string;
  provider: ReferenceConnectorProvider;
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type ReferenceConnectorJob = {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  queryJson: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  lastRunStatsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type DatasetFieldMetadata = {
  projectId: string;
  fieldKey: string;
  fieldLabel: string;
  measure: 'nominal' | 'ordinal' | 'scale' | 'unknown' | null;
  valueLabelsJson: string;
  missingValuesJson: string;
  missingRangesJson: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDatasetSettings = {
  projectId: string;
  weightField: string | null;
  splitFieldsJson: string;
  updatedAt: string;
};

export type AuditActorRole = 'student' | 'professor' | 'system';

export type AuditEventRecord = AuditEvent;
export type RelationshipRecord = Relationship;

export type ProjectReference = {
  id: string;
  projectId: string;
  sourceFormat: 'ris' | 'bibtex' | 'manual' | 'csljson';
  referenceType: string;
  title: string;
  authors: string[];
  year: number | null;
  containerTitle: string;
  publisher: string;
  doi: string;
  url: string;
  abstractText: string;
  keywords: string[];
  rawText: string;
  relatedSourceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReferenceLinkTargetType = 'source' | 'segment' | 'memo' | 'code' | 'case' | 'annotation';

export type ProjectReferenceLink = {
  id: string;
  projectId: string;
  referenceId: string;
  targetType: ReferenceLinkTargetType;
  targetId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectReferenceCollection = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  colorToken: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectReferenceCollectionItem = {
  id: string;
  projectId: string;
  collectionId: string;
  referenceId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectReferenceMergeEvent = {
  id: string;
  projectId: string;
  primaryReferenceId: string;
  mergedReferenceId: string;
  reason: string;
  mergedSnapshotJson: string;
  createdByUserId: string | null;
  createdByUsername: string;
  createdAt: string;
};

export type ProjectReferenceDuplicateCandidate = {
  primaryReferenceId: string;
  duplicateReferenceId: string;
  score: number;
  reasons: string[];
};

export type GovernancePolicy = {
  id: 'global';
  idleTimeoutMinutes: number;
  sessionAbsoluteTimeoutMinutes: number;
  loginThrottleWindowMinutes: number;
  loginThrottleMaxFailures: number;
  localAuthEnabled: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  auditExportMaxRows: number;
  backupRetentionDays: number;
  updatedAt: string;
  updatedByUserId: string | null;
};

const isPortableMode = process.env.MU_PORTABLE === '1' || process.env.MU_PORTABLE === 'true';
const portableDbDir = path.resolve(process.cwd(), process.env.MU_PORTABLE_DB_DIR || path.join(process.env.MU_STORAGE_ROOT || 'data', 'portable-db'));

function normalizeQueryResult(result: { rows: any[]; rowCount?: number; affectedRows?: number }): QueryResultLike {
  return {
    rows: result.rows,
    rowCount: result.rowCount ?? result.affectedRows ?? result.rows.length
  };
}

const pool: QueryablePool = isPortableMode
  ? (() => {
      mkdirSync(portableDbDir, { recursive: true });
      const db = new PGlite(portableDbDir);
      const client: QueryableClient = {
        async query(text: string, params: unknown[] = []) {
          const result = await db.query(text, params);
          return normalizeQueryResult(result);
        },
        release() {}
      };
      return {
        query: client.query,
        async connect() {
          return client;
        }
      };
    })()
  : (() => {
      const pgPool = new Pool({
        connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/mu_statistics'
      });
      return {
        async query(text: string, params?: unknown[]) {
          const result = await pgPool.query(text, params);
          return {
            rows: result.rows,
            rowCount: result.rowCount ?? undefined
          };
        },
        async connect() {
          const client = await pgPool.connect();
          return {
            async query(text: string, params?: unknown[]) {
              const result = await client.query(text, params);
              return {
                rows: result.rows,
                rowCount: result.rowCount ?? undefined
              };
            },
            release() {
              client.release();
            }
          };
        }
      };
    })();

export function getPool(): QueryablePool { return pool; }

function nowIso(): string { return new Date().toISOString(); }
function addYearsIso(baseIso: string, years: number): string {
  const date = new Date(baseIso);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString();
}

// ── Schema ────────────────────────────────────────────────────────────────────

async function ensureColumn(table: string, column: string, alterSql: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  if (Number(rows[0]?.count ?? 0) === 0) {
    await pool.query(alterSql);
  }
}

async function execSqlStatements(batch: string): Promise<void> {
  const statements = batch
    .split(/;\s*\r?\n/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
}

export async function execSchema(): Promise<void> {
  await execSqlStatements(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      workspace_mode TEXT NOT NULL DEFAULT 'solo',
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'collaborator',
      joined_at TEXT NOT NULL,
      PRIMARY KEY (user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_presence (
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_url TEXT,
      content_text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS codes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      parent_code_id TEXT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color_token TEXT NOT NULL DEFAULT 'blue',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      kind TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      derived_from_code_id TEXT,
      derivation_rule TEXT NOT NULL DEFAULT 'presence',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (derived_from_code_id) REFERENCES codes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      source_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memos (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attributes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      name TEXT NOT NULL,
      value_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      quote_text TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL,
      start_offset INTEGER,
      end_offset INTEGER,
      color_token TEXT NOT NULL DEFAULT 'amber',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL DEFAULT 'see_also',
      left_target_type TEXT NOT NULL,
      left_target_id TEXT NOT NULL,
      right_target_type TEXT NOT NULL,
      right_target_id TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_references (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_format TEXT NOT NULL DEFAULT 'manual',
      reference_type TEXT NOT NULL DEFAULT 'article',
      title TEXT NOT NULL DEFAULT '',
      authors_json TEXT NOT NULL DEFAULT '[]',
      year INTEGER,
      container_title TEXT NOT NULL DEFAULT '',
      publisher TEXT NOT NULL DEFAULT '',
      doi TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      abstract_text TEXT NOT NULL DEFAULT '',
      keywords_json TEXT NOT NULL DEFAULT '[]',
      raw_text TEXT NOT NULL DEFAULT '',
      related_source_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (related_source_id) REFERENCES sources(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_reference_links (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (reference_id) REFERENCES project_references(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_reference_collections (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color_token TEXT NOT NULL DEFAULT 'blue',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_reference_collection_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      collection_id TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (collection_id, reference_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (collection_id) REFERENCES project_reference_collections(id) ON DELETE CASCADE,
      FOREIGN KEY (reference_id) REFERENCES project_references(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_reference_merge_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      primary_reference_id TEXT NOT NULL,
      merged_reference_id TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      merged_snapshot_json TEXT NOT NULL DEFAULT '{}',
      created_by_user_id TEXT,
      created_by_username TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      anchor_json TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS code_applications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      segment_id TEXT NOT NULL,
      code_id TEXT NOT NULL,
      case_id TEXT,
      coder_id TEXT NOT NULL DEFAULT 'system',
      confidence REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
      FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE CASCADE,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coding_assignments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      source_id TEXT,
      code_id TEXT,
      case_id TEXT,
      assignee_user_id TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'normal',
      due_at TEXT,
      created_by_user_id TEXT,
      created_by_username TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL,
      FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE SET NULL,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
      FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coding_conflict_resolutions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      segment_id TEXT NOT NULL,
      code_id TEXT NOT NULL,
      status TEXT NOT NULL,
      keep_mode TEXT,
      keep_application_id TEXT,
      keep_coder_id TEXT,
      removed_application_ids_json TEXT NOT NULL DEFAULT '[]',
      removed_count INTEGER NOT NULL DEFAULT 0,
      resolution_note TEXT NOT NULL DEFAULT '',
      actor_user_id TEXT,
      actor_username TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coding_calibration_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      scope_json TEXT NOT NULL DEFAULT '{}',
      target_code_id TEXT,
      coder_a_id TEXT,
      coder_b_id TEXT,
      sample_segment_ids_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      target_agreement REAL NOT NULL DEFAULT 0.8,
      target_kappa REAL NOT NULL DEFAULT 0.7,
      min_samples INTEGER NOT NULL DEFAULT 25,
      latest_result_json TEXT NOT NULL DEFAULT '{}',
      created_by_user_id TEXT,
      created_by_username TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (target_code_id) REFERENCES codes(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coding_conflict_triage (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      segment_id TEXT NOT NULL,
      code_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      severity TEXT NOT NULL DEFAULT 'medium',
      assignee_user_id TEXT,
      reviewer_user_id TEXT,
      due_at TEXT,
      triage_note TEXT NOT NULL DEFAULT '',
      labels_json TEXT NOT NULL DEFAULT '[]',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_by_user_id TEXT,
      created_by_username TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (project_id, segment_id, code_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
      FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coding_merge_governance_policies (
      project_id TEXT PRIMARY KEY,
      require_resolution_note BOOLEAN NOT NULL DEFAULT TRUE,
      restrict_resolution_to_owner_or_professor BOOLEAN NOT NULL DEFAULT TRUE,
      require_second_reviewer_for_high_risk BOOLEAN NOT NULL DEFAULT TRUE,
      high_risk_min_coder_count INTEGER NOT NULL DEFAULT 3,
      high_risk_min_confidence_spread REAL NOT NULL DEFAULT 0.35,
      required_approval_count_for_high_risk INTEGER NOT NULL DEFAULT 1,
      approval_expiry_hours INTEGER NOT NULL DEFAULT 168,
      default_triage_sla_hours INTEGER NOT NULL DEFAULT 72,
      updated_at TEXT NOT NULL,
      updated_by_user_id TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coding_merge_approvals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      segment_id TEXT NOT NULL,
      code_id TEXT NOT NULL,
      approved_by_user_id TEXT,
      approved_by_username TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      used_at TEXT,
      revoked_at TEXT,
      UNIQUE (project_id, segment_id, code_id, approved_by_username),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
      FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS archived_code_applications (
      id TEXT PRIMARY KEY,
      resolution_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      application_id TEXT NOT NULL,
      segment_id TEXT NOT NULL,
      code_id TEXT NOT NULL,
      case_id TEXT,
      coder_id TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 1.0,
      original_created_at TEXT NOT NULL,
      archived_at TEXT NOT NULL,
      archived_by_user_id TEXT,
      archived_by_username TEXT NOT NULL DEFAULT '',
      restored_at TEXT,
      restored_by_user_id TEXT,
      restored_by_username TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (resolution_id) REFERENCES coding_conflict_resolutions(id) ON DELETE CASCADE,
      FOREIGN KEY (archived_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (restored_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS trace_links (
      variable_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      supporting_code_application_ids_json TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (variable_id, case_id),
      FOREIGN KEY (variable_id) REFERENCES variables(id) ON DELETE CASCADE,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_transforms (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      filters_json TEXT NOT NULL DEFAULT '[]',
      recodes_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_qualitative_queries (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      mode TEXT NOT NULL,
      query_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_analysis_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      analysis_kind TEXT NOT NULL,
      analysis_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transcript_sync_links (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      media_source_id TEXT NOT NULL,
      transcript_source_id TEXT NOT NULL,
      segment_id TEXT,
      start_ms INTEGER NOT NULL,
      end_ms INTEGER NOT NULL,
      transcript_text TEXT NOT NULL DEFAULT '',
      speaker_label TEXT NOT NULL DEFAULT '',
      confidence REAL,
      sync_score REAL,
      token_timeline_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (media_source_id) REFERENCES sources(id) ON DELETE CASCADE,
      FOREIGN KEY (transcript_source_id) REFERENCES sources(id) ON DELETE CASCADE,
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS transcription_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      media_source_id TEXT NOT NULL,
      output_source_id TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      mode TEXT NOT NULL DEFAULT 'segment_assembly',
      note TEXT NOT NULL DEFAULT '',
      pipeline_json TEXT NOT NULL DEFAULT '{}',
      progress_percent INTEGER NOT NULL DEFAULT 0,
      started_at TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (media_source_id) REFERENCES sources(id) ON DELETE CASCADE,
      FOREIGN KEY (output_source_id) REFERENCES sources(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS external_sql_profiles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      client_type TEXT NOT NULL,
      connection_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS external_sql_import_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      label TEXT NOT NULL,
      schema_name TEXT NOT NULL,
      table_name TEXT NOT NULL,
      case_label_column TEXT NOT NULL,
      selected_columns_json TEXT NOT NULL DEFAULT '[]',
      variable_columns_json TEXT NOT NULL DEFAULT '[]',
      max_rows INTEGER NOT NULL DEFAULT 500,
      schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      schedule_interval_minutes INTEGER,
      schedule_next_run_at TEXT,
      last_run_at TEXT,
      last_run_status TEXT,
      last_run_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES external_sql_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS office_connector_profiles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      root_path TEXT NOT NULL,
      include_subdirectories BOOLEAN NOT NULL DEFAULT TRUE,
      allowed_extensions_json TEXT NOT NULL DEFAULT '[".docx",".xlsx",".pdf",".txt",".md"]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS office_connector_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      label TEXT NOT NULL,
      sync_options_json TEXT NOT NULL DEFAULT '{}',
      schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      schedule_interval_minutes INTEGER,
      schedule_next_run_at TEXT,
      last_run_at TEXT,
      last_run_status TEXT,
      last_run_message TEXT,
      last_run_stats_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES office_connector_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reference_connector_profiles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'crossref',
      settings_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reference_connector_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      label TEXT NOT NULL,
      query_json TEXT NOT NULL DEFAULT '{}',
      schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      schedule_interval_minutes INTEGER,
      schedule_next_run_at TEXT,
      last_run_at TEXT,
      last_run_status TEXT,
      last_run_message TEXT,
      last_run_stats_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES reference_connector_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dataset_field_metadata (
      project_id TEXT NOT NULL,
      field_key TEXT NOT NULL,
      field_label TEXT NOT NULL DEFAULT '',
      measure TEXT,
      value_labels_json TEXT NOT NULL DEFAULT '[]',
      missing_values_json TEXT NOT NULL DEFAULT '[]',
      missing_ranges_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (project_id, field_key),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_dataset_settings (
      project_id TEXT PRIMARY KEY,
      weight_field TEXT,
      split_fields_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      actor_user_id TEXT NOT NULL,
      actor_username TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS governance_policies (
      id TEXT PRIMARY KEY,
      idle_timeout_minutes INTEGER NOT NULL DEFAULT 90,
      session_absolute_timeout_minutes INTEGER NOT NULL DEFAULT 720,
      login_throttle_window_minutes INTEGER NOT NULL DEFAULT 15,
      login_throttle_max_failures INTEGER NOT NULL DEFAULT 5,
      local_auth_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      password_min_length INTEGER NOT NULL DEFAULT 10,
      password_require_uppercase BOOLEAN NOT NULL DEFAULT FALSE,
      password_require_number BOOLEAN NOT NULL DEFAULT FALSE,
      password_require_symbol BOOLEAN NOT NULL DEFAULT FALSE,
      audit_export_max_rows INTEGER NOT NULL DEFAULT 2000,
      backup_retention_days INTEGER NOT NULL DEFAULT 30,
      updated_at TEXT NOT NULL,
      updated_by_user_id TEXT
    )
  `);

  await ensureColumn('projects', 'workspace_mode', `ALTER TABLE projects ADD COLUMN workspace_mode TEXT NOT NULL DEFAULT 'solo'`);
  await ensureColumn('variables', 'derived_from_code_id', `ALTER TABLE variables ADD COLUMN derived_from_code_id TEXT`);
  await ensureColumn('variables', 'derivation_rule', `ALTER TABLE variables ADD COLUMN derivation_rule TEXT NOT NULL DEFAULT 'presence'`);
  await ensureColumn('users', 'expires_at', `ALTER TABLE users ADD COLUMN expires_at TEXT`);
  await ensureColumn('sources', 'content_text', `ALTER TABLE sources ADD COLUMN content_text TEXT NOT NULL DEFAULT ''`);
  await ensureColumn('sources', 'content_url', `ALTER TABLE sources ADD COLUMN content_url TEXT`);
  await ensureColumn('transcript_sync_links', 'speaker_label', `ALTER TABLE transcript_sync_links ADD COLUMN speaker_label TEXT NOT NULL DEFAULT ''`);
  await ensureColumn('transcript_sync_links', 'confidence', `ALTER TABLE transcript_sync_links ADD COLUMN confidence REAL`);
  await ensureColumn('transcript_sync_links', 'sync_score', `ALTER TABLE transcript_sync_links ADD COLUMN sync_score REAL`);
  await ensureColumn('transcript_sync_links', 'token_timeline_json', `ALTER TABLE transcript_sync_links ADD COLUMN token_timeline_json TEXT NOT NULL DEFAULT '[]'`);
  await ensureColumn('transcription_jobs', 'pipeline_json', `ALTER TABLE transcription_jobs ADD COLUMN pipeline_json TEXT NOT NULL DEFAULT '{}'`);
  await ensureColumn('transcription_jobs', 'progress_percent', `ALTER TABLE transcription_jobs ADD COLUMN progress_percent INTEGER NOT NULL DEFAULT 0`);
  await ensureColumn('transcription_jobs', 'started_at', `ALTER TABLE transcription_jobs ADD COLUMN started_at TEXT`);
  await ensureColumn('transcription_jobs', 'error_message', `ALTER TABLE transcription_jobs ADD COLUMN error_message TEXT`);
  await ensureColumn('external_sql_import_jobs', 'max_rows', `ALTER TABLE external_sql_import_jobs ADD COLUMN max_rows INTEGER NOT NULL DEFAULT 500`);
  await ensureColumn('external_sql_import_jobs', 'schedule_enabled', `ALTER TABLE external_sql_import_jobs ADD COLUMN schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
  await ensureColumn('external_sql_import_jobs', 'schedule_interval_minutes', `ALTER TABLE external_sql_import_jobs ADD COLUMN schedule_interval_minutes INTEGER`);
  await ensureColumn('external_sql_import_jobs', 'schedule_next_run_at', `ALTER TABLE external_sql_import_jobs ADD COLUMN schedule_next_run_at TEXT`);
  await ensureColumn('external_sql_import_jobs', 'last_run_at', `ALTER TABLE external_sql_import_jobs ADD COLUMN last_run_at TEXT`);
  await ensureColumn('external_sql_import_jobs', 'last_run_status', `ALTER TABLE external_sql_import_jobs ADD COLUMN last_run_status TEXT`);
  await ensureColumn('external_sql_import_jobs', 'last_run_message', `ALTER TABLE external_sql_import_jobs ADD COLUMN last_run_message TEXT`);
  await ensureColumn('coding_merge_governance_policies', 'required_approval_count_for_high_risk', `ALTER TABLE coding_merge_governance_policies ADD COLUMN required_approval_count_for_high_risk INTEGER NOT NULL DEFAULT 1`);
  await ensureColumn('coding_merge_governance_policies', 'approval_expiry_hours', `ALTER TABLE coding_merge_governance_policies ADD COLUMN approval_expiry_hours INTEGER NOT NULL DEFAULT 168`);
  await ensureColumn('governance_policies', 'session_absolute_timeout_minutes', `ALTER TABLE governance_policies ADD COLUMN session_absolute_timeout_minutes INTEGER NOT NULL DEFAULT 720`);
  await ensureColumn('governance_policies', 'local_auth_enabled', `ALTER TABLE governance_policies ADD COLUMN local_auth_enabled BOOLEAN NOT NULL DEFAULT TRUE`);
  await ensureColumn('governance_policies', 'password_min_length', `ALTER TABLE governance_policies ADD COLUMN password_min_length INTEGER NOT NULL DEFAULT 10`);
  await ensureColumn('governance_policies', 'password_require_uppercase', `ALTER TABLE governance_policies ADD COLUMN password_require_uppercase BOOLEAN NOT NULL DEFAULT FALSE`);
  await ensureColumn('governance_policies', 'password_require_number', `ALTER TABLE governance_policies ADD COLUMN password_require_number BOOLEAN NOT NULL DEFAULT FALSE`);
  await ensureColumn('governance_policies', 'password_require_symbol', `ALTER TABLE governance_policies ADD COLUMN password_require_symbol BOOLEAN NOT NULL DEFAULT FALSE`);

  try {
    await pool.query(`ALTER TABLE users ALTER COLUMN expires_at DROP NOT NULL`);
  } catch {
    // No-op when the column is already nullable or the engine does not require the migration.
  }

  await pool.query(`
    UPDATE users
    SET expires_at = COALESCE(expires_at, to_char((created_at::timestamptz + interval '5 years') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    WHERE role <> 'professor'
  `);
  await pool.query(`UPDATE users SET role = 'professor' WHERE role = 'instructor'`);
  await pool.query(`
    UPDATE users
    SET username = 'professor'
    WHERE username = 'instructor'
      AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'professor')
  `);
  await pool.query(`UPDATE users SET expires_at = NULL WHERE role = 'professor'`);
  await pool.query(`
    INSERT INTO governance_policies (
      id,
      idle_timeout_minutes,
      session_absolute_timeout_minutes,
      login_throttle_window_minutes,
      login_throttle_max_failures,
      local_auth_enabled,
      password_min_length,
      password_require_uppercase,
      password_require_number,
      password_require_symbol,
      audit_export_max_rows,
      backup_retention_days,
      updated_at,
      updated_by_user_id
    )
    VALUES ('global', 90, 720, 15, 5, TRUE, 10, FALSE, FALSE, FALSE, 2000, 30, NOW()::text, NULL)
    ON CONFLICT (id) DO NOTHING
  `);
}

async function seedDemoData(): Promise<void> {
  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM users');
  if (Number(rows[0].count) > 0) return;

  const timestamp = nowIso();
  const passwordHash = await bcrypt.hash('demo123', 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO users (id, username, password_hash, role, created_at, expires_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      ['user-demo-student', 'student1', passwordHash, 'student', timestamp, addYearsIso(timestamp, 5)]
    );
    await client.query(
      `INSERT INTO projects (id, name, workspace_mode, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      ['project-demo', 'Mixed Methods Demo',
        'collaborative',
        'Starter project for web-native qualitative and quantitative analysis.',
        timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO memberships (user_id, project_id, role, joined_at) VALUES ($1,$2,$3,$4)`,
      ['user-demo-student', 'project-demo', 'owner', timestamp]
    );
    await client.query(
      `INSERT INTO sources (id, project_id, kind, title, language, content_type, content_url, content_text, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      ['source-demo', 'project-demo', 'transcript', 'Interview 001', 'en', 'text/plain',
        null,
        "Interviewer: How do you feel about the process?\nParticipant: I'm not sure I can trust the process anymore.",
        timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO codes (id, project_id, parent_code_id, name, description, color_token, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['code-trust', 'project-demo', null, 'Trust Concern',
        'Participant expresses uncertainty, skepticism, or loss of confidence.',
        'blue', timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO variables (id, project_id, name, label, kind, source_kind, derived_from_code_id, derivation_rule, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      ['variable-trust', 'project-demo', 'trust_concern_flag', 'Trust concern flagged',
        'binary', 'derived_code', 'code-trust', 'presence', timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO cases (id, project_id, label, source_ids_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      ['case-demo-001', 'project-demo', 'Participant 001',
        JSON.stringify(['source-demo']), timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO memos (id, project_id, target_type, target_id, title, body, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['memo-demo-001', 'project-demo', 'source', 'source-demo', 'Trust as an analytic theme',
        'This source shows an early trust concern that can be traced into a binary variable later.',
        timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO attributes (id, project_id, target_type, target_id, name, value_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['attribute-demo-001', 'project-demo', 'case', 'case-demo-001', 'department',
        JSON.stringify('Admissions'), timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO project_messages (id, project_id, user_id, body, created_at) VALUES ($1,$2,$3,$4,$5)`,
      ['message-demo-001', 'project-demo', 'user-demo-student',
        'Welcome to the collaborative workspace. Use chat to coordinate coding decisions.', timestamp]
    );
    await client.query(
      `INSERT INTO segments (id, project_id, source_id, kind, anchor_json, text, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['segment-demo-001', 'project-demo', 'source-demo', 'text_range',
        JSON.stringify({ kind: 'text_range', start: 0, end: 52 }),
        "I'm not sure I can trust the process anymore.",
        timestamp, timestamp]
    );
    await client.query(
      `INSERT INTO code_applications (id, project_id, segment_id, code_id, case_id, coder_id, confidence, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['application-demo-001', 'project-demo', 'segment-demo-001',
        'code-trust', 'case-demo-001', 'system', 1.0, timestamp]
    );
    await client.query(
      `INSERT INTO trace_links (variable_id, case_id, supporting_code_application_ids_json) VALUES ($1,$2,$3)`,
      ['variable-trust', 'case-demo-001', JSON.stringify(['application-demo-001'])]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function removeLegacyDemoProfessor(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: professorRows } = await client.query(
      `SELECT id FROM users WHERE username = 'professor' LIMIT 1`
    );
    if (professorRows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    const professorId = professorRows[0].id as string;

    const { rows: studentRows } = await client.query(
      `SELECT id FROM users WHERE username = 'student1' LIMIT 1`
    );

    if (studentRows.length > 0) {
      const studentId = studentRows[0].id as string;
      await client.query(
        `INSERT INTO memberships (user_id, project_id, role, joined_at)
         SELECT $1, project_id, 'owner', $2
         FROM memberships
         WHERE user_id = $3
         ON CONFLICT (user_id, project_id) DO UPDATE SET role = EXCLUDED.role`,
        [studentId, nowIso(), professorId]
      );
      await client.query(
        `UPDATE project_messages SET user_id = $1 WHERE user_id = $2`,
        [studentId, professorId]
      );
    }

    await client.query(`DELETE FROM project_presence WHERE user_id = $1`, [professorId]);
    await client.query(`DELETE FROM memberships WHERE user_id = $1`, [professorId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [professorId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initDatabase(): Promise<void> {
  await execSchema();
  await removeLegacyDemoProfessor();
  await deleteExpiredUsers();
  await seedDemoData();
}

export function getDbHost(): string {
  if (isPortableMode) {
    return `portable:${portableDbDir}`;
  }
  const url = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/mu_statistics';
  try { return new URL(url).host; } catch { return url; }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function deleteExpiredUsers(): Promise<number> {
  const { rowCount } = await pool.query(
    `DELETE FROM users WHERE expires_at IS NOT NULL AND expires_at <= $1`,
    [nowIso()]
  );
  return rowCount ?? 0;
}

export async function createUserRecord(id: string, username: string, password: string, role: 'student' | 'professor'): Promise<User> {
  const hash = await bcrypt.hash(password, 10);
  const timestamp = nowIso();
  const expiresAt = role === 'professor' ? null : addYearsIso(timestamp, 5);
  await pool.query(
    `INSERT INTO users (id, username, password_hash, role, created_at, expires_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, username, hash, role, timestamp, expiresAt]
  );
  return { id, username, role, createdAt: timestamp, expiresAt };
}

export async function findUserByUsername(username: string): Promise<{ user: User; passwordHash: string } | null> {
  const { rows } = await pool.query(
    `SELECT id, username, password_hash, role, created_at, expires_at FROM users WHERE username = $1 LIMIT 1`,
    [username]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return { user: { id: r.id, username: r.username, role: r.role, createdAt: r.created_at, expiresAt: r.expires_at }, passwordHash: r.password_hash };
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query(
    `SELECT id, username, role, created_at, expires_at FROM users WHERE id = $1 LIMIT 1`, [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return { id: r.id, username: r.username, role: r.role, createdAt: r.created_at, expiresAt: r.expires_at };
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Memberships ───────────────────────────────────────────────────────────────

export async function addMembership(userId: string, projectId: string, role: MembershipRole): Promise<void> {
  await pool.query(
    `INSERT INTO memberships (user_id, project_id, role, joined_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, project_id) DO UPDATE SET role = EXCLUDED.role`,
    [userId, projectId, role, nowIso()]
  );
}

export async function getProjectMembership(userId: string, projectId: string): Promise<ProjectMembership | null> {
  const { rows } = await pool.query(
    `SELECT user_id, project_id, role, joined_at
     FROM memberships
     WHERE user_id = $1 AND project_id = $2
     LIMIT 1`,
    [userId, projectId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    userId: row.user_id,
    projectId: row.project_id,
    role: row.role,
    joinedAt: row.joined_at
  };
}

export async function countProjectOwners(projectId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS n FROM memberships WHERE project_id = $1 AND role = 'owner'`,
    [projectId]
  );
  return Number(rows[0]?.n ?? 0);
}

export async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM memberships WHERE user_id = $1 AND project_id = $2 LIMIT 1`,
    [userId, projectId]
  );
  return rows.length > 0;
}

export async function listProjectMembers(projectId: string): Promise<Array<{ userId: string; username: string; role: MembershipRole; userRole: 'student' | 'professor' }>> {
  const { rows } = await pool.query(
    `SELECT m.user_id, u.username, u.role AS user_role, m.role
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.project_id = $1
     ORDER BY m.joined_at ASC`,
    [projectId]
  );
  return rows.map((r) => ({ userId: r.user_id, username: r.username, role: r.role, userRole: r.user_role }));
}

export async function removeMembership(userId: string, projectId: string): Promise<void> {
  await pool.query(`DELETE FROM memberships WHERE user_id = $1 AND project_id = $2`, [userId, projectId]);
}

// ── Presence ──────────────────────────────────────────────────────────────────

export async function touchProjectPresence(userId: string, projectId: string, role: 'student' | 'professor'): Promise<void> {
  await pool.query(
    `INSERT INTO project_presence (user_id, project_id, role, last_seen_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, project_id) DO UPDATE SET role = EXCLUDED.role, last_seen_at = EXCLUDED.last_seen_at`,
    [userId, projectId, role, nowIso()]
  );
}

export async function clearUserPresence(userId: string): Promise<void> {
  await pool.query(`DELETE FROM project_presence WHERE user_id = $1`, [userId]);
}

export async function listProjectPresence(projectId: string, activeWithinSeconds = 30): Promise<ProjectPresence[]> {
  const cutoff = new Date(Date.now() - activeWithinSeconds * 1000).toISOString();
  const { rows } = await pool.query(
    `SELECT pp.user_id, u.username, pp.role, pp.project_id, pp.last_seen_at
     FROM project_presence pp
     JOIN users u ON u.id = pp.user_id
     WHERE pp.project_id = $1 AND pp.last_seen_at >= $2
     ORDER BY pp.last_seen_at DESC`,
    [projectId, cutoff]
  );
  return rows.map((r) => ({
    userId: r.user_id,
    username: r.username,
    role: r.role,
    projectId: r.project_id,
    lastSeenAt: r.last_seen_at
  }));
}

export async function listProjectMessages(projectId: string, limit = 100): Promise<ProjectMessage[]> {
  const { rows } = await pool.query(
    `SELECT pm.id, pm.project_id, pm.user_id, u.username, pm.body, pm.created_at
     FROM project_messages pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.created_at ASC
     LIMIT $2`,
    [projectId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    username: r.username,
    body: r.body,
    createdAt: r.created_at
  }));
}

export async function insertProjectMessage(message: Omit<ProjectMessage, 'username'>): Promise<ProjectMessage> {
  await pool.query(
    `INSERT INTO project_messages (id, project_id, user_id, body, created_at) VALUES ($1,$2,$3,$4,$5)`,
    [message.id, message.projectId, message.userId, message.body, message.createdAt]
  );
  await touchProject(message.projectId);
  const { rows } = await pool.query(
    `SELECT pm.id, pm.project_id, pm.user_id, u.username, pm.body, pm.created_at
     FROM project_messages pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.id = $1
     LIMIT 1`,
    [message.id]
  );
  if (rows.length === 0) throw new Error('Message not found.');
  const row = rows[0];
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    username: row.username,
    body: row.body,
    createdAt: row.created_at
  };
}

export async function listSavedTransforms(projectId: string): Promise<SavedTransform[]> {
  const { rows } = await pool.query(
    `SELECT * FROM saved_transforms WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    filtersJson: row.filters_json,
    recodesJson: row.recodes_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listSavedQualitativeQueries(projectId: string): Promise<SavedQualitativeQuery[]> {
  const { rows } = await pool.query(
    `SELECT * FROM saved_qualitative_queries WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    mode: row.mode,
    queryJson: row.query_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listSavedAnalysisJobs(projectId: string): Promise<SavedAnalysisJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM saved_analysis_jobs WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    analysisKind: row.analysis_kind,
    analysisJson: row.analysis_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

function parseCodingAssignmentStatus(value: unknown): CodingAssignmentStatus {
  return value === 'in_progress' || value === 'blocked' || value === 'done'
    ? value
    : 'todo';
}

function parseCodingAssignmentPriority(value: unknown): CodingAssignmentPriority {
  return value === 'low' || value === 'high'
    ? value
    : 'normal';
}

function mapCodingAssignmentRow(row: any): CodingAssignment {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? '',
    sourceId: row.source_id ?? null,
    codeId: row.code_id ?? null,
    caseId: row.case_id ?? null,
    assigneeUserId: row.assignee_user_id ?? null,
    assigneeUsername: row.assignee_username ?? null,
    status: parseCodingAssignmentStatus(row.status),
    priority: parseCodingAssignmentPriority(row.priority),
    dueAt: row.due_at ?? null,
    createdByUserId: row.created_by_user_id ?? null,
    createdByUsername: row.created_by_username ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null
  };
}

export async function listCodingAssignments(
  projectId: string,
  options?: { status?: CodingAssignmentStatus; assigneeUserId?: string }
): Promise<CodingAssignment[]> {
  const conditions = ['ca.project_id = $1'];
  const params: unknown[] = [projectId];
  let idx = 2;
  if (options?.status) {
    conditions.push(`ca.status = $${idx++}`);
    params.push(options.status);
  }
  if (options?.assigneeUserId) {
    conditions.push(`ca.assignee_user_id = $${idx++}`);
    params.push(options.assigneeUserId);
  }
  const { rows } = await pool.query(
    `SELECT
      ca.*,
      assignee.username AS assignee_username
     FROM coding_assignments ca
     LEFT JOIN users assignee ON assignee.id = ca.assignee_user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY
       CASE ca.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
       CASE ca.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'blocked' THEN 2 ELSE 3 END,
       COALESCE(ca.due_at, '9999-12-31T23:59:59.999Z') ASC,
       ca.created_at DESC`,
    params
  );
  return rows.map(mapCodingAssignmentRow);
}

export async function getCodingAssignment(id: string, projectId: string): Promise<CodingAssignment | null> {
  const { rows } = await pool.query(
    `SELECT
      ca.*,
      assignee.username AS assignee_username
     FROM coding_assignments ca
     LEFT JOIN users assignee ON assignee.id = ca.assignee_user_id
     WHERE ca.id = $1 AND ca.project_id = $2
     LIMIT 1`,
    [id, projectId]
  );
  if (rows.length === 0) return null;
  return mapCodingAssignmentRow(rows[0]);
}

export async function insertCodingAssignment(task: CodingAssignment): Promise<CodingAssignment> {
  await pool.query(
    `INSERT INTO coding_assignments (
      id, project_id, title, description, source_id, code_id, case_id, assignee_user_id,
      status, priority, due_at, created_by_user_id, created_by_username, created_at, updated_at, completed_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      task.id,
      task.projectId,
      task.title,
      task.description,
      task.sourceId,
      task.codeId,
      task.caseId,
      task.assigneeUserId,
      task.status,
      task.priority,
      task.dueAt,
      task.createdByUserId,
      task.createdByUsername,
      task.createdAt,
      task.updatedAt,
      task.completedAt
    ]
  );
  await touchProject(task.projectId);
  return (await getCodingAssignment(task.id, task.projectId)) ?? task;
}

export async function updateCodingAssignment(task: CodingAssignment): Promise<CodingAssignment> {
  const result = await pool.query(
    `UPDATE coding_assignments
     SET title = $3,
         description = $4,
         source_id = $5,
         code_id = $6,
         case_id = $7,
         assignee_user_id = $8,
         status = $9,
         priority = $10,
         due_at = $11,
         updated_at = $12,
         completed_at = $13
     WHERE id = $1 AND project_id = $2`,
    [
      task.id,
      task.projectId,
      task.title,
      task.description,
      task.sourceId,
      task.codeId,
      task.caseId,
      task.assigneeUserId,
      task.status,
      task.priority,
      task.dueAt,
      task.updatedAt,
      task.completedAt
    ]
  );
  if ((result.rowCount ?? 0) < 1) {
    throw new Error('Coding assignment not found.');
  }
  await touchProject(task.projectId);
  return (await getCodingAssignment(task.id, task.projectId)) ?? task;
}

export async function deleteCodingAssignment(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM coding_assignments WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  const removed = (result.rowCount ?? 0) > 0;
  if (removed) await touchProject(projectId);
  return removed;
}

function parseCodingConflictResolutionStatus(value: unknown): CodingConflictResolutionStatus {
  return value === 'deferred' || value === 'reopened' || value === 'restored'
    ? value
    : 'resolved';
}

function mapCodingConflictResolutionRow(row: any): CodingConflictResolution {
  return {
    id: row.id,
    projectId: row.project_id,
    segmentId: row.segment_id,
    codeId: row.code_id,
    status: parseCodingConflictResolutionStatus(row.status),
    keepMode: row.keep_mode ?? null,
    keepApplicationId: row.keep_application_id ?? null,
    keepCoderId: row.keep_coder_id ?? null,
    removedApplicationIdsJson: row.removed_application_ids_json ?? '[]',
    removedCount: Number(row.removed_count ?? 0),
    resolutionNote: row.resolution_note ?? '',
    actorUserId: row.actor_user_id ?? null,
    actorUsername: row.actor_username ?? '',
    metadataJson: row.metadata_json ?? '{}',
    createdAt: row.created_at
  };
}

export async function insertCodingConflictResolution(resolution: CodingConflictResolution): Promise<CodingConflictResolution> {
  await pool.query(
    `INSERT INTO coding_conflict_resolutions (
      id, project_id, segment_id, code_id, status, keep_mode, keep_application_id, keep_coder_id,
      removed_application_ids_json, removed_count, resolution_note, actor_user_id, actor_username, metadata_json, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      resolution.id,
      resolution.projectId,
      resolution.segmentId,
      resolution.codeId,
      resolution.status,
      resolution.keepMode,
      resolution.keepApplicationId,
      resolution.keepCoderId,
      resolution.removedApplicationIdsJson,
      resolution.removedCount,
      resolution.resolutionNote,
      resolution.actorUserId,
      resolution.actorUsername,
      resolution.metadataJson,
      resolution.createdAt
    ]
  );
  await touchProject(resolution.projectId);
  return resolution;
}

export async function getCodingConflictResolution(id: string, projectId: string): Promise<CodingConflictResolution | null> {
  const { rows } = await pool.query(
    `SELECT * FROM coding_conflict_resolutions WHERE id = $1 AND project_id = $2 LIMIT 1`,
    [id, projectId]
  );
  if (rows.length === 0) return null;
  return mapCodingConflictResolutionRow(rows[0]);
}

export async function listCodingConflictResolutions(
  projectId: string,
  options?: { segmentId?: string; codeId?: string; limit?: number }
): Promise<CodingConflictResolution[]> {
  const conditions = ['project_id = $1'];
  const params: unknown[] = [projectId];
  let idx = 2;
  if (options?.segmentId) {
    conditions.push(`segment_id = $${idx++}`);
    params.push(options.segmentId);
  }
  if (options?.codeId) {
    conditions.push(`code_id = $${idx++}`);
    params.push(options.codeId);
  }
  const limit = Math.max(1, Math.min(2000, Math.floor(options?.limit ?? 250)));
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM coding_conflict_resolutions
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${idx}`,
    params
  );
  return rows.map(mapCodingConflictResolutionRow);
}

export async function listLatestCodingConflictResolutions(projectId: string): Promise<CodingConflictResolution[]> {
  const { rows } = await pool.query(
    `SELECT * FROM coding_conflict_resolutions WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId]
  );
  const seen = new Set<string>();
  const latest: CodingConflictResolution[] = [];
  for (const row of rows) {
    const key = `${row.segment_id}::${row.code_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(mapCodingConflictResolutionRow(row));
  }
  return latest;
}

function parseCodingCalibrationSessionStatus(value: unknown): CodingCalibrationSessionStatus {
  return value === 'running' || value === 'completed' || value === 'archived'
    ? value
    : 'draft';
}

function mapCodingCalibrationSessionRow(row: any): CodingCalibrationSession {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    scopeJson: row.scope_json ?? '{}',
    targetCodeId: row.target_code_id ?? null,
    coderAId: row.coder_a_id ?? null,
    coderBId: row.coder_b_id ?? null,
    sampleSegmentIdsJson: row.sample_segment_ids_json ?? '[]',
    status: parseCodingCalibrationSessionStatus(row.status),
    targetAgreement: Number(row.target_agreement ?? 0.8),
    targetKappa: Number(row.target_kappa ?? 0.7),
    minSamples: Number(row.min_samples ?? 25),
    latestResultJson: row.latest_result_json ?? '{}',
    createdByUserId: row.created_by_user_id ?? null,
    createdByUsername: row.created_by_username ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null
  };
}

export async function listCodingCalibrationSessions(
  projectId: string,
  options?: { status?: CodingCalibrationSessionStatus; limit?: number }
): Promise<CodingCalibrationSession[]> {
  const conditions = ['project_id = $1'];
  const params: unknown[] = [projectId];
  let idx = 2;
  if (options?.status) {
    conditions.push(`status = $${idx++}`);
    params.push(options.status);
  }
  const limit = Math.max(1, Math.min(2000, Math.floor(options?.limit ?? 200)));
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM coding_calibration_sessions
     WHERE ${conditions.join(' AND ')}
     ORDER BY updated_at DESC, created_at DESC
     LIMIT $${idx}`,
    params
  );
  return rows.map(mapCodingCalibrationSessionRow);
}

export async function getCodingCalibrationSession(id: string, projectId: string): Promise<CodingCalibrationSession | null> {
  const { rows } = await pool.query(
    `SELECT * FROM coding_calibration_sessions WHERE id = $1 AND project_id = $2 LIMIT 1`,
    [id, projectId]
  );
  if (rows.length === 0) return null;
  return mapCodingCalibrationSessionRow(rows[0]);
}

export async function insertCodingCalibrationSession(session: CodingCalibrationSession): Promise<CodingCalibrationSession> {
  await pool.query(
    `INSERT INTO coding_calibration_sessions (
      id, project_id, label, scope_json, target_code_id, coder_a_id, coder_b_id, sample_segment_ids_json,
      status, target_agreement, target_kappa, min_samples, latest_result_json, created_by_user_id,
      created_by_username, created_at, updated_at, completed_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      session.id,
      session.projectId,
      session.label,
      session.scopeJson,
      session.targetCodeId,
      session.coderAId,
      session.coderBId,
      session.sampleSegmentIdsJson,
      session.status,
      session.targetAgreement,
      session.targetKappa,
      session.minSamples,
      session.latestResultJson,
      session.createdByUserId,
      session.createdByUsername,
      session.createdAt,
      session.updatedAt,
      session.completedAt
    ]
  );
  await touchProject(session.projectId);
  return (await getCodingCalibrationSession(session.id, session.projectId)) ?? session;
}

export async function updateCodingCalibrationSession(session: CodingCalibrationSession): Promise<CodingCalibrationSession> {
  const result = await pool.query(
    `UPDATE coding_calibration_sessions
     SET label = $3,
         scope_json = $4,
         target_code_id = $5,
         coder_a_id = $6,
         coder_b_id = $7,
         sample_segment_ids_json = $8,
         status = $9,
         target_agreement = $10,
         target_kappa = $11,
         min_samples = $12,
         latest_result_json = $13,
         updated_at = $14,
         completed_at = $15
     WHERE id = $1 AND project_id = $2`,
    [
      session.id,
      session.projectId,
      session.label,
      session.scopeJson,
      session.targetCodeId,
      session.coderAId,
      session.coderBId,
      session.sampleSegmentIdsJson,
      session.status,
      session.targetAgreement,
      session.targetKappa,
      session.minSamples,
      session.latestResultJson,
      session.updatedAt,
      session.completedAt
    ]
  );
  if ((result.rowCount ?? 0) < 1) {
    throw new Error('Coding calibration session not found.');
  }
  await touchProject(session.projectId);
  return (await getCodingCalibrationSession(session.id, session.projectId)) ?? session;
}

function parseCodingConflictTriageStatus(value: unknown): CodingConflictTriageStatus {
  return value === 'in_review' || value === 'ready_to_merge' || value === 'deferred' || value === 'escalated' || value === 'resolved'
    ? value
    : 'open';
}

function parseCodingConflictTriageSeverity(value: unknown): CodingConflictTriageSeverity {
  return value === 'low' || value === 'high' || value === 'critical'
    ? value
    : 'medium';
}

function mapCodingConflictTriageRow(row: any): CodingConflictTriage {
  return {
    id: row.id,
    projectId: row.project_id,
    segmentId: row.segment_id,
    codeId: row.code_id,
    status: parseCodingConflictTriageStatus(row.status),
    severity: parseCodingConflictTriageSeverity(row.severity),
    assigneeUserId: row.assignee_user_id ?? null,
    assigneeUsername: row.assignee_username ?? null,
    reviewerUserId: row.reviewer_user_id ?? null,
    reviewerUsername: row.reviewer_username ?? null,
    dueAt: row.due_at ?? null,
    triageNote: row.triage_note ?? '',
    labelsJson: row.labels_json ?? '[]',
    metadataJson: row.metadata_json ?? '{}',
    createdByUserId: row.created_by_user_id ?? null,
    createdByUsername: row.created_by_username ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getCodingConflictTriage(projectId: string, segmentId: string, codeId: string): Promise<CodingConflictTriage | null> {
  const { rows } = await pool.query(
    `SELECT
      cct.*,
      assignee.username AS assignee_username,
      reviewer.username AS reviewer_username
     FROM coding_conflict_triage cct
     LEFT JOIN users assignee ON assignee.id = cct.assignee_user_id
     LEFT JOIN users reviewer ON reviewer.id = cct.reviewer_user_id
     WHERE cct.project_id = $1 AND cct.segment_id = $2 AND cct.code_id = $3
     LIMIT 1`,
    [projectId, segmentId, codeId]
  );
  if (rows.length === 0) return null;
  return mapCodingConflictTriageRow(rows[0]);
}

export async function listCodingConflictTriages(
  projectId: string,
  options?: {
    status?: CodingConflictTriageStatus;
    severity?: CodingConflictTriageSeverity;
    assigneeUserId?: string;
    limit?: number;
  }
): Promise<CodingConflictTriage[]> {
  const conditions = ['cct.project_id = $1'];
  const params: unknown[] = [projectId];
  let idx = 2;
  if (options?.status) {
    conditions.push(`cct.status = $${idx++}`);
    params.push(options.status);
  }
  if (options?.severity) {
    conditions.push(`cct.severity = $${idx++}`);
    params.push(options.severity);
  }
  if (options?.assigneeUserId) {
    conditions.push(`cct.assignee_user_id = $${idx++}`);
    params.push(options.assigneeUserId);
  }
  const limit = Math.max(1, Math.min(5000, Math.floor(options?.limit ?? 1000)));
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT
      cct.*,
      assignee.username AS assignee_username,
      reviewer.username AS reviewer_username
     FROM coding_conflict_triage cct
     LEFT JOIN users assignee ON assignee.id = cct.assignee_user_id
     LEFT JOIN users reviewer ON reviewer.id = cct.reviewer_user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY
       CASE cct.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       COALESCE(cct.due_at, '9999-12-31T23:59:59.999Z') ASC,
       cct.updated_at DESC
     LIMIT $${idx}`,
    params
  );
  return rows.map(mapCodingConflictTriageRow);
}

export async function upsertCodingConflictTriage(item: CodingConflictTriage): Promise<CodingConflictTriage> {
  await pool.query(
    `INSERT INTO coding_conflict_triage (
      id, project_id, segment_id, code_id, status, severity, assignee_user_id, reviewer_user_id,
      due_at, triage_note, labels_json, metadata_json, created_by_user_id, created_by_username, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    ON CONFLICT (project_id, segment_id, code_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      severity = EXCLUDED.severity,
      assignee_user_id = EXCLUDED.assignee_user_id,
      reviewer_user_id = EXCLUDED.reviewer_user_id,
      due_at = EXCLUDED.due_at,
      triage_note = EXCLUDED.triage_note,
      labels_json = EXCLUDED.labels_json,
      metadata_json = EXCLUDED.metadata_json,
      updated_at = EXCLUDED.updated_at`,
    [
      item.id,
      item.projectId,
      item.segmentId,
      item.codeId,
      item.status,
      item.severity,
      item.assigneeUserId,
      item.reviewerUserId,
      item.dueAt,
      item.triageNote,
      item.labelsJson,
      item.metadataJson,
      item.createdByUserId,
      item.createdByUsername,
      item.createdAt,
      item.updatedAt
    ]
  );
  await touchProject(item.projectId);
  const saved = await getCodingConflictTriage(item.projectId, item.segmentId, item.codeId);
  if (!saved) throw new Error('Failed to save coding conflict triage.');
  return saved;
}

export async function getCodingMergeGovernancePolicy(projectId: string): Promise<CodingMergeGovernancePolicy> {
  const { rows } = await pool.query(
    `SELECT * FROM coding_merge_governance_policies WHERE project_id = $1 LIMIT 1`,
    [projectId]
  );
  const row = rows[0];
  return {
    projectId,
    requireResolutionNote: row ? Boolean(row.require_resolution_note) : true,
    restrictResolutionToOwnerOrProfessor: row ? Boolean(row.restrict_resolution_to_owner_or_professor) : true,
    requireSecondReviewerForHighRisk: row ? Boolean(row.require_second_reviewer_for_high_risk) : true,
    highRiskMinCoderCount: Number(row?.high_risk_min_coder_count ?? 3),
    highRiskMinConfidenceSpread: Number(row?.high_risk_min_confidence_spread ?? 0.35),
    requiredApprovalCountForHighRisk: Number(row?.required_approval_count_for_high_risk ?? 1),
    approvalExpiryHours: Number(row?.approval_expiry_hours ?? 168),
    defaultTriageSlaHours: Number(row?.default_triage_sla_hours ?? 72),
    updatedAt: row?.updated_at ?? nowIso(),
    updatedByUserId: row?.updated_by_user_id ?? null
  };
}

export async function upsertCodingMergeGovernancePolicy(input: CodingMergeGovernancePolicy): Promise<CodingMergeGovernancePolicy> {
  await pool.query(
    `INSERT INTO coding_merge_governance_policies (
      project_id, require_resolution_note, restrict_resolution_to_owner_or_professor,
      require_second_reviewer_for_high_risk, high_risk_min_coder_count, high_risk_min_confidence_spread,
      required_approval_count_for_high_risk, approval_expiry_hours, default_triage_sla_hours, updated_at, updated_by_user_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (project_id) DO UPDATE SET
      require_resolution_note = EXCLUDED.require_resolution_note,
      restrict_resolution_to_owner_or_professor = EXCLUDED.restrict_resolution_to_owner_or_professor,
      require_second_reviewer_for_high_risk = EXCLUDED.require_second_reviewer_for_high_risk,
      high_risk_min_coder_count = EXCLUDED.high_risk_min_coder_count,
      high_risk_min_confidence_spread = EXCLUDED.high_risk_min_confidence_spread,
      required_approval_count_for_high_risk = EXCLUDED.required_approval_count_for_high_risk,
      approval_expiry_hours = EXCLUDED.approval_expiry_hours,
      default_triage_sla_hours = EXCLUDED.default_triage_sla_hours,
      updated_at = EXCLUDED.updated_at,
      updated_by_user_id = EXCLUDED.updated_by_user_id`,
    [
      input.projectId,
      input.requireResolutionNote,
      input.restrictResolutionToOwnerOrProfessor,
      input.requireSecondReviewerForHighRisk,
      input.highRiskMinCoderCount,
      input.highRiskMinConfidenceSpread,
      input.requiredApprovalCountForHighRisk,
      input.approvalExpiryHours,
      input.defaultTriageSlaHours,
      input.updatedAt,
      input.updatedByUserId
    ]
  );
  await touchProject(input.projectId);
  return getCodingMergeGovernancePolicy(input.projectId);
}

function mapCodingMergeApprovalRow(row: any): CodingMergeApproval {
  return {
    id: row.id,
    projectId: row.project_id,
    segmentId: row.segment_id,
    codeId: row.code_id,
    approvedByUserId: row.approved_by_user_id ?? null,
    approvedByUsername: row.approved_by_username ?? '',
    note: row.note ?? '',
    createdAt: row.created_at,
    usedAt: row.used_at ?? null,
    revokedAt: row.revoked_at ?? null
  };
}

export async function upsertCodingMergeApproval(approval: CodingMergeApproval): Promise<CodingMergeApproval> {
  await pool.query(
    `INSERT INTO coding_merge_approvals (
      id, project_id, segment_id, code_id, approved_by_user_id, approved_by_username, note, created_at, used_at, revoked_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (project_id, segment_id, code_id, approved_by_username)
    DO UPDATE SET
      approved_by_user_id = EXCLUDED.approved_by_user_id,
      note = EXCLUDED.note,
      created_at = EXCLUDED.created_at,
      used_at = EXCLUDED.used_at,
      revoked_at = EXCLUDED.revoked_at`,
    [
      approval.id,
      approval.projectId,
      approval.segmentId,
      approval.codeId,
      approval.approvedByUserId,
      approval.approvedByUsername,
      approval.note,
      approval.createdAt,
      approval.usedAt,
      approval.revokedAt
    ]
  );
  await touchProject(approval.projectId);
  const items = await listCodingMergeApprovals(approval.projectId, {
    segmentId: approval.segmentId,
    codeId: approval.codeId,
    limit: 200,
    includeUsed: true,
    includeRevoked: true
  });
  return items.find((item) => item.approvedByUsername === approval.approvedByUsername) ?? approval;
}

export async function listCodingMergeApprovals(
  projectId: string,
  options?: {
    segmentId?: string;
    codeId?: string;
    limit?: number;
    includeUsed?: boolean;
    includeRevoked?: boolean;
  }
): Promise<CodingMergeApproval[]> {
  const conditions = ['project_id = $1'];
  const params: unknown[] = [projectId];
  let idx = 2;
  if (options?.segmentId) {
    conditions.push(`segment_id = $${idx++}`);
    params.push(options.segmentId);
  }
  if (options?.codeId) {
    conditions.push(`code_id = $${idx++}`);
    params.push(options.codeId);
  }
  if (!options?.includeUsed) {
    conditions.push('used_at IS NULL');
  }
  if (!options?.includeRevoked) {
    conditions.push('revoked_at IS NULL');
  }
  const limit = Math.max(1, Math.min(5000, Math.floor(options?.limit ?? 1000)));
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM coding_merge_approvals
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${idx}`,
    params
  );
  return rows.map(mapCodingMergeApprovalRow);
}

export async function markCodingMergeApprovalsUsed(params: {
  projectId: string;
  segmentId: string;
  codeId: string;
  usedAt: string;
}): Promise<number> {
  const result = await pool.query(
    `UPDATE coding_merge_approvals
     SET used_at = $4
     WHERE project_id = $1 AND segment_id = $2 AND code_id = $3
       AND used_at IS NULL
       AND revoked_at IS NULL`,
    [params.projectId, params.segmentId, params.codeId, params.usedAt]
  );
  if ((result.rowCount ?? 0) > 0) await touchProject(params.projectId);
  return result.rowCount ?? 0;
}

export async function revokeCodingMergeApproval(params: {
  projectId: string;
  segmentId: string;
  codeId: string;
  approvedByUsername: string;
  revokedAt: string;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE coding_merge_approvals
     SET revoked_at = $5
     WHERE project_id = $1 AND segment_id = $2 AND code_id = $3 AND approved_by_username = $4`,
    [params.projectId, params.segmentId, params.codeId, params.approvedByUsername, params.revokedAt]
  );
  const updated = (result.rowCount ?? 0) > 0;
  if (updated) await touchProject(params.projectId);
  return updated;
}

export async function archiveCodeApplications(params: {
  resolutionId: string;
  projectId: string;
  applications: CodeApplication[];
  archivedAt: string;
  archivedByUserId: string | null;
  archivedByUsername: string;
}): Promise<void> {
  for (const application of params.applications) {
    await pool.query(
      `INSERT INTO archived_code_applications (
         id, resolution_id, project_id, application_id, segment_id, code_id, case_id, coder_id, confidence,
         original_created_at, archived_at, archived_by_user_id, archived_by_username
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        `${params.resolutionId}:${application.id}`,
        params.resolutionId,
        params.projectId,
        application.id,
        application.segmentId,
        application.codeId,
        application.caseId,
        application.coderId,
        application.confidence,
        application.createdAt,
        params.archivedAt,
        params.archivedByUserId,
        params.archivedByUsername
      ]
    );
  }
  await touchProject(params.projectId);
}

function mapArchivedCodeApplicationRow(row: any): ArchivedCodeApplication {
  return {
    id: row.id,
    resolutionId: row.resolution_id,
    projectId: row.project_id,
    applicationId: row.application_id,
    segmentId: row.segment_id,
    codeId: row.code_id,
    caseId: row.case_id ?? null,
    coderId: row.coder_id,
    confidence: Number(row.confidence ?? 1),
    originalCreatedAt: row.original_created_at,
    archivedAt: row.archived_at,
    archivedByUserId: row.archived_by_user_id ?? null,
    archivedByUsername: row.archived_by_username ?? '',
    restoredAt: row.restored_at ?? null,
    restoredByUserId: row.restored_by_user_id ?? null,
    restoredByUsername: row.restored_by_username ?? ''
  };
}

export async function listArchivedCodeApplicationsByResolution(
  resolutionId: string,
  projectId: string,
  includeRestored = false
): Promise<ArchivedCodeApplication[]> {
  const { rows } = await pool.query(
    `SELECT * FROM archived_code_applications
     WHERE resolution_id = $1 AND project_id = $2 ${includeRestored ? '' : 'AND restored_at IS NULL'}
     ORDER BY archived_at ASC`,
    [resolutionId, projectId]
  );
  return rows.map(mapArchivedCodeApplicationRow);
}

export async function restoreArchivedCodeApplications(params: {
  resolutionId: string;
  projectId: string;
  restoredAt: string;
  restoredByUserId: string | null;
  restoredByUsername: string;
}): Promise<{ restoredCount: number; restoredApplicationIds: string[] }> {
  const archived = await listArchivedCodeApplicationsByResolution(params.resolutionId, params.projectId, false);
  if (archived.length === 0) {
    return { restoredCount: 0, restoredApplicationIds: [] };
  }

  const restoredIds: string[] = [];
  for (const item of archived) {
    await pool.query(
      `INSERT INTO code_applications (id, project_id, segment_id, code_id, case_id, coder_id, confidence, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO NOTHING`,
      [
        item.applicationId,
        item.projectId,
        item.segmentId,
        item.codeId,
        item.caseId,
        item.coderId,
        item.confidence,
        item.originalCreatedAt
      ]
    );
    await pool.query(
      `UPDATE archived_code_applications
       SET restored_at = $3,
           restored_by_user_id = $4,
           restored_by_username = $5
       WHERE id = $1 AND project_id = $2`,
      [
        item.id,
        item.projectId,
        params.restoredAt,
        params.restoredByUserId,
        params.restoredByUsername
      ]
    );
    restoredIds.push(item.applicationId);
  }
  await touchProject(params.projectId);
  return { restoredCount: restoredIds.length, restoredApplicationIds: restoredIds };
}

export async function listTranscriptSyncLinks(projectId: string): Promise<TranscriptSyncLink[]> {
  const { rows } = await pool.query(
    `SELECT * FROM transcript_sync_links WHERE project_id = $1 ORDER BY start_ms ASC, created_at ASC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    mediaSourceId: row.media_source_id,
    transcriptSourceId: row.transcript_source_id,
    segmentId: row.segment_id ?? null,
    startMs: Number(row.start_ms ?? 0),
    endMs: Number(row.end_ms ?? 0),
    transcriptText: row.transcript_text ?? '',
    speakerLabel: row.speaker_label ?? '',
    confidence: typeof row.confidence === 'number' ? row.confidence : null,
    syncScore: typeof row.sync_score === 'number' ? row.sync_score : null,
    tokenTimelineJson: typeof row.token_timeline_json === 'string' ? row.token_timeline_json : '[]',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function insertTranscriptSyncLink(link: TranscriptSyncLink): Promise<TranscriptSyncLink> {
  await pool.query(
    `INSERT INTO transcript_sync_links (id, project_id, media_source_id, transcript_source_id, segment_id, start_ms, end_ms, transcript_text, speaker_label, confidence, sync_score, token_timeline_json, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      link.id,
      link.projectId,
      link.mediaSourceId,
      link.transcriptSourceId,
      link.segmentId,
      link.startMs,
      link.endMs,
      link.transcriptText,
      link.speakerLabel,
      link.confidence,
      link.syncScore,
      link.tokenTimelineJson,
      link.createdAt,
      link.updatedAt
    ]
  );
  await touchProject(link.projectId);
  return link;
}

export async function updateTranscriptSyncLink(link: TranscriptSyncLink): Promise<TranscriptSyncLink> {
  const result = await pool.query(
    `UPDATE transcript_sync_links
     SET media_source_id = $3,
         transcript_source_id = $4,
         segment_id = $5,
         start_ms = $6,
         end_ms = $7,
         transcript_text = $8,
         speaker_label = $9,
         confidence = $10,
         sync_score = $11,
         token_timeline_json = $12,
         updated_at = $13
     WHERE id = $1 AND project_id = $2`,
    [
      link.id,
      link.projectId,
      link.mediaSourceId,
      link.transcriptSourceId,
      link.segmentId,
      link.startMs,
      link.endMs,
      link.transcriptText,
      link.speakerLabel,
      link.confidence,
      link.syncScore,
      link.tokenTimelineJson,
      link.updatedAt
    ]
  );
  if (result.rowCount && result.rowCount < 1) {
    throw new Error('Transcript sync link not found.');
  }
  await touchProject(link.projectId);
  return link;
}

export async function deleteTranscriptSyncLink(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM transcript_sync_links WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteTranscriptSyncLinksByMediaSource(projectId: string, mediaSourceId: string): Promise<void> {
  await pool.query(
    `DELETE FROM transcript_sync_links WHERE project_id = $1 AND media_source_id = $2`,
    [projectId, mediaSourceId]
  );
}

export async function listTranscriptionJobs(projectId: string): Promise<TranscriptionJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM transcription_jobs WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    mediaSourceId: row.media_source_id,
    outputSourceId: row.output_source_id ?? null,
    status: row.status === 'running' || row.status === 'completed' || row.status === 'failed' ? row.status : 'queued',
    mode: row.mode === 'timeline_chunked' || row.mode === 'hybrid' ? row.mode : 'segment_assembly',
    note: row.note ?? '',
    pipelineJson: typeof row.pipeline_json === 'string' ? row.pipeline_json : '{}',
    progressPercent: Number.isFinite(Number(row.progress_percent)) ? Math.max(0, Math.min(100, Math.round(Number(row.progress_percent)))) : 0,
    startedAt: row.started_at ?? null,
    errorMessage: row.error_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null
  }));
}

export async function insertTranscriptionJob(job: TranscriptionJob): Promise<TranscriptionJob> {
  await pool.query(
    `INSERT INTO transcription_jobs (id, project_id, media_source_id, output_source_id, status, mode, note, pipeline_json, progress_percent, started_at, error_message, created_at, updated_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      job.id,
      job.projectId,
      job.mediaSourceId,
      job.outputSourceId,
      job.status,
      job.mode,
      job.note,
      job.pipelineJson,
      job.progressPercent,
      job.startedAt,
      job.errorMessage,
      job.createdAt,
      job.updatedAt,
      job.completedAt
    ]
  );
  await touchProject(job.projectId);
  return job;
}

export async function updateTranscriptionJob(job: TranscriptionJob): Promise<TranscriptionJob> {
  await pool.query(
    `UPDATE transcription_jobs
     SET output_source_id = $3,
         status = $4,
         mode = $5,
         note = $6,
         pipeline_json = $7,
         progress_percent = $8,
         started_at = $9,
         error_message = $10,
         updated_at = $11,
         completed_at = $12
     WHERE id = $1 AND project_id = $2`,
    [
      job.id,
      job.projectId,
      job.outputSourceId,
      job.status,
      job.mode,
      job.note,
      job.pipelineJson,
      job.progressPercent,
      job.startedAt,
      job.errorMessage,
      job.updatedAt,
      job.completedAt
    ]
  );
  await touchProject(job.projectId);
  return job;
}

export async function listExternalSqlProfiles(projectId: string): Promise<ExternalSqlProfile[]> {
  const { rows } = await pool.query(
    `SELECT * FROM external_sql_profiles WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    clientType: row.client_type === 'sqlserver' ? 'sqlserver' : 'postgres',
    connectionJson: row.connection_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listExternalSqlImportJobs(projectId: string): Promise<ExternalSqlImportJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM external_sql_import_jobs WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    profileId: row.profile_id,
    label: row.label,
    schemaName: row.schema_name,
    tableName: row.table_name,
    caseLabelColumn: row.case_label_column,
    selectedColumnsJson: row.selected_columns_json,
    variableColumnsJson: row.variable_columns_json,
    maxRows: Number(row.max_rows ?? 500),
    scheduleEnabled: Boolean(row.schedule_enabled),
    scheduleIntervalMinutes: row.schedule_interval_minutes === null || row.schedule_interval_minutes === undefined
      ? null
      : Number(row.schedule_interval_minutes),
    scheduleNextRunAt: row.schedule_next_run_at ?? null,
    lastRunAt: row.last_run_at ?? null,
    lastRunStatus: row.last_run_status === 'success' || row.last_run_status === 'error'
      ? row.last_run_status
      : null,
    lastRunMessage: row.last_run_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listDueExternalSqlImportJobs(dueBeforeIso: string, limit = 10): Promise<ExternalSqlImportJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM external_sql_import_jobs
     WHERE schedule_enabled = TRUE
       AND schedule_next_run_at IS NOT NULL
       AND schedule_next_run_at <= $1
     ORDER BY schedule_next_run_at ASC, updated_at ASC
     LIMIT $2`,
    [dueBeforeIso, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    profileId: row.profile_id,
    label: row.label,
    schemaName: row.schema_name,
    tableName: row.table_name,
    caseLabelColumn: row.case_label_column,
    selectedColumnsJson: row.selected_columns_json,
    variableColumnsJson: row.variable_columns_json,
    maxRows: Number(row.max_rows ?? 500),
    scheduleEnabled: Boolean(row.schedule_enabled),
    scheduleIntervalMinutes: row.schedule_interval_minutes === null || row.schedule_interval_minutes === undefined
      ? null
      : Number(row.schedule_interval_minutes),
    scheduleNextRunAt: row.schedule_next_run_at ?? null,
    lastRunAt: row.last_run_at ?? null,
    lastRunStatus: row.last_run_status === 'success' || row.last_run_status === 'error'
      ? row.last_run_status
      : null,
    lastRunMessage: row.last_run_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listOfficeConnectorProfiles(projectId: string): Promise<OfficeConnectorProfile[]> {
  const { rows } = await pool.query(
    `SELECT * FROM office_connector_profiles WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    rootPath: row.root_path,
    includeSubdirectories: Boolean(row.include_subdirectories),
    allowedExtensionsJson: row.allowed_extensions_json ?? '[]',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listOfficeConnectorJobs(projectId: string): Promise<OfficeConnectorJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM office_connector_jobs WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    profileId: row.profile_id,
    label: row.label,
    syncOptionsJson: row.sync_options_json ?? '{}',
    scheduleEnabled: Boolean(row.schedule_enabled),
    scheduleIntervalMinutes: row.schedule_interval_minutes === null || row.schedule_interval_minutes === undefined
      ? null
      : Number(row.schedule_interval_minutes),
    scheduleNextRunAt: row.schedule_next_run_at ?? null,
    lastRunAt: row.last_run_at ?? null,
    lastRunStatus: row.last_run_status === 'success' || row.last_run_status === 'error'
      ? row.last_run_status
      : null,
    lastRunMessage: row.last_run_message ?? null,
    lastRunStatsJson: row.last_run_stats_json ?? '{}',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listDueOfficeConnectorJobs(dueBeforeIso: string, limit = 10): Promise<OfficeConnectorJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM office_connector_jobs
     WHERE schedule_enabled = TRUE
       AND schedule_next_run_at IS NOT NULL
       AND schedule_next_run_at <= $1
     ORDER BY schedule_next_run_at ASC, updated_at ASC
     LIMIT $2`,
    [dueBeforeIso, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    profileId: row.profile_id,
    label: row.label,
    syncOptionsJson: row.sync_options_json ?? '{}',
    scheduleEnabled: Boolean(row.schedule_enabled),
    scheduleIntervalMinutes: row.schedule_interval_minutes === null || row.schedule_interval_minutes === undefined
      ? null
      : Number(row.schedule_interval_minutes),
    scheduleNextRunAt: row.schedule_next_run_at ?? null,
    lastRunAt: row.last_run_at ?? null,
    lastRunStatus: row.last_run_status === 'success' || row.last_run_status === 'error'
      ? row.last_run_status
      : null,
    lastRunMessage: row.last_run_message ?? null,
    lastRunStatsJson: row.last_run_stats_json ?? '{}',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listReferenceConnectorProfiles(projectId: string): Promise<ReferenceConnectorProfile[]> {
  const { rows } = await pool.query(
    `SELECT * FROM reference_connector_profiles WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    provider: row.provider === 'openalex' ? 'openalex' : 'crossref',
    settingsJson: row.settings_json ?? '{}',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listReferenceConnectorJobs(projectId: string): Promise<ReferenceConnectorJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM reference_connector_jobs WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    profileId: row.profile_id,
    label: row.label,
    queryJson: row.query_json ?? '{}',
    scheduleEnabled: Boolean(row.schedule_enabled),
    scheduleIntervalMinutes: row.schedule_interval_minutes === null || row.schedule_interval_minutes === undefined
      ? null
      : Number(row.schedule_interval_minutes),
    scheduleNextRunAt: row.schedule_next_run_at ?? null,
    lastRunAt: row.last_run_at ?? null,
    lastRunStatus: row.last_run_status === 'success' || row.last_run_status === 'error'
      ? row.last_run_status
      : null,
    lastRunMessage: row.last_run_message ?? null,
    lastRunStatsJson: row.last_run_stats_json ?? '{}',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listDueReferenceConnectorJobs(dueBeforeIso: string, limit = 10): Promise<ReferenceConnectorJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM reference_connector_jobs
     WHERE schedule_enabled = TRUE
       AND schedule_next_run_at IS NOT NULL
       AND schedule_next_run_at <= $1
     ORDER BY schedule_next_run_at ASC, updated_at ASC
     LIMIT $2`,
    [dueBeforeIso, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    profileId: row.profile_id,
    label: row.label,
    queryJson: row.query_json ?? '{}',
    scheduleEnabled: Boolean(row.schedule_enabled),
    scheduleIntervalMinutes: row.schedule_interval_minutes === null || row.schedule_interval_minutes === undefined
      ? null
      : Number(row.schedule_interval_minutes),
    scheduleNextRunAt: row.schedule_next_run_at ?? null,
    lastRunAt: row.last_run_at ?? null,
    lastRunStatus: row.last_run_status === 'success' || row.last_run_status === 'error'
      ? row.last_run_status
      : null,
    lastRunMessage: row.last_run_message ?? null,
    lastRunStatsJson: row.last_run_stats_json ?? '{}',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function listDatasetFieldMetadata(projectId: string): Promise<DatasetFieldMetadata[]> {
  const { rows } = await pool.query(
    `SELECT * FROM dataset_field_metadata WHERE project_id = $1 ORDER BY field_key ASC`,
    [projectId]
  );
  return rows.map((row) => ({
    projectId: row.project_id,
    fieldKey: row.field_key,
    fieldLabel: row.field_label ?? '',
    measure: row.measure === 'nominal' || row.measure === 'ordinal' || row.measure === 'scale' || row.measure === 'unknown'
      ? row.measure
      : null,
    valueLabelsJson: row.value_labels_json ?? '[]',
    missingValuesJson: row.missing_values_json ?? '[]',
    missingRangesJson: row.missing_ranges_json ?? '[]',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function replaceDatasetFieldMetadata(projectId: string, entries: DatasetFieldMetadata[]): Promise<void> {
  await pool.query(`DELETE FROM dataset_field_metadata WHERE project_id = $1`, [projectId]);
  if (entries.length === 0) {
    await touchProject(projectId);
    return;
  }
  for (const entry of entries) {
    await pool.query(
      `INSERT INTO dataset_field_metadata (
        project_id, field_key, field_label, measure, value_labels_json, missing_values_json, missing_ranges_json, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        entry.projectId,
        entry.fieldKey,
        entry.fieldLabel,
        entry.measure,
        entry.valueLabelsJson,
        entry.missingValuesJson,
        entry.missingRangesJson,
        entry.createdAt,
        entry.updatedAt
      ]
    );
  }
  await touchProject(projectId);
}

export async function getProjectDatasetSettings(projectId: string): Promise<ProjectDatasetSettings | null> {
  const { rows } = await pool.query(
    `SELECT * FROM project_dataset_settings WHERE project_id = $1 LIMIT 1`,
    [projectId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    projectId: row.project_id,
    weightField: typeof row.weight_field === 'string' && row.weight_field.trim() ? row.weight_field.trim() : null,
    splitFieldsJson: row.split_fields_json ?? '[]',
    updatedAt: row.updated_at
  };
}

export async function upsertProjectDatasetSettings(settings: ProjectDatasetSettings): Promise<ProjectDatasetSettings> {
  await pool.query(
    `INSERT INTO project_dataset_settings (project_id, weight_field, split_fields_json, updated_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (project_id) DO UPDATE
     SET weight_field = EXCLUDED.weight_field,
         split_fields_json = EXCLUDED.split_fields_json,
         updated_at = EXCLUDED.updated_at`,
    [
      settings.projectId,
      settings.weightField,
      settings.splitFieldsJson,
      settings.updatedAt
    ]
  );
  await touchProject(settings.projectId);
  return settings;
}

export async function insertSavedTransform(transform: SavedTransform): Promise<SavedTransform> {
  await pool.query(
    `INSERT INTO saved_transforms (id, project_id, label, filters_json, recodes_json, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      transform.id,
      transform.projectId,
      transform.label,
      transform.filtersJson,
      transform.recodesJson,
      transform.createdAt,
      transform.updatedAt
    ]
  );
  await touchProject(transform.projectId);
  return transform;
}

export async function insertSavedQualitativeQuery(query: SavedQualitativeQuery): Promise<SavedQualitativeQuery> {
  await pool.query(
    `INSERT INTO saved_qualitative_queries (id, project_id, label, mode, query_json, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      query.id,
      query.projectId,
      query.label,
      query.mode,
      query.queryJson,
      query.createdAt,
      query.updatedAt
    ]
  );
  await touchProject(query.projectId);
  return query;
}

export async function insertSavedAnalysisJob(job: SavedAnalysisJob): Promise<SavedAnalysisJob> {
  await pool.query(
    `INSERT INTO saved_analysis_jobs (id, project_id, label, analysis_kind, analysis_json, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      job.id,
      job.projectId,
      job.label,
      job.analysisKind,
      job.analysisJson,
      job.createdAt,
      job.updatedAt
    ]
  );
  await touchProject(job.projectId);
  return job;
}

export async function insertExternalSqlProfile(profile: ExternalSqlProfile): Promise<ExternalSqlProfile> {
  await pool.query(
    `INSERT INTO external_sql_profiles (id, project_id, label, client_type, connection_json, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      profile.id,
      profile.projectId,
      profile.label,
      profile.clientType,
      profile.connectionJson,
      profile.createdAt,
      profile.updatedAt
    ]
  );
  await touchProject(profile.projectId);
  return profile;
}

export async function insertExternalSqlImportJob(job: ExternalSqlImportJob): Promise<ExternalSqlImportJob> {
  await pool.query(
    `INSERT INTO external_sql_import_jobs (
      id, project_id, profile_id, label, schema_name, table_name, case_label_column,
      selected_columns_json, variable_columns_json, max_rows, schedule_enabled, schedule_interval_minutes,
      schedule_next_run_at, last_run_at, last_run_status, last_run_message, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      job.id,
      job.projectId,
      job.profileId,
      job.label,
      job.schemaName,
      job.tableName,
      job.caseLabelColumn,
      job.selectedColumnsJson,
      job.variableColumnsJson,
      job.maxRows,
      job.scheduleEnabled,
      job.scheduleIntervalMinutes,
      job.scheduleNextRunAt,
      job.lastRunAt,
      job.lastRunStatus,
      job.lastRunMessage,
      job.createdAt,
      job.updatedAt
    ]
  );
  await touchProject(job.projectId);
  return job;
}

export async function insertOfficeConnectorProfile(profile: OfficeConnectorProfile): Promise<OfficeConnectorProfile> {
  await pool.query(
    `INSERT INTO office_connector_profiles (id, project_id, label, root_path, include_subdirectories, allowed_extensions_json, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      profile.id,
      profile.projectId,
      profile.label,
      profile.rootPath,
      profile.includeSubdirectories,
      profile.allowedExtensionsJson,
      profile.createdAt,
      profile.updatedAt
    ]
  );
  await touchProject(profile.projectId);
  return profile;
}

export async function insertOfficeConnectorJob(job: OfficeConnectorJob): Promise<OfficeConnectorJob> {
  await pool.query(
    `INSERT INTO office_connector_jobs (
      id, project_id, profile_id, label, sync_options_json, schedule_enabled, schedule_interval_minutes,
      schedule_next_run_at, last_run_at, last_run_status, last_run_message, last_run_stats_json, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      job.id,
      job.projectId,
      job.profileId,
      job.label,
      job.syncOptionsJson,
      job.scheduleEnabled,
      job.scheduleIntervalMinutes,
      job.scheduleNextRunAt,
      job.lastRunAt,
      job.lastRunStatus,
      job.lastRunMessage,
      job.lastRunStatsJson,
      job.createdAt,
      job.updatedAt
    ]
  );
  await touchProject(job.projectId);
  return job;
}

export async function insertReferenceConnectorProfile(profile: ReferenceConnectorProfile): Promise<ReferenceConnectorProfile> {
  await pool.query(
    `INSERT INTO reference_connector_profiles (id, project_id, label, provider, settings_json, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      profile.id,
      profile.projectId,
      profile.label,
      profile.provider,
      profile.settingsJson,
      profile.createdAt,
      profile.updatedAt
    ]
  );
  await touchProject(profile.projectId);
  return profile;
}

export async function insertReferenceConnectorJob(job: ReferenceConnectorJob): Promise<ReferenceConnectorJob> {
  await pool.query(
    `INSERT INTO reference_connector_jobs (
      id, project_id, profile_id, label, query_json, schedule_enabled, schedule_interval_minutes,
      schedule_next_run_at, last_run_at, last_run_status, last_run_message, last_run_stats_json, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      job.id,
      job.projectId,
      job.profileId,
      job.label,
      job.queryJson,
      job.scheduleEnabled,
      job.scheduleIntervalMinutes,
      job.scheduleNextRunAt,
      job.lastRunAt,
      job.lastRunStatus,
      job.lastRunMessage,
      job.lastRunStatsJson,
      job.createdAt,
      job.updatedAt
    ]
  );
  await touchProject(job.projectId);
  return job;
}

export async function updateExternalSqlImportJobSchedule(params: {
  id: string;
  projectId: string;
  maxRows: number;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  updatedAt: string;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE external_sql_import_jobs
     SET max_rows = $3,
         schedule_enabled = $4,
         schedule_interval_minutes = $5,
         schedule_next_run_at = $6,
         updated_at = $7
     WHERE id = $1 AND project_id = $2`,
    [
      params.id,
      params.projectId,
      params.maxRows,
      params.scheduleEnabled,
      params.scheduleIntervalMinutes,
      params.scheduleNextRunAt,
      params.updatedAt
    ]
  );
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(params.projectId);
    return true;
  }
  return false;
}

export async function updateExternalSqlImportJobRunState(params: {
  id: string;
  projectId: string;
  updatedAt: string;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  scheduleNextRunAt: string | null;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE external_sql_import_jobs
     SET last_run_at = $3,
         last_run_status = $4,
         last_run_message = $5,
         schedule_next_run_at = $6,
         updated_at = $7
     WHERE id = $1 AND project_id = $2`,
    [
      params.id,
      params.projectId,
      params.lastRunAt,
      params.lastRunStatus,
      params.lastRunMessage,
      params.scheduleNextRunAt,
      params.updatedAt
    ]
  );
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(params.projectId);
    return true;
  }
  return false;
}

export async function updateOfficeConnectorJobSchedule(params: {
  id: string;
  projectId: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  syncOptionsJson: string;
  updatedAt: string;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE office_connector_jobs
     SET schedule_enabled = $3,
         schedule_interval_minutes = $4,
         schedule_next_run_at = $5,
         sync_options_json = $6,
         updated_at = $7
     WHERE id = $1 AND project_id = $2`,
    [
      params.id,
      params.projectId,
      params.scheduleEnabled,
      params.scheduleIntervalMinutes,
      params.scheduleNextRunAt,
      params.syncOptionsJson,
      params.updatedAt
    ]
  );
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(params.projectId);
    return true;
  }
  return false;
}

export async function updateOfficeConnectorJobRunState(params: {
  id: string;
  projectId: string;
  updatedAt: string;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  lastRunStatsJson: string;
  scheduleNextRunAt: string | null;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE office_connector_jobs
     SET last_run_at = $3,
         last_run_status = $4,
         last_run_message = $5,
         last_run_stats_json = $6,
         schedule_next_run_at = $7,
         updated_at = $8
     WHERE id = $1 AND project_id = $2`,
    [
      params.id,
      params.projectId,
      params.lastRunAt,
      params.lastRunStatus,
      params.lastRunMessage,
      params.lastRunStatsJson,
      params.scheduleNextRunAt,
      params.updatedAt
    ]
  );
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(params.projectId);
    return true;
  }
  return false;
}

export async function updateReferenceConnectorJobSchedule(params: {
  id: string;
  projectId: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  queryJson: string;
  updatedAt: string;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE reference_connector_jobs
     SET schedule_enabled = $3,
         schedule_interval_minutes = $4,
         schedule_next_run_at = $5,
         query_json = $6,
         updated_at = $7
     WHERE id = $1 AND project_id = $2`,
    [
      params.id,
      params.projectId,
      params.scheduleEnabled,
      params.scheduleIntervalMinutes,
      params.scheduleNextRunAt,
      params.queryJson,
      params.updatedAt
    ]
  );
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(params.projectId);
    return true;
  }
  return false;
}

export async function updateReferenceConnectorJobRunState(params: {
  id: string;
  projectId: string;
  updatedAt: string;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  lastRunStatsJson: string;
  scheduleNextRunAt: string | null;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE reference_connector_jobs
     SET last_run_at = $3,
         last_run_status = $4,
         last_run_message = $5,
         last_run_stats_json = $6,
         schedule_next_run_at = $7,
         updated_at = $8
     WHERE id = $1 AND project_id = $2`,
    [
      params.id,
      params.projectId,
      params.lastRunAt,
      params.lastRunStatus,
      params.lastRunMessage,
      params.lastRunStatsJson,
      params.scheduleNextRunAt,
      params.updatedAt
    ]
  );
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(params.projectId);
    return true;
  }
  return false;
}

export async function deleteSavedTransform(id: string, projectId: string): Promise<void> {
  await pool.query(`DELETE FROM saved_transforms WHERE id = $1 AND project_id = $2`, [id, projectId]);
  await touchProject(projectId);
}

export async function deleteSavedQualitativeQuery(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM saved_qualitative_queries WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteSavedAnalysisJob(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM saved_analysis_jobs WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteExternalSqlProfile(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM external_sql_profiles WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteExternalSqlImportJob(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM external_sql_import_jobs WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteOfficeConnectorProfile(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM office_connector_profiles WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteOfficeConnectorJob(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM office_connector_jobs WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteReferenceConnectorProfile(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM reference_connector_profiles WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteReferenceConnectorJob(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM reference_connector_jobs WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function deleteCasesImportedBySqlJob(projectId: string, jobId: string): Promise<number> {
  const caseRows = await pool.query(
    `SELECT target_id FROM attributes
     WHERE project_id = $1
       AND target_type = 'case'
       AND name = '_sql_import_job_id'
       AND value_json = $2`,
    [projectId, JSON.stringify(jobId)]
  );
  const caseIds = [...new Set(caseRows.rows.map((row) => String(row.target_id ?? '')).filter(Boolean))];
  if (caseIds.length === 0) return 0;
  await pool.query(
    `DELETE FROM attributes WHERE project_id = $1 AND target_type = 'case' AND target_id = ANY($2::text[])`,
    [projectId, caseIds]
  );
  await pool.query(
    `DELETE FROM cases WHERE project_id = $1 AND id = ANY($2::text[])`,
    [projectId, caseIds]
  );
  await touchProject(projectId);
  return caseIds.length;
}

export async function deleteCasesImportedByOfficeFile(projectId: string, fileKey: string): Promise<number> {
  const caseRows = await pool.query(
    `SELECT target_id FROM attributes
     WHERE project_id = $1
       AND target_type = 'case'
       AND name = '_office_connector_file_key'
       AND value_json = $2`,
    [projectId, JSON.stringify(fileKey)]
  );
  const caseIds = [...new Set(caseRows.rows.map((row) => String(row.target_id ?? '')).filter(Boolean))];
  if (caseIds.length === 0) return 0;
  await pool.query(
    `DELETE FROM attributes WHERE project_id = $1 AND target_type = 'case' AND target_id = ANY($2::text[])`,
    [projectId, caseIds]
  );
  await pool.query(
    `DELETE FROM cases WHERE project_id = $1 AND id = ANY($2::text[])`,
    [projectId, caseIds]
  );
  await touchProject(projectId);
  return caseIds.length;
}

export async function getGovernancePolicy(): Promise<GovernancePolicy> {
  const { rows } = await pool.query(
    `SELECT * FROM governance_policies WHERE id = 'global' LIMIT 1`
  );
  const row = rows[0];
  return {
    id: 'global',
    idleTimeoutMinutes: Number(row?.idle_timeout_minutes ?? 90),
    sessionAbsoluteTimeoutMinutes: Number(row?.session_absolute_timeout_minutes ?? 720),
    loginThrottleWindowMinutes: Number(row?.login_throttle_window_minutes ?? 15),
    loginThrottleMaxFailures: Number(row?.login_throttle_max_failures ?? 5),
    localAuthEnabled: row?.local_auth_enabled === undefined ? true : Boolean(row.local_auth_enabled),
    passwordMinLength: Number(row?.password_min_length ?? 10),
    passwordRequireUppercase: Boolean(row?.password_require_uppercase),
    passwordRequireNumber: Boolean(row?.password_require_number),
    passwordRequireSymbol: Boolean(row?.password_require_symbol),
    auditExportMaxRows: Number(row?.audit_export_max_rows ?? 2000),
    backupRetentionDays: Number(row?.backup_retention_days ?? 30),
    updatedAt: row?.updated_at ?? nowIso(),
    updatedByUserId: row?.updated_by_user_id ?? null
  };
}

export async function updateGovernancePolicy(input: {
  idleTimeoutMinutes: number;
  sessionAbsoluteTimeoutMinutes: number;
  loginThrottleWindowMinutes: number;
  loginThrottleMaxFailures: number;
  localAuthEnabled: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  auditExportMaxRows: number;
  backupRetentionDays: number;
  updatedByUserId: string | null;
}): Promise<GovernancePolicy> {
  const updatedAt = nowIso();
  await pool.query(
    `UPDATE governance_policies
     SET idle_timeout_minutes = $2,
         session_absolute_timeout_minutes = $3,
         login_throttle_window_minutes = $4,
         login_throttle_max_failures = $5,
         local_auth_enabled = $6,
         password_min_length = $7,
         password_require_uppercase = $8,
         password_require_number = $9,
         password_require_symbol = $10,
         audit_export_max_rows = $11,
         backup_retention_days = $12,
         updated_at = $13,
         updated_by_user_id = $14
     WHERE id = $1`,
    [
      'global',
      input.idleTimeoutMinutes,
      input.sessionAbsoluteTimeoutMinutes,
      input.loginThrottleWindowMinutes,
      input.loginThrottleMaxFailures,
      input.localAuthEnabled,
      input.passwordMinLength,
      input.passwordRequireUppercase,
      input.passwordRequireNumber,
      input.passwordRequireSymbol,
      input.auditExportMaxRows,
      input.backupRetentionDays,
      updatedAt,
      input.updatedByUserId
    ]
  );
  return getGovernancePolicy();
}

export async function listAuditEvents(projectId: string, options?: {
  limit?: number;
  actorUsername?: string;
  actorRole?: AuditActorRole;
  actionPrefix?: string;
  entityType?: string;
  from?: string;
  to?: string;
}): Promise<AuditEventRecord[]> {
  const conditions: string[] = ['project_id = $1'];
  const params: unknown[] = [projectId];
  let index = 2;

  if (options?.actorUsername) {
    conditions.push(`actor_username = $${index++}`);
    params.push(options.actorUsername);
  }
  if (options?.actorRole) {
    conditions.push(`actor_role = $${index++}`);
    params.push(options.actorRole);
  }
  if (options?.actionPrefix) {
    conditions.push(`action LIKE $${index++}`);
    params.push(`${options.actionPrefix}%`);
  }
  if (options?.entityType) {
    conditions.push(`entity_type = $${index++}`);
    params.push(options.entityType);
  }
  if (options?.from) {
    conditions.push(`created_at >= $${index++}`);
    params.push(options.from);
  }
  if (options?.to) {
    conditions.push(`created_at <= $${index++}`);
    params.push(options.to);
  }

  const limit = Math.max(1, options?.limit ?? 200);
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM audit_events WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${index}`,
    params
  );
  return rows.map((row) => createAuditEvent({
    id: row.id,
    projectId: row.project_id,
    actorUserId: row.actor_user_id,
    actorUsername: row.actor_username,
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: JSON.parse(row.details_json),
    createdAt: row.created_at
  }));
}

export async function insertAuditEvent(event: AuditEventRecord): Promise<AuditEventRecord> {
  await pool.query(
    `INSERT INTO audit_events (id, project_id, actor_user_id, actor_username, actor_role, action, entity_type, entity_id, details_json, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      event.id,
      event.projectId,
      event.actorUserId,
      event.actorUsername,
      event.actorRole,
      event.action,
      event.entityType,
      event.entityId,
      JSON.stringify(event.details),
      event.createdAt
    ]
  );
  await touchProject(event.projectId);
  return event;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function listProjects(userId: string): Promise<Project[]> {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.workspace_mode, p.description, p.created_at, p.updated_at
     FROM projects p JOIN memberships m ON m.project_id = p.id
     WHERE m.user_id = $1 ORDER BY p.updated_at DESC, p.created_at DESC`,
    [userId]
  );
  return rows.map((r) => createProject({ id: r.id, name: r.name, workspaceMode: r.workspace_mode ?? 'solo', description: r.description, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export async function listAllProjects(): Promise<Project[]> {
  const { rows } = await pool.query(
    `SELECT id, name, workspace_mode, description, created_at, updated_at
     FROM projects
     ORDER BY updated_at DESC, created_at DESC`
  );
  return rows.map((row) => createProject({
    id: row.id,
    name: row.name,
    workspaceMode: row.workspace_mode ?? 'solo',
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function insertProject(project: Project): Promise<Project> {
  await pool.query(
    `INSERT INTO projects (id, name, workspace_mode, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [project.id, project.name, project.workspaceMode, project.description, project.createdAt, project.updatedAt]
  );
  return project;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  return (result.rowCount ?? 0) > 0;
}

export async function touchProject(projectId: string): Promise<void> {
  await pool.query(`UPDATE projects SET updated_at = $1 WHERE id = $2`, [nowIso(), projectId]);
}

export async function updateProjectWorkspaceMode(projectId: string, workspaceMode: Project['workspaceMode']): Promise<Project> {
  await pool.query(
    `UPDATE projects SET workspace_mode = $1, updated_at = $2 WHERE id = $3`,
    [workspaceMode, nowIso(), projectId]
  );
  const { rows } = await pool.query(
    `SELECT id, name, workspace_mode, description, created_at, updated_at FROM projects WHERE id = $1 LIMIT 1`,
    [projectId]
  );
  if (rows.length === 0) throw new Error('Project not found.');
  const row = rows[0];
  return createProject({
    id: row.id,
    name: row.name,
    workspaceMode: row.workspace_mode ?? 'solo',
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

// ── Sources ───────────────────────────────────────────────────────────────────

export async function listSources(projectId: string): Promise<Source[]> {
  const { rows } = await pool.query(`SELECT * FROM sources WHERE project_id = $1 ORDER BY updated_at DESC`, [projectId]);
  return rows.map((r) => createSource({
    id: r.id,
    projectId: r.project_id,
    kind: r.kind,
    title: r.title,
    language: r.language,
    contentType: r.content_type,
    contentUrl: r.content_url ?? null,
    contentText: r.content_text ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export async function insertSource(source: Source): Promise<Source> {
  await pool.query(
    `INSERT INTO sources (id, project_id, kind, title, language, content_type, content_url, content_text, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [source.id, source.projectId, source.kind, source.title, source.language, source.contentType, source.contentUrl, source.contentText, source.createdAt, source.updatedAt]
  );
  await touchProject(source.projectId);
  return source;
}

export async function updateSourceContent(params: {
  id: string;
  projectId: string;
  title?: string;
  contentType?: string;
  contentUrl?: string | null;
  contentText: string;
  updatedAt: string;
}): Promise<void> {
  await pool.query(
    `UPDATE sources
     SET title = COALESCE($3, title),
         content_type = COALESCE($4, content_type),
         content_url = $5,
         content_text = $6,
         updated_at = $7
     WHERE id = $1 AND project_id = $2`,
    [
      params.id,
      params.projectId,
      params.title ?? null,
      params.contentType ?? null,
      params.contentUrl ?? null,
      params.contentText,
      params.updatedAt
    ]
  );
  await touchProject(params.projectId);
}

// ── Codes ─────────────────────────────────────────────────────────────────────

export async function listCodes(projectId: string): Promise<Code[]> {
  const { rows } = await pool.query(`SELECT * FROM codes WHERE project_id = $1 ORDER BY updated_at DESC`, [projectId]);
  return rows.map((r) => createCode({ id: r.id, projectId: r.project_id, parentCodeId: r.parent_code_id, name: r.name, description: r.description, colorToken: r.color_token, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export async function insertCode(code: Code): Promise<Code> {
  await pool.query(
    `INSERT INTO codes (id, project_id, parent_code_id, name, description, color_token, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [code.id, code.projectId, code.parentCodeId ?? null, code.name, code.description, code.colorToken, code.createdAt, code.updatedAt]
  );
  await touchProject(code.projectId);
  return code;
}

// ── Variables ─────────────────────────────────────────────────────────────────

export type VariableWithDerivation = Variable & { derivedFromCodeId: string | null };

export async function listVariables(projectId: string): Promise<VariableWithDerivation[]> {
  const { rows } = await pool.query(`SELECT * FROM variables WHERE project_id = $1 ORDER BY updated_at DESC`, [projectId]);
  return rows.map((r) => ({
    ...createVariable({
      id: r.id,
      projectId: r.project_id,
      name: r.name,
      label: r.label,
      kind: r.kind,
      sourceKind: r.source_kind,
      derivedFromCodeId: r.derived_from_code_id ?? null,
      derivationRule: r.derivation_rule ?? 'presence',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }),
    derivedFromCodeId: r.derived_from_code_id ?? null
  }));
}

export async function insertVariable(variable: Variable, derivedFromCodeId?: string | null): Promise<VariableWithDerivation> {
  await pool.query(
    `INSERT INTO variables (id, project_id, name, label, kind, source_kind, derived_from_code_id, derivation_rule, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [variable.id, variable.projectId, variable.name, variable.label, variable.kind, variable.sourceKind, derivedFromCodeId ?? variable.derivedFromCodeId ?? null, variable.derivationRule ?? 'presence', variable.createdAt, variable.updatedAt]
  );
  await touchProject(variable.projectId);
  return { ...variable, derivedFromCodeId: derivedFromCodeId ?? variable.derivedFromCodeId ?? null };
}

// ── Cases ─────────────────────────────────────────────────────────────────────

export async function listCases(projectId: string): Promise<CaseEntity[]> {
  const { rows } = await pool.query(`SELECT * FROM cases WHERE project_id = $1 ORDER BY updated_at DESC`, [projectId]);
  return rows.map((r) => createCase({ id: r.id, projectId: r.project_id, label: r.label, sourceIds: JSON.parse(r.source_ids_json), createdAt: r.created_at, updatedAt: r.updated_at }));
}

export async function insertCase(c: CaseEntity): Promise<CaseEntity> {
  await pool.query(
    `INSERT INTO cases (id, project_id, label, source_ids_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [c.id, c.projectId, c.label, JSON.stringify(c.sourceIds), c.createdAt, c.updatedAt]
  );
  await touchProject(c.projectId);
  return c;
}

// ── Memos ─────────────────────────────────────────────────────────────────────

export async function listMemos(projectId: string): Promise<Memo[]> {
  const { rows } = await pool.query(`SELECT * FROM memos WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`, [projectId]);
  return rows.map((r) => createMemo({
    id: r.id,
    projectId: r.project_id,
    targetType: r.target_type,
    targetId: r.target_id,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export async function insertMemo(memo: Memo): Promise<Memo> {
  await pool.query(
    `INSERT INTO memos (id, project_id, target_type, target_id, title, body, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [memo.id, memo.projectId, memo.targetType, memo.targetId, memo.title, memo.body, memo.createdAt, memo.updatedAt]
  );
  await touchProject(memo.projectId);
  return memo;
}

// ── Attributes ────────────────────────────────────────────────────────────────

export async function listAttributes(projectId: string): Promise<Attribute[]> {
  const { rows } = await pool.query(`SELECT * FROM attributes WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`, [projectId]);
  return rows.map((r) => createAttribute({
    id: r.id,
    projectId: r.project_id,
    targetType: r.target_type,
    targetId: r.target_id,
    name: r.name,
    value: JSON.parse(r.value_json),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export async function insertAttribute(attribute: Attribute): Promise<Attribute> {
  await pool.query(
    `INSERT INTO attributes (id, project_id, target_type, target_id, name, value_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [attribute.id, attribute.projectId, attribute.targetType, attribute.targetId, attribute.name, JSON.stringify(attribute.value), attribute.createdAt, attribute.updatedAt]
  );
  await touchProject(attribute.projectId);
  return attribute;
}

// ── Annotations ───────────────────────────────────────────────────────────────

export async function listAnnotations(projectId: string): Promise<Annotation[]> {
  const { rows } = await pool.query(`SELECT * FROM annotations WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`, [projectId]);
  return rows.map((r) => createAnnotation({
    id: r.id,
    projectId: r.project_id,
    targetType: r.target_type,
    targetId: r.target_id,
    quoteText: r.quote_text,
    note: r.note,
    startOffset: r.start_offset,
    endOffset: r.end_offset,
    colorToken: r.color_token,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export async function insertAnnotation(annotation: Annotation): Promise<Annotation> {
  await pool.query(
    `INSERT INTO annotations (id, project_id, target_type, target_id, quote_text, note, start_offset, end_offset, color_token, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      annotation.id,
      annotation.projectId,
      annotation.targetType,
      annotation.targetId,
      annotation.quoteText,
      annotation.note,
      annotation.startOffset,
      annotation.endOffset,
      annotation.colorToken,
      annotation.createdAt,
      annotation.updatedAt
    ]
  );
  await touchProject(annotation.projectId);
  return annotation;
}

export async function updateAnnotation(annotation: Annotation): Promise<Annotation | null> {
  const result = await pool.query(
    `UPDATE annotations
     SET target_type = $3,
         target_id = $4,
         quote_text = $5,
         note = $6,
         start_offset = $7,
         end_offset = $8,
         color_token = $9,
         updated_at = $10
     WHERE id = $1 AND project_id = $2`,
    [
      annotation.id,
      annotation.projectId,
      annotation.targetType,
      annotation.targetId,
      annotation.quoteText,
      annotation.note,
      annotation.startOffset,
      annotation.endOffset,
      annotation.colorToken,
      annotation.updatedAt
    ]
  );
  if (!result.rowCount || result.rowCount < 1) return null;
  await touchProject(annotation.projectId);
  return annotation;
}

export async function deleteAnnotation(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM annotations WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  if (!result.rowCount || result.rowCount < 1) return false;
  await touchProject(projectId);
  return true;
}

export async function listRelationships(projectId: string): Promise<RelationshipRecord[]> {
  const { rows } = await pool.query(
    `SELECT * FROM relationships WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => createRelationship({
    id: row.id,
    projectId: row.project_id,
    relationshipType: row.relationship_type,
    leftTargetType: row.left_target_type,
    leftTargetId: row.left_target_id,
    rightTargetType: row.right_target_type,
    rightTargetId: row.right_target_id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function insertRelationship(relationship: RelationshipRecord): Promise<RelationshipRecord> {
  await pool.query(
    `INSERT INTO relationships (id, project_id, relationship_type, left_target_type, left_target_id, right_target_type, right_target_id, note, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      relationship.id,
      relationship.projectId,
      relationship.relationshipType,
      relationship.leftTargetType,
      relationship.leftTargetId,
      relationship.rightTargetType,
      relationship.rightTargetId,
      relationship.note,
      relationship.createdAt,
      relationship.updatedAt
    ]
  );
  await touchProject(relationship.projectId);
  return relationship;
}

export async function updateRelationship(relationship: RelationshipRecord): Promise<RelationshipRecord | null> {
  const result = await pool.query(
    `UPDATE relationships
     SET relationship_type = $3,
         left_target_type = $4,
         left_target_id = $5,
         right_target_type = $6,
         right_target_id = $7,
         note = $8,
         updated_at = $9
     WHERE id = $1 AND project_id = $2`,
    [
      relationship.id,
      relationship.projectId,
      relationship.relationshipType,
      relationship.leftTargetType,
      relationship.leftTargetId,
      relationship.rightTargetType,
      relationship.rightTargetId,
      relationship.note,
      relationship.updatedAt
    ]
  );
  if (!result.rowCount || result.rowCount < 1) return null;
  await touchProject(relationship.projectId);
  return relationship;
}

export async function deleteRelationship(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM relationships WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  if (!result.rowCount || result.rowCount < 1) return false;
  await touchProject(projectId);
  return true;
}

function parseStringArray(text: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(text ?? '[]');
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mapProjectReferenceRow(row: any): ProjectReference {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceFormat: row.source_format,
    referenceType: row.reference_type,
    title: row.title ?? '',
    authors: parseStringArray(row.authors_json),
    year: row.year === null || row.year === undefined ? null : Number(row.year),
    containerTitle: row.container_title ?? '',
    publisher: row.publisher ?? '',
    doi: row.doi ?? '',
    url: row.url ?? '',
    abstractText: row.abstract_text ?? '',
    keywords: parseStringArray(row.keywords_json),
    rawText: row.raw_text ?? '',
    relatedSourceId: row.related_source_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeDoi(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:/, '');
}

function normalizeReferenceToken(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeReferenceTitle(value: string): string {
  return normalizeReferenceToken(value).replace(/\s+/g, ' ').trim();
}

function normalizeAuthorToken(value: string): string {
  return normalizeReferenceToken(value).replace(/\s+/g, '');
}

function getFirstAuthorToken(authors: string[]): string {
  return normalizeAuthorToken(authors[0] ?? '');
}

function unionStrings(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b].map((item) => String(item ?? '').trim()).filter(Boolean))];
}

function chooseReferenceText(primary: string, secondary: string): string {
  const first = String(primary ?? '').trim();
  const second = String(secondary ?? '').trim();
  if (!first) return second;
  if (!second) return first;
  return first.length >= second.length ? first : second;
}

function buildMergedReference(primary: ProjectReference, secondary: ProjectReference, timestamp: string): ProjectReference {
  const primaryRaw = String(primary.rawText ?? '').trim();
  const secondaryRaw = String(secondary.rawText ?? '').trim();
  const mergedRaw = !secondaryRaw || primaryRaw.includes(secondaryRaw)
    ? primaryRaw
    : primaryRaw
      ? `${primaryRaw}\n\n---- merged reference ----\n${secondaryRaw}`
      : secondaryRaw;

  return {
    ...primary,
    title: chooseReferenceText(primary.title, secondary.title),
    authors: unionStrings(primary.authors, secondary.authors),
    year: primary.year ?? secondary.year,
    containerTitle: chooseReferenceText(primary.containerTitle, secondary.containerTitle),
    publisher: chooseReferenceText(primary.publisher, secondary.publisher),
    doi: chooseReferenceText(primary.doi, secondary.doi),
    url: chooseReferenceText(primary.url, secondary.url),
    abstractText: chooseReferenceText(primary.abstractText, secondary.abstractText),
    keywords: unionStrings(primary.keywords, secondary.keywords),
    rawText: mergedRaw,
    relatedSourceId: primary.relatedSourceId ?? secondary.relatedSourceId,
    updatedAt: timestamp
  };
}

function computeReferenceDuplicateSignal(a: ProjectReference, b: ProjectReference): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const doiA = normalizeDoi(a.doi);
  const doiB = normalizeDoi(b.doi);
  if (doiA && doiB && doiA === doiB) {
    score += 0.82;
    reasons.push('DOI match');
  }

  const titleA = normalizeReferenceTitle(a.title);
  const titleB = normalizeReferenceTitle(b.title);
  if (titleA && titleB && titleA === titleB) {
    score += 0.58;
    reasons.push('Title match');
  }

  if (a.year && b.year && a.year === b.year) {
    score += 0.08;
    reasons.push('Year match');
  }

  const authorA = getFirstAuthorToken(a.authors);
  const authorB = getFirstAuthorToken(b.authors);
  if (authorA && authorB && authorA === authorB) {
    score += 0.12;
    reasons.push('First author match');
  }

  if (!reasons.length) {
    return { score: 0, reasons: [] };
  }

  if (score < 0.74) {
    return { score, reasons };
  }
  return { score: Math.min(1, score), reasons };
}

function mapProjectReferenceLinkRow(row: any): ProjectReferenceLink {
  return {
    id: row.id,
    projectId: row.project_id,
    referenceId: row.reference_id,
    targetType: row.target_type,
    targetId: row.target_id,
    note: row.note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProjectReferenceCollectionRow(row: any): ProjectReferenceCollection {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name ?? '',
    description: row.description ?? '',
    colorToken: row.color_token ?? 'blue',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProjectReferenceCollectionItemRow(row: any): ProjectReferenceCollectionItem {
  return {
    id: row.id,
    projectId: row.project_id,
    collectionId: row.collection_id,
    referenceId: row.reference_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProjectReferenceMergeEventRow(row: any): ProjectReferenceMergeEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    primaryReferenceId: row.primary_reference_id,
    mergedReferenceId: row.merged_reference_id,
    reason: row.reason ?? '',
    mergedSnapshotJson: row.merged_snapshot_json ?? '{}',
    createdByUserId: row.created_by_user_id ?? null,
    createdByUsername: row.created_by_username ?? 'system',
    createdAt: row.created_at
  };
}

export async function listProjectReferences(projectId: string): Promise<ProjectReference[]> {
  const { rows } = await pool.query(
    `SELECT * FROM project_references WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map(mapProjectReferenceRow);
}

export async function getProjectReference(id: string, projectId: string): Promise<ProjectReference | null> {
  const { rows } = await pool.query(
    `SELECT * FROM project_references WHERE id = $1 AND project_id = $2 LIMIT 1`,
    [id, projectId]
  );
  return rows[0] ? mapProjectReferenceRow(rows[0]) : null;
}

export async function insertProjectReference(reference: ProjectReference): Promise<ProjectReference> {
  await pool.query(
    `INSERT INTO project_references (
      id, project_id, source_format, reference_type, title, authors_json, year, container_title, publisher,
      doi, url, abstract_text, keywords_json, raw_text, related_source_id, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      reference.id,
      reference.projectId,
      reference.sourceFormat,
      reference.referenceType,
      reference.title,
      JSON.stringify(reference.authors),
      reference.year,
      reference.containerTitle,
      reference.publisher,
      reference.doi,
      reference.url,
      reference.abstractText,
      JSON.stringify(reference.keywords),
      reference.rawText,
      reference.relatedSourceId,
      reference.createdAt,
      reference.updatedAt
    ]
  );
  await touchProject(reference.projectId);
  return reference;
}

export async function updateProjectReference(reference: ProjectReference): Promise<ProjectReference | null> {
  const result = await pool.query(
    `UPDATE project_references
     SET source_format = $3,
         reference_type = $4,
         title = $5,
         authors_json = $6,
         year = $7,
         container_title = $8,
         publisher = $9,
         doi = $10,
         url = $11,
         abstract_text = $12,
         keywords_json = $13,
         raw_text = $14,
         related_source_id = $15,
         updated_at = $16
     WHERE id = $1 AND project_id = $2`,
    [
      reference.id,
      reference.projectId,
      reference.sourceFormat,
      reference.referenceType,
      reference.title,
      JSON.stringify(reference.authors),
      reference.year,
      reference.containerTitle,
      reference.publisher,
      reference.doi,
      reference.url,
      reference.abstractText,
      JSON.stringify(reference.keywords),
      reference.rawText,
      reference.relatedSourceId,
      reference.updatedAt
    ]
  );
  if (!result.rowCount || result.rowCount < 1) return null;
  await touchProject(reference.projectId);
  return reference;
}

export async function deleteProjectReference(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM project_references WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
}

export async function listProjectReferenceLinks(projectId: string, referenceId?: string): Promise<ProjectReferenceLink[]> {
  const hasReferenceId = typeof referenceId === 'string' && referenceId.trim().length > 0;
  const { rows } = await pool.query(
    hasReferenceId
      ? `SELECT * FROM project_reference_links WHERE project_id = $1 AND reference_id = $2 ORDER BY updated_at DESC, created_at DESC`
      : `SELECT * FROM project_reference_links WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    hasReferenceId ? [projectId, referenceId?.trim()] : [projectId]
  );
  return rows.map(mapProjectReferenceLinkRow);
}

export async function insertProjectReferenceLink(link: ProjectReferenceLink): Promise<ProjectReferenceLink> {
  await pool.query(
    `INSERT INTO project_reference_links (
      id, project_id, reference_id, target_type, target_id, note, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      link.id,
      link.projectId,
      link.referenceId,
      link.targetType,
      link.targetId,
      link.note,
      link.createdAt,
      link.updatedAt
    ]
  );
  await touchProject(link.projectId);
  return link;
}

export async function updateProjectReferenceLink(link: ProjectReferenceLink): Promise<ProjectReferenceLink | null> {
  const result = await pool.query(
    `UPDATE project_reference_links
     SET reference_id = $3,
         target_type = $4,
         target_id = $5,
         note = $6,
         updated_at = $7
     WHERE id = $1 AND project_id = $2`,
    [
      link.id,
      link.projectId,
      link.referenceId,
      link.targetType,
      link.targetId,
      link.note,
      link.updatedAt
    ]
  );
  if (!result.rowCount || result.rowCount < 1) return null;
  await touchProject(link.projectId);
  return link;
}

export async function deleteProjectReferenceLink(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM project_reference_links WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (!result.rowCount || result.rowCount < 1) return false;
  await touchProject(projectId);
  return true;
}

export async function listProjectReferenceCollections(projectId: string): Promise<ProjectReferenceCollection[]> {
  const { rows } = await pool.query(
    `SELECT * FROM project_reference_collections WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map(mapProjectReferenceCollectionRow);
}

export async function insertProjectReferenceCollection(collection: ProjectReferenceCollection): Promise<ProjectReferenceCollection> {
  await pool.query(
    `INSERT INTO project_reference_collections (
      id, project_id, name, description, color_token, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      collection.id,
      collection.projectId,
      collection.name,
      collection.description,
      collection.colorToken,
      collection.createdAt,
      collection.updatedAt
    ]
  );
  await touchProject(collection.projectId);
  return collection;
}

export async function updateProjectReferenceCollection(collection: ProjectReferenceCollection): Promise<ProjectReferenceCollection | null> {
  const result = await pool.query(
    `UPDATE project_reference_collections
     SET name = $3,
         description = $4,
         color_token = $5,
         updated_at = $6
     WHERE id = $1 AND project_id = $2`,
    [
      collection.id,
      collection.projectId,
      collection.name,
      collection.description,
      collection.colorToken,
      collection.updatedAt
    ]
  );
  if (!result.rowCount || result.rowCount < 1) return null;
  await touchProject(collection.projectId);
  return collection;
}

export async function deleteProjectReferenceCollection(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM project_reference_collections WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  if (!result.rowCount || result.rowCount < 1) return false;
  await touchProject(projectId);
  return true;
}

export async function listProjectReferenceCollectionItems(
  projectId: string,
  collectionId?: string
): Promise<ProjectReferenceCollectionItem[]> {
  const hasCollectionId = typeof collectionId === 'string' && collectionId.trim().length > 0;
  const { rows } = await pool.query(
    hasCollectionId
      ? `SELECT * FROM project_reference_collection_items WHERE project_id = $1 AND collection_id = $2 ORDER BY updated_at DESC, created_at DESC`
      : `SELECT * FROM project_reference_collection_items WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    hasCollectionId ? [projectId, collectionId?.trim()] : [projectId]
  );
  return rows.map(mapProjectReferenceCollectionItemRow);
}

export async function insertProjectReferenceCollectionItem(item: ProjectReferenceCollectionItem): Promise<ProjectReferenceCollectionItem> {
  await pool.query(
    `INSERT INTO project_reference_collection_items (
      id, project_id, collection_id, reference_id, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (collection_id, reference_id) DO NOTHING`,
    [
      item.id,
      item.projectId,
      item.collectionId,
      item.referenceId,
      item.createdAt,
      item.updatedAt
    ]
  );
  const { rows } = await pool.query(
    `SELECT * FROM project_reference_collection_items
     WHERE project_id = $1 AND collection_id = $2 AND reference_id = $3
     LIMIT 1`,
    [item.projectId, item.collectionId, item.referenceId]
  );
  await touchProject(item.projectId);
  return rows[0] ? mapProjectReferenceCollectionItemRow(rows[0]) : item;
}

export async function deleteProjectReferenceCollectionItem(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM project_reference_collection_items WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  if (!result.rowCount || result.rowCount < 1) return false;
  await touchProject(projectId);
  return true;
}

export async function removeReferenceFromCollection(projectId: string, collectionId: string, referenceId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM project_reference_collection_items
     WHERE project_id = $1 AND collection_id = $2 AND reference_id = $3`,
    [projectId, collectionId, referenceId]
  );
  if (!result.rowCount || result.rowCount < 1) return false;
  await touchProject(projectId);
  return true;
}

export async function listProjectReferenceMergeEvents(projectId: string, referenceId?: string): Promise<ProjectReferenceMergeEvent[]> {
  const hasReferenceId = typeof referenceId === 'string' && referenceId.trim().length > 0;
  const { rows } = await pool.query(
    hasReferenceId
      ? `SELECT * FROM project_reference_merge_events
         WHERE project_id = $1 AND (primary_reference_id = $2 OR merged_reference_id = $2)
         ORDER BY created_at DESC`
      : `SELECT * FROM project_reference_merge_events WHERE project_id = $1 ORDER BY created_at DESC`,
    hasReferenceId ? [projectId, referenceId?.trim()] : [projectId]
  );
  return rows.map(mapProjectReferenceMergeEventRow);
}

export async function insertProjectReferenceMergeEvent(event: ProjectReferenceMergeEvent): Promise<ProjectReferenceMergeEvent> {
  await pool.query(
    `INSERT INTO project_reference_merge_events (
      id, project_id, primary_reference_id, merged_reference_id, reason, merged_snapshot_json,
      created_by_user_id, created_by_username, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      event.id,
      event.projectId,
      event.primaryReferenceId,
      event.mergedReferenceId,
      event.reason,
      event.mergedSnapshotJson,
      event.createdByUserId,
      event.createdByUsername,
      event.createdAt
    ]
  );
  await touchProject(event.projectId);
  return event;
}

export async function listProjectReferenceDuplicateCandidates(projectId: string): Promise<ProjectReferenceDuplicateCandidate[]> {
  const references = await listProjectReferences(projectId);
  const candidates: ProjectReferenceDuplicateCandidate[] = [];
  for (let left = 0; left < references.length; left += 1) {
    for (let right = left + 1; right < references.length; right += 1) {
      const a = references[left];
      const b = references[right];
      const signal = computeReferenceDuplicateSignal(a, b);
      if (signal.score < 0.74) continue;
      const [primary, duplicate] = a.createdAt <= b.createdAt ? [a, b] : [b, a];
      candidates.push({
        primaryReferenceId: primary.id,
        duplicateReferenceId: duplicate.id,
        score: Number(signal.score.toFixed(4)),
        reasons: signal.reasons
      });
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export async function mergeProjectReferences(params: {
  projectId: string;
  primaryReferenceId: string;
  mergedReferenceId: string;
  reason: string;
  eventId: string;
  createdAt: string;
  createdByUserId: string | null;
  createdByUsername: string;
}): Promise<{ primary: ProjectReference; removedReferenceId: string; event: ProjectReferenceMergeEvent }> {
  if (params.primaryReferenceId === params.mergedReferenceId) {
    throw new Error('primaryReferenceId and mergedReferenceId must be different.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: referenceRows } = await client.query(
      `SELECT * FROM project_references
       WHERE project_id = $1 AND id = ANY($2::text[])`,
      [params.projectId, [params.primaryReferenceId, params.mergedReferenceId]]
    );
    if (referenceRows.length !== 2) {
      throw new Error('Both references must exist in the selected project.');
    }
    const primaryRow = referenceRows.find((row) => row.id === params.primaryReferenceId);
    const mergedRow = referenceRows.find((row) => row.id === params.mergedReferenceId);
    if (!primaryRow || !mergedRow) {
      throw new Error('Unable to load selected references.');
    }
    const primary = mapProjectReferenceRow(primaryRow);
    const merged = mapProjectReferenceRow(mergedRow);
    const mergedPrimary = buildMergedReference(primary, merged, params.createdAt);

    await client.query(
      `UPDATE project_references
       SET source_format = $3,
           reference_type = $4,
           title = $5,
           authors_json = $6,
           year = $7,
           container_title = $8,
           publisher = $9,
           doi = $10,
           url = $11,
           abstract_text = $12,
           keywords_json = $13,
           raw_text = $14,
           related_source_id = $15,
           updated_at = $16
       WHERE id = $1 AND project_id = $2`,
      [
        mergedPrimary.id,
        mergedPrimary.projectId,
        mergedPrimary.sourceFormat,
        mergedPrimary.referenceType,
        mergedPrimary.title,
        JSON.stringify(mergedPrimary.authors),
        mergedPrimary.year,
        mergedPrimary.containerTitle,
        mergedPrimary.publisher,
        mergedPrimary.doi,
        mergedPrimary.url,
        mergedPrimary.abstractText,
        JSON.stringify(mergedPrimary.keywords),
        mergedPrimary.rawText,
        mergedPrimary.relatedSourceId,
        mergedPrimary.updatedAt
      ]
    );

    await client.query(
      `UPDATE project_reference_links
       SET reference_id = $1, updated_at = $4
       WHERE project_id = $2 AND reference_id = $3`,
      [params.primaryReferenceId, params.projectId, params.mergedReferenceId, params.createdAt]
    );

    const { rows: collectionRows } = await client.query(
      `SELECT id, collection_id, reference_id
       FROM project_reference_collection_items
       WHERE project_id = $1 AND reference_id = ANY($2::text[])`,
      [params.projectId, [params.primaryReferenceId, params.mergedReferenceId]]
    );
    const primaryCollectionIds = new Set(
      collectionRows
        .filter((row) => row.reference_id === params.primaryReferenceId)
        .map((row) => String(row.collection_id))
    );
    for (const row of collectionRows.filter((item) => item.reference_id === params.mergedReferenceId)) {
      const collectionId = String(row.collection_id);
      if (primaryCollectionIds.has(collectionId)) {
        await client.query(
          `DELETE FROM project_reference_collection_items WHERE id = $1 AND project_id = $2`,
          [row.id, params.projectId]
        );
      } else {
        await client.query(
          `UPDATE project_reference_collection_items
           SET reference_id = $1, updated_at = $4
           WHERE id = $2 AND project_id = $3`,
          [params.primaryReferenceId, row.id, params.projectId, params.createdAt]
        );
      }
    }

    await client.query(
      `DELETE FROM project_references WHERE id = $1 AND project_id = $2`,
      [params.mergedReferenceId, params.projectId]
    );

    const mergeEvent: ProjectReferenceMergeEvent = {
      id: params.eventId,
      projectId: params.projectId,
      primaryReferenceId: params.primaryReferenceId,
      mergedReferenceId: params.mergedReferenceId,
      reason: params.reason,
      mergedSnapshotJson: JSON.stringify(merged),
      createdByUserId: params.createdByUserId,
      createdByUsername: params.createdByUsername,
      createdAt: params.createdAt
    };
    await client.query(
      `INSERT INTO project_reference_merge_events (
        id, project_id, primary_reference_id, merged_reference_id, reason, merged_snapshot_json,
        created_by_user_id, created_by_username, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        mergeEvent.id,
        mergeEvent.projectId,
        mergeEvent.primaryReferenceId,
        mergeEvent.mergedReferenceId,
        mergeEvent.reason,
        mergeEvent.mergedSnapshotJson,
        mergeEvent.createdByUserId,
        mergeEvent.createdByUsername,
        mergeEvent.createdAt
      ]
    );

    await client.query('COMMIT');
    await touchProject(params.projectId);
    return { primary: mergedPrimary, removedReferenceId: params.mergedReferenceId, event: mergeEvent };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ── Segments ──────────────────────────────────────────────────────────────────

export async function listSegments(projectId: string, sourceId?: string): Promise<Segment[]> {
  let query: string;
  let params: string[];

  if (sourceId) {
    query = `SELECT * FROM segments WHERE project_id = $1 AND source_id = $2 ORDER BY created_at ASC`;
    params = [projectId, sourceId];
  } else {
    query = `SELECT * FROM segments WHERE project_id = $1 ORDER BY created_at ASC`;
    params = [projectId];
  }

  const { rows } = await pool.query(query, params);
  return rows.map((r) => createSegment({ id: r.id, projectId: r.project_id, sourceId: r.source_id, kind: r.kind, anchor: JSON.parse(r.anchor_json), text: r.text, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export async function insertSegment(segment: Segment): Promise<Segment> {
  await pool.query(
    `INSERT INTO segments (id, project_id, source_id, kind, anchor_json, text, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [segment.id, segment.projectId, segment.sourceId, segment.kind, JSON.stringify(segment.anchor), segment.text, segment.createdAt, segment.updatedAt]
  );
  await touchProject(segment.projectId);
  return segment;
}

export async function updateSegment(segment: Segment): Promise<Segment | null> {
  const result = await pool.query(
    `UPDATE segments
     SET source_id = $3,
         kind = $4,
         anchor_json = $5,
         text = $6,
         updated_at = $7
     WHERE id = $1 AND project_id = $2`,
    [
      segment.id,
      segment.projectId,
      segment.sourceId,
      segment.kind,
      JSON.stringify(segment.anchor),
      segment.text,
      segment.updatedAt
    ]
  );
  if ((result.rowCount ?? 0) === 0) return null;
  await touchProject(segment.projectId);
  return segment;
}

export async function deleteSegment(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM segments WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  const removed = (result.rowCount ?? 0) > 0;
  if (removed) {
    await touchProject(projectId);
  }
  return removed;
}

// ── Code Applications ─────────────────────────────────────────────────────────

export async function listCodeApplications(projectId: string, segmentId?: string, codeId?: string): Promise<CodeApplication[]> {
  const conditions: string[] = ['project_id = $1'];
  const params: string[] = [projectId];
  let i = 2;

  if (segmentId) { conditions.push(`segment_id = $${i++}`); params.push(segmentId); }
  if (codeId) { conditions.push(`code_id = $${i++}`); params.push(codeId); }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `SELECT * FROM code_applications ${where} ORDER BY created_at ASC`, params
  );
  return rows.map((r) => createCodeApplication({ id: r.id, projectId: r.project_id, segmentId: r.segment_id, codeId: r.code_id, caseId: r.case_id, coderId: r.coder_id, confidence: r.confidence, createdAt: r.created_at }));
}

export async function insertCodeApplication(ca: CodeApplication): Promise<CodeApplication> {
  await pool.query(
    `INSERT INTO code_applications (id, project_id, segment_id, code_id, case_id, coder_id, confidence, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [ca.id, ca.projectId, ca.segmentId, ca.codeId, ca.caseId ?? null, ca.coderId, ca.confidence, ca.createdAt]
  );
  await touchProject(ca.projectId);
  return ca;
}

export async function deleteCodeApplication(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM code_applications WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  );
  const removed = (result.rowCount ?? 0) > 0;
  if (removed) {
    await touchProject(projectId);
  }
  return removed;
}

// ── Trace Links ───────────────────────────────────────────────────────────────

export async function listTraceLinks(projectId: string): Promise<TraceLinkRecord[]> {
  const { rows } = await pool.query(`
    SELECT
      tl.variable_id,
      v.name AS variable_name,
      v.label AS variable_label,
      tl.case_id,
      c.label AS case_label,
      tl.supporting_code_application_ids_json,
      v.derived_from_code_id
    FROM trace_links tl
    JOIN variables v ON v.id = tl.variable_id
    JOIN cases c ON c.id = tl.case_id
    WHERE v.project_id = $1
    ORDER BY v.name ASC, c.label ASC
  `, [projectId]);

  return rows.map((r) => ({
    variableId: r.variable_id,
    variableName: r.variable_name,
    variableLabel: r.variable_label,
    caseId: r.case_id,
    caseLabel: r.case_label,
    supportingCodeApplicationIds: JSON.parse(r.supporting_code_application_ids_json),
    derivedFromCodeId: r.derived_from_code_id ?? null
  }));
}

// ── Trace Link Derivation ─────────────────────────────────────────────────────
//
// For each derived_code variable that has a derived_from_code_id:
//   For each case in the project:
//     Find all code_applications where:
//       - code_id = variable.derived_from_code_id
//       - the segment's source_id is in the case's source_ids (case is linked to that source)
//         OR the code_application's case_id = this case's id directly
//     If any found → upsert trace link with those application IDs
//     If none found → delete any existing trace link for this variable+case
//
export async function deriveTraceLinks(projectId: string): Promise<DeriveResult> {
  const result: DeriveResult = { created: 0, updated: 0, deleted: 0, skipped: 0 };

  // Get all derived_code variables with a linked code
  const { rows: varRows } = await pool.query(`
    SELECT id, name, derived_from_code_id FROM variables
    WHERE project_id = $1 AND source_kind = 'derived_code' AND derived_from_code_id IS NOT NULL
  `, [projectId]);

  if (varRows.length === 0) return result;

  // Get all cases for the project
  const { rows: caseRows } = await pool.query(`
    SELECT id, label, source_ids_json FROM cases WHERE project_id = $1
  `, [projectId]);

  if (caseRows.length === 0) return result;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const variable of varRows) {
      for (const caseRow of caseRows) {
        const sourceIds: string[] = JSON.parse(caseRow.source_ids_json);

        // Find supporting code applications:
        // Either the CA is directly tagged to this case,
        // OR the segment it's on belongs to a source in this case
        const { rows: caRows } = await client.query(`
          SELECT ca.id
          FROM code_applications ca
          JOIN segments s ON s.id = ca.segment_id
          WHERE ca.project_id = $1
            AND ca.code_id = $2
            AND (
              ca.case_id = $3
              OR s.source_id = ANY($4::text[])
            )
          ORDER BY ca.created_at ASC
        `, [projectId, variable.derived_from_code_id, caseRow.id, sourceIds]);

        const supportingIds = caRows.map((r: { id: string }) => r.id);

        // Check if trace link already exists
        const { rows: existingRows } = await client.query(`
          SELECT supporting_code_application_ids_json
          FROM trace_links WHERE variable_id = $1 AND case_id = $2
        `, [variable.id, caseRow.id]);

        if (supportingIds.length > 0) {
          const supportingJson = JSON.stringify(supportingIds);
          if (existingRows.length === 0) {
            await client.query(`
              INSERT INTO trace_links (variable_id, case_id, supporting_code_application_ids_json)
              VALUES ($1, $2, $3)
            `, [variable.id, caseRow.id, supportingJson]);
            result.created++;
          } else {
            const existing = existingRows[0].supporting_code_application_ids_json;
            if (existing !== supportingJson) {
              await client.query(`
                UPDATE trace_links SET supporting_code_application_ids_json = $1
                WHERE variable_id = $2 AND case_id = $3
              `, [supportingJson, variable.id, caseRow.id]);
              result.updated++;
            } else {
              result.skipped++;
            }
          }
        } else {
          if (existingRows.length > 0) {
            await client.query(`
              DELETE FROM trace_links WHERE variable_id = $1 AND case_id = $2
            `, [variable.id, caseRow.id]);
            result.deleted++;
          } else {
            result.skipped++;
          }
        }
      }
    }

    await client.query('COMMIT');
    await touchProject(projectId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return result;
}

// ── Summary ───────────────────────────────────────────────────────────────────

async function countWhere(table: string, col: string, val: string): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*) AS n FROM ${table} WHERE ${col} = $1`, [val]);
  return Number(rows[0].n);
}

async function countAll(table: string): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
  return Number(rows[0].n);
}

export async function getProjectSummary(projectId: string): Promise<ProjectSummary> {
  const { rows: pr } = await pool.query(`SELECT * FROM projects WHERE id = $1 LIMIT 1`, [projectId]);
  if (pr.length === 0) throw new Error('Project not found.');
  const p = pr[0];

  const { rows: sr } = await pool.query(`SELECT * FROM sources WHERE project_id = $1 ORDER BY updated_at DESC LIMIT 1`, [projectId]);
  const { rows: cr } = await pool.query(`SELECT * FROM codes WHERE project_id = $1 ORDER BY updated_at DESC LIMIT 1`, [projectId]);
  const { rows: vr } = await pool.query(`SELECT * FROM variables WHERE project_id = $1 ORDER BY updated_at DESC LIMIT 1`, [projectId]);

  const { rows: tlr } = await pool.query(
    `SELECT COUNT(*) AS n FROM trace_links tl JOIN variables v ON v.id = tl.variable_id WHERE v.project_id = $1`,
    [projectId]
  );

  return {
    project: createProject({ id: p.id, name: p.name, workspaceMode: p.workspace_mode ?? 'solo', description: p.description, createdAt: p.created_at, updatedAt: p.updated_at }),
    source: sr.length > 0 ? createSource({
      id: sr[0].id,
      projectId: sr[0].project_id,
      kind: sr[0].kind,
      title: sr[0].title,
      language: sr[0].language,
      contentType: sr[0].content_type,
      contentUrl: sr[0].content_url ?? null,
      contentText: sr[0].content_text ?? '',
      createdAt: sr[0].created_at,
      updatedAt: sr[0].updated_at
    }) : null,
    code: cr.length > 0 ? createCode({ id: cr[0].id, projectId: cr[0].project_id, parentCodeId: cr[0].parent_code_id, name: cr[0].name, description: cr[0].description, colorToken: cr[0].color_token, createdAt: cr[0].created_at, updatedAt: cr[0].updated_at }) : null,
    variable: vr.length > 0 ? createVariable({ id: vr[0].id, projectId: vr[0].project_id, name: vr[0].name, label: vr[0].label, kind: vr[0].kind, sourceKind: vr[0].source_kind, createdAt: vr[0].created_at, updatedAt: vr[0].updated_at }) : null,
    counts: {
      projects: await countAll('projects'),
      projectSources: await countWhere('sources', 'project_id', projectId),
      projectCodes: await countWhere('codes', 'project_id', projectId),
      projectVariables: await countWhere('variables', 'project_id', projectId),
      projectCases: await countWhere('cases', 'project_id', projectId),
      projectSegments: await countWhere('segments', 'project_id', projectId),
      projectCodeApplications: await countWhere('code_applications', 'project_id', projectId),
      traceLinks: Number(tlr[0].n)
    },
    db: { host: getDbHost() }
  };
}

export async function getProjectActivity(projectId: string): Promise<string> {
  const { rows } = await pool.query(`
    SELECT MAX(ts) AS latest FROM (
      SELECT updated_at AS ts FROM projects WHERE id = $1
      UNION ALL SELECT updated_at FROM sources WHERE project_id = $1
      UNION ALL SELECT updated_at FROM codes WHERE project_id = $1
      UNION ALL SELECT updated_at FROM variables WHERE project_id = $1
      UNION ALL SELECT updated_at FROM cases WHERE project_id = $1
     UNION ALL SELECT updated_at FROM memos WHERE project_id = $1
     UNION ALL SELECT updated_at FROM attributes WHERE project_id = $1
     UNION ALL SELECT updated_at FROM annotations WHERE project_id = $1
     UNION ALL SELECT updated_at FROM relationships WHERE project_id = $1
     UNION ALL SELECT updated_at FROM transcript_sync_links WHERE project_id = $1
     UNION ALL SELECT updated_at FROM transcription_jobs WHERE project_id = $1
     UNION ALL SELECT updated_at FROM project_references WHERE project_id = $1
     UNION ALL SELECT updated_at FROM project_reference_links WHERE project_id = $1
     UNION ALL SELECT updated_at FROM project_reference_collections WHERE project_id = $1
     UNION ALL SELECT updated_at FROM project_reference_collection_items WHERE project_id = $1
     UNION ALL SELECT created_at FROM project_reference_merge_events WHERE project_id = $1
     UNION ALL SELECT updated_at FROM segments WHERE project_id = $1
      UNION ALL SELECT created_at FROM code_applications WHERE project_id = $1
    ) t
  `, [projectId]);
  return rows[0].latest ?? nowIso();
}
