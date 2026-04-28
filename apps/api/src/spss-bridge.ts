import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

export type SpssScalar = string | number | boolean | null;
export type SpssDatasetRow = Record<string, SpssScalar>;

export type SpssFieldMetadata = {
  sourceFieldKey: string;
  fieldLabel: string;
  measure: 'nominal' | 'ordinal' | 'scale' | 'unknown' | null;
  valueLabels: Array<{ value: SpssScalar; label: string }>;
  missingValues: SpssScalar[];
  missingRanges: Array<{ lo: SpssScalar; hi: SpssScalar }>;
};

export type SpssReadResult = {
  rows: SpssDatasetRow[];
  metadata: {
    fields: SpssFieldMetadata[];
    fileLabel: string | null;
    notes: string[];
    weightField: string | null;
    splitFields: string[];
  };
};

export type SpssWriteInput = {
  format: 'sav' | 'zsav';
  rows: SpssDatasetRow[];
  fieldOrder: string[];
  columnLabels: Record<string, string>;
  valueLabels: Record<string, Array<{ value: SpssScalar; label: string }>>;
  missingValues: Record<string, SpssScalar[]>;
  missingRanges: Record<string, Array<{ lo: SpssScalar; hi: SpssScalar }>>;
  variableMeasure: Record<string, 'nominal' | 'ordinal' | 'scale' | 'unknown'>;
  weightField: string | null;
  splitFields: string[];
  fileLabel: string | null;
  notes: string[];
};

type SpssBridgeConfig = {
  scriptPath: string;
  pythonCommand: string;
  pythonArgs: string[];
};

const apiModuleDir = path.dirname(fileURLToPath(import.meta.url));
const runtimeRoot = process.cwd();
const workspaceRoot = path.resolve(apiModuleDir, '../../..');

