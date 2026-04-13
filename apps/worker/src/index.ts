import 'dotenv/config';
import pg from 'pg';
import { writeProjectArtifact } from '@mu/storage';

const { Pool } = pg;

type ProjectSnapshot = {
  projectId: string;
  name: string;
  workspaceMode: string;
  updatedAt: string;
  counts: {
    sources: number;
    codes: number;
    variables: number;
    cases: number;
    segments: number;
    codeApplications: number;
    auditEvents: number;
  };
};

type SnapshotRow = {
  id: string;
  name: string;
  workspace_mode: string | null;
  updated_at: string;
  source_count: string | number;
  code_count: string | number;
  variable_count: string | number;
  case_count: string | number;
  segment_count: string | number;
  code_application_count: string | number;
  audit_event_count: string | number;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/mu_statistics'
});

async function loadSnapshots(): Promise<ProjectSnapshot[]> {
  const { rows } = await pool.query<SnapshotRow>(`
    SELECT
      p.id,
      p.name,
      p.workspace_mode,
      p.updated_at,
      (SELECT COUNT(*) FROM sources s WHERE s.project_id = p.id) AS source_count,
      (SELECT COUNT(*) FROM codes c WHERE c.project_id = p.id) AS code_count,
      (SELECT COUNT(*) FROM variables v WHERE v.project_id = p.id) AS variable_count,
      (SELECT COUNT(*) FROM cases ca WHERE ca.project_id = p.id) AS case_count,
      (SELECT COUNT(*) FROM segments sg WHERE sg.project_id = p.id) AS segment_count,
      (SELECT COUNT(*) FROM code_applications app WHERE app.project_id = p.id) AS code_application_count,
      (SELECT COUNT(*) FROM audit_events ae WHERE ae.project_id = p.id) AS audit_event_count
    FROM projects p
    ORDER BY p.updated_at DESC
  `);

  return rows.map((row) => ({
    projectId: row.id,
    name: row.name,
    workspaceMode: row.workspace_mode ?? 'solo',
    updatedAt: row.updated_at,
    counts: {
      sources: Number(row.source_count ?? 0),
      codes: Number(row.code_count ?? 0),
      variables: Number(row.variable_count ?? 0),
      cases: Number(row.case_count ?? 0),
      segments: Number(row.segment_count ?? 0),
      codeApplications: Number(row.code_application_count ?? 0),
      auditEvents: Number(row.audit_event_count ?? 0)
    }
  }));
}

async function run(): Promise<void> {
  const snapshots = await loadSnapshots();
  const written: Array<{ projectId: string; path: string }> = [];

  for (const snapshot of snapshots) {
    const artifact = await writeProjectArtifact({
      projectId: snapshot.projectId,
      area: 'worker',
      label: 'project-snapshot',
      extension: 'json',
      contents: JSON.stringify({
        generatedAt: new Date().toISOString(),
        snapshot
      }, null, 2)
    });
    written.push({ projectId: snapshot.projectId, path: artifact.relativePath });
  }

  console.log(JSON.stringify({
    status: 'ok',
    generatedAt: new Date().toISOString(),
    snapshots: written
  }, null, 2));
}

run()
  .catch((error) => {
    console.error('[worker] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
