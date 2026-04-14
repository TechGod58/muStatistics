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

export type TranscriptSyncLink = {
  id: string;
  projectId: string;
  mediaSourceId: string;
  transcriptSourceId: string;
  segmentId: string | null;
  startMs: number;
  endMs: number;
  transcriptText: string;
  createdAt: string;
  updatedAt: string;
};

export type TranscriptionJob = {
  id: string;
  projectId: string;
  mediaSourceId: string;
  outputSourceId: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  mode: 'segment_assembly';
  note: string;
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

export type AuditActorRole = 'student' | 'professor' | 'system';

export type AuditEventRecord = AuditEvent;
export type RelationshipRecord = Relationship;

export type ProjectReference = {
  id: string;
  projectId: string;
  sourceFormat: 'ris' | 'bibtex' | 'manual';
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

export type GovernancePolicy = {
  id: 'global';
  idleTimeoutMinutes: number;
  loginThrottleWindowMinutes: number;
  loginThrottleMaxFailures: number;
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
      login_throttle_window_minutes INTEGER NOT NULL DEFAULT 15,
      login_throttle_max_failures INTEGER NOT NULL DEFAULT 5,
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
  await ensureColumn('external_sql_import_jobs', 'max_rows', `ALTER TABLE external_sql_import_jobs ADD COLUMN max_rows INTEGER NOT NULL DEFAULT 500`);
  await ensureColumn('external_sql_import_jobs', 'schedule_enabled', `ALTER TABLE external_sql_import_jobs ADD COLUMN schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
  await ensureColumn('external_sql_import_jobs', 'schedule_interval_minutes', `ALTER TABLE external_sql_import_jobs ADD COLUMN schedule_interval_minutes INTEGER`);
  await ensureColumn('external_sql_import_jobs', 'schedule_next_run_at', `ALTER TABLE external_sql_import_jobs ADD COLUMN schedule_next_run_at TEXT`);
  await ensureColumn('external_sql_import_jobs', 'last_run_at', `ALTER TABLE external_sql_import_jobs ADD COLUMN last_run_at TEXT`);
  await ensureColumn('external_sql_import_jobs', 'last_run_status', `ALTER TABLE external_sql_import_jobs ADD COLUMN last_run_status TEXT`);
  await ensureColumn('external_sql_import_jobs', 'last_run_message', `ALTER TABLE external_sql_import_jobs ADD COLUMN last_run_message TEXT`);

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
      login_throttle_window_minutes,
      login_throttle_max_failures,
      audit_export_max_rows,
      backup_retention_days,
      updated_at,
      updated_by_user_id
    )
    VALUES ('global', 90, 15, 5, 2000, 30, NOW()::text, NULL)
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function insertTranscriptSyncLink(link: TranscriptSyncLink): Promise<TranscriptSyncLink> {
  await pool.query(
    `INSERT INTO transcript_sync_links (id, project_id, media_source_id, transcript_source_id, segment_id, start_ms, end_ms, transcript_text, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      link.id,
      link.projectId,
      link.mediaSourceId,
      link.transcriptSourceId,
      link.segmentId,
      link.startMs,
      link.endMs,
      link.transcriptText,
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
         updated_at = $9
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
    mode: 'segment_assembly',
    note: row.note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null
  }));
}

export async function insertTranscriptionJob(job: TranscriptionJob): Promise<TranscriptionJob> {
  await pool.query(
    `INSERT INTO transcription_jobs (id, project_id, media_source_id, output_source_id, status, mode, note, created_at, updated_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      job.id,
      job.projectId,
      job.mediaSourceId,
      job.outputSourceId,
      job.status,
      job.mode,
      job.note,
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
     SET output_source_id = $3, status = $4, mode = $5, note = $6, updated_at = $7, completed_at = $8
     WHERE id = $1 AND project_id = $2`,
    [
      job.id,
      job.projectId,
      job.outputSourceId,
      job.status,
      job.mode,
      job.note,
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

export async function getGovernancePolicy(): Promise<GovernancePolicy> {
  const { rows } = await pool.query(
    `SELECT * FROM governance_policies WHERE id = 'global' LIMIT 1`
  );
  const row = rows[0];
  return {
    id: 'global',
    idleTimeoutMinutes: Number(row?.idle_timeout_minutes ?? 90),
    loginThrottleWindowMinutes: Number(row?.login_throttle_window_minutes ?? 15),
    loginThrottleMaxFailures: Number(row?.login_throttle_max_failures ?? 5),
    auditExportMaxRows: Number(row?.audit_export_max_rows ?? 2000),
    backupRetentionDays: Number(row?.backup_retention_days ?? 30),
    updatedAt: row?.updated_at ?? nowIso(),
    updatedByUserId: row?.updated_by_user_id ?? null
  };
}

export async function updateGovernancePolicy(input: {
  idleTimeoutMinutes: number;
  loginThrottleWindowMinutes: number;
  loginThrottleMaxFailures: number;
  auditExportMaxRows: number;
  backupRetentionDays: number;
  updatedByUserId: string | null;
}): Promise<GovernancePolicy> {
  const updatedAt = nowIso();
  await pool.query(
    `UPDATE governance_policies
     SET idle_timeout_minutes = $2,
         login_throttle_window_minutes = $3,
         login_throttle_max_failures = $4,
         audit_export_max_rows = $5,
         backup_retention_days = $6,
         updated_at = $7,
         updated_by_user_id = $8
     WHERE id = $1`,
    [
      'global',
      input.idleTimeoutMinutes,
      input.loginThrottleWindowMinutes,
      input.loginThrottleMaxFailures,
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

export async function listProjectReferences(projectId: string): Promise<ProjectReference[]> {
  const { rows } = await pool.query(
    `SELECT * FROM project_references WHERE project_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    sourceFormat: row.source_format,
    referenceType: row.reference_type,
    title: row.title ?? '',
    authors: JSON.parse(row.authors_json ?? '[]'),
    year: row.year === null || row.year === undefined ? null : Number(row.year),
    containerTitle: row.container_title ?? '',
    publisher: row.publisher ?? '',
    doi: row.doi ?? '',
    url: row.url ?? '',
    abstractText: row.abstract_text ?? '',
    keywords: JSON.parse(row.keywords_json ?? '[]'),
    rawText: row.raw_text ?? '',
    relatedSourceId: row.related_source_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
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

export async function deleteProjectReference(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM project_references WHERE id = $1 AND project_id = $2`, [id, projectId]);
  if (result.rowCount && result.rowCount > 0) {
    await touchProject(projectId);
    return true;
  }
  return false;
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
     UNION ALL SELECT updated_at FROM segments WHERE project_id = $1
      UNION ALL SELECT created_at FROM code_applications WHERE project_id = $1
    ) t
  `, [projectId]);
  return rows[0].latest ?? nowIso();
}
