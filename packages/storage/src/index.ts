import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function resolveStorageRoot(env: NodeJS.ProcessEnv = process.env): string {
  return env.MU_STORAGE_ROOT?.trim() || path.resolve(process.cwd(), 'data');
}

export async function ensureDirectory(dirPath: string): Promise<string> {
  await mkdir(dirPath, { recursive: true });
  return dirPath;
}

export function sanitizeFileLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'artifact';
}

export async function writeProjectArtifact(params: {
  projectId: string;
  area: 'exports' | 'worker' | 'audit' | 'backups';
  label: string;
  extension: 'json' | 'csv' | 'txt';
  contents: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ absolutePath: string; relativePath: string }> {
  const root = resolveStorageRoot(params.env);
  const dir = await ensureDirectory(path.join(root, params.area, params.projectId));
  const filename = `${new Date().toISOString().replace(/[:]/g, '-')}-${sanitizeFileLabel(params.label)}.${params.extension}`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, params.contents, 'utf8');
  return {
    absolutePath,
    relativePath: path.relative(root, absolutePath).replaceAll('\\', '/')
  };
}

export async function writeProjectArtifactBytes(params: {
  projectId: string;
  area: 'exports' | 'worker' | 'audit' | 'backups';
  label: string;
  extension: string;
  contents: Uint8Array;
  env?: NodeJS.ProcessEnv;
}): Promise<{ absolutePath: string; relativePath: string }> {
  const root = resolveStorageRoot(params.env);
  const dir = await ensureDirectory(path.join(root, params.area, params.projectId));
  const filename = `${new Date().toISOString().replace(/[:]/g, '-')}-${sanitizeFileLabel(params.label)}.${params.extension}`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, params.contents);
  return {
    absolutePath,
    relativePath: path.relative(root, absolutePath).replaceAll('\\', '/')
  };
}

export async function listProjectArtifacts(params: {
  projectId: string;
  area: 'exports' | 'worker' | 'audit' | 'backups';
  env?: NodeJS.ProcessEnv;
}): Promise<Array<{ absolutePath: string; relativePath: string; filename: string; size: number; modifiedAt: string }>> {
  const root = resolveStorageRoot(params.env);
  const dir = path.join(root, params.area, params.projectId);
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const absolutePath = path.join(dir, entry.name);
        const info = await stat(absolutePath);
        return {
          absolutePath,
          relativePath: path.relative(root, absolutePath).replaceAll('\\', '/'),
          filename: entry.name,
          size: info.size,
          modifiedAt: info.mtime.toISOString()
        };
      }));
    return files.sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));
  } catch {
    return [];
  }
}

export async function readStoredArtifact(relativePath: string, env: NodeJS.ProcessEnv = process.env): Promise<Buffer> {
  const absolutePath = resolveStoredArtifactAbsolutePath(relativePath, env);
  return readFile(absolutePath);
}

export function resolveStoredArtifactAbsolutePath(relativePath: string, env: NodeJS.ProcessEnv = process.env): string {
  const root = resolveStorageRoot(env);
  const normalized = path.normalize(relativePath);
  const absolutePath = path.resolve(root, normalized);
  if (!absolutePath.startsWith(path.resolve(root))) {
    throw new Error('Artifact path is outside the storage root.');
  }
  return absolutePath;
}

export async function pruneProjectArtifacts(params: {
  projectId: string;
  area: 'exports' | 'worker' | 'audit' | 'backups';
  maxAgeDays: number;
  env?: NodeJS.ProcessEnv;
}): Promise<number> {
  if (!(params.maxAgeDays > 0)) return 0;
  const items = await listProjectArtifacts(params);
  const cutoff = Date.now() - (params.maxAgeDays * 24 * 60 * 60 * 1000);
  let removed = 0;
  for (const item of items) {
    const modifiedAt = Date.parse(item.modifiedAt);
    if (Number.isNaN(modifiedAt) || modifiedAt > cutoff) continue;
    await rm(item.absolutePath, { force: true });
    removed += 1;
  }
  return removed;
}

export async function deleteProjectArtifacts(params: {
  projectId: string;
  env?: NodeJS.ProcessEnv;
}): Promise<void> {
  const root = resolveStorageRoot(params.env);
  for (const area of ['exports', 'worker', 'audit', 'backups'] as const) {
    const dir = path.join(root, area, params.projectId);
    await rm(dir, { recursive: true, force: true });
  }
}