function findFirstExistingPath(paths: string[]): string | null {
  for (const candidate of paths) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveSpssBridgeConfig(): SpssBridgeConfig {
  const configuredScriptPath = process.env.MU_SPSS_BRIDGE_SCRIPT_PATH?.trim() || 'services/spss/spss_bridge.py';
  const scriptPath = findFirstExistingPath([
    path.resolve(runtimeRoot, configuredScriptPath),
    path.resolve(workspaceRoot, configuredScriptPath)
  ]) ?? path.resolve(workspaceRoot, configuredScriptPath);
  const pythonCommand = process.env.MU_SPSS_PYTHON_COMMAND?.trim() || 'py';
  const pythonArgs = (process.env.MU_SPSS_PYTHON_ARGS?.trim() || '-3.11')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return { scriptPath, pythonCommand, pythonArgs };
}

async function runBridge(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const config = resolveSpssBridgeConfig();
  const commandArgs = [...config.pythonArgs, config.scriptPath, ...args];
  return await new Promise((resolve, reject) => {
    const child = spawn(config.pythonCommand, commandArgs, {
      cwd: runtimeRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => reject(error));
    child.on('close', (code) => resolve({ stdout, stderr, code }));
  });
}

function normalizeMeasure(value: unknown): 'nominal' | 'ordinal' | 'scale' | 'unknown' | null {
  if (value === 'nominal' || value === 'ordinal' || value === 'scale' || value === 'unknown') return value;
  return null;
}

function normalizeScalar(value: unknown): SpssScalar {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  return String(value);
}

export async function readSpssBuffer(filename: string, buffer: Buffer): Promise<SpssReadResult> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mu-spss-read-'));
  const extension = path.extname(filename).toLowerCase() || '.sav';
  const inputPath = path.join(tempDir, `input${extension}`);
  const outputPath = path.join(tempDir, 'output.json');
  try {
    await writeFile(inputPath, buffer);
    const config = resolveSpssBridgeConfig();
    const bridge = await runBridge([
      'read',
      '--input',
      inputPath,
      '--output',
      outputPath
    ]);

    if (bridge.code !== 0) {
      const detail = bridge.stderr.trim() || bridge.stdout.trim() || 'Unknown SPSS bridge error.';
      throw new Error(`SPSS import bridge failed (${config.pythonCommand}): ${detail}`);
    }

    const raw = JSON.parse(await readFile(outputPath, 'utf8')) as {
      rows?: unknown[];
      metadata?: {
        columnNames?: unknown[];
        columnLabels?: Record<string, unknown>;
        variableMeasure?: Record<string, unknown>;
        variableValueLabels?: Record<string, Array<{ value: unknown; label: unknown }>>;
        missingRanges?: Record<string, Array<{ lo: unknown; hi: unknown }>>;
        missingUserValues?: Record<string, unknown[]>;
        fileLabel?: unknown;
        notes?: unknown[];
        weightField?: unknown;
        splitFields?: unknown[];
      };
    };

    const columnNames = Array.isArray(raw.metadata?.columnNames)
      ? raw.metadata?.columnNames.map((item) => String(item ?? '').trim()).filter(Boolean)
      : [];
    const columnLabels = raw.metadata?.columnLabels ?? {};
    const variableMeasure = raw.metadata?.variableMeasure ?? {};
    const variableValueLabels = raw.metadata?.variableValueLabels ?? {};
    const missingRanges = raw.metadata?.missingRanges ?? {};
    const missingUserValues = raw.metadata?.missingUserValues ?? {};

    const fields: SpssFieldMetadata[] = columnNames.map((fieldName) => {
      const labels = Array.isArray(variableValueLabels[fieldName])
        ? variableValueLabels[fieldName]!.map((entry) => ({
          value: normalizeScalar(entry?.value),
          label: String(entry?.label ?? '')
        })).filter((entry) => entry.label.length > 0)
        : [];
      const userMissings = Array.isArray(missingUserValues[fieldName])
        ? missingUserValues[fieldName]!.map((entry) => normalizeScalar(entry)).filter((entry) => entry !== null)
        : [];
      const rangeMissings = Array.isArray(missingRanges[fieldName])
        ? missingRanges[fieldName]!.map((entry) => ({
          lo: normalizeScalar(entry?.lo),
          hi: normalizeScalar(entry?.hi)
        }))
        : [];
      return {
        sourceFieldKey: fieldName,
        fieldLabel: typeof columnLabels[fieldName] === 'string' && String(columnLabels[fieldName]).trim()
          ? String(columnLabels[fieldName]).trim()
          : fieldName,
        measure: normalizeMeasure(variableMeasure[fieldName]),
        valueLabels: labels,
        missingValues: userMissings,
        missingRanges: rangeMissings
      };
    });

    const rows = Array.isArray(raw.rows)
      ? raw.rows.map((entry) => {
        const row = entry as Record<string, unknown>;
        const normalized: SpssDatasetRow = {};
        for (const key of Object.keys(row)) {
          normalized[key] = normalizeScalar(row[key]);
        }
        return normalized;
      })
      : [];

    return {
      rows,
      metadata: {
        fields,
        fileLabel: typeof raw.metadata?.fileLabel === 'string' && raw.metadata.fileLabel.trim()
          ? raw.metadata.fileLabel.trim()
          : null,
        notes: Array.isArray(raw.metadata?.notes)
          ? raw.metadata!.notes.map((item) => String(item ?? '').trim()).filter(Boolean)
          : [],
        weightField: typeof raw.metadata?.weightField === 'string' && raw.metadata.weightField.trim()
          ? raw.metadata.weightField.trim()
          : null,
        splitFields: Array.isArray(raw.metadata?.splitFields)
          ? raw.metadata!.splitFields.map((item) => String(item ?? '').trim()).filter(Boolean)
          : []
      }
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function writeSpssBuffer(input: SpssWriteInput): Promise<Buffer> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mu-spss-write-'));
  const jsonPath = path.join(tempDir, 'input.json');
  const outputPath = path.join(tempDir, `output.${input.format}`);
  try {
    await writeFile(jsonPath, JSON.stringify(input), 'utf8');
    const config = resolveSpssBridgeConfig();
    const bridge = await runBridge([
      'write',
      '--input',
      jsonPath,
      '--output',
      outputPath,
      '--format',
      input.format
    ]);
    if (bridge.code !== 0) {
      const detail = bridge.stderr.trim() || bridge.stdout.trim() || 'Unknown SPSS bridge error.';
      throw new Error(`SPSS export bridge failed (${config.pythonCommand}): ${detail}`);
    }
    return await readFile(outputPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
