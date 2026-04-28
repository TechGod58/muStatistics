import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readSpssBuffer, writeSpssBuffer } from '../src/spss-bridge';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(testDir, '../../..');

function resolvePythonArgs(): string[] {
  return (process.env.MU_SPSS_PYTHON_ARGS?.trim() || '-3.11')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveBridgeScriptPath(): string {
  const configuredPath = process.env.MU_SPSS_BRIDGE_SCRIPT_PATH?.trim() || 'services/spss/spss_bridge.py';
  return path.resolve(workspaceRoot, configuredPath);
}

function canRunSpssBridge(): boolean {
  const pythonCommand = process.env.MU_SPSS_PYTHON_COMMAND?.trim() || 'py';
  const pythonArgs = resolvePythonArgs();
  const scriptPath = resolveBridgeScriptPath();
  if (!existsSync(scriptPath)) return false;
  const probe = spawnSync(
    pythonCommand,
    [...pythonArgs, '-c', 'import pyreadstat; import pandas; print("ok")'],
    { encoding: 'utf8' }
  );
  return probe.status === 0;
}

const itIfBridge = canRunSpssBridge() ? it : it.skip;

describe('spss bridge', () => {
  itIfBridge('round-trips SAV rows and metadata', async () => {
    const buffer = await writeSpssBuffer({
      format: 'sav',
      fieldOrder: ['case_label', 'group_code', 'score'],
      rows: [
        { case_label: 'Participant A', group_code: 1, score: 10 },
        { case_label: 'Participant B', group_code: 2, score: 999 }
      ],
      columnLabels: {
        case_label: 'Case Label',
        group_code: 'Group',
        score: 'Score'
      },
      valueLabels: {
        group_code: [
          { value: 1, label: 'Treatment' },
          { value: 2, label: 'Control' }
        ]
      },
      missingValues: {
        score: [999]
      },
      missingRanges: {
        score: [{ lo: 900, hi: 999 }]
      },
      variableMeasure: {
        case_label: 'nominal',
        group_code: 'nominal',
        score: 'scale'
      },
      weightField: 'score',
      splitFields: ['group_code'],
      fileLabel: 'muStatistics SPSS bridge test',
      notes: ['roundtrip-check']
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);

    const parsed = await readSpssBuffer('roundtrip.sav', buffer);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].case_label).toBe('Participant A');
    expect(parsed.metadata.weightField).toBe('score');
    expect(parsed.metadata.splitFields).toEqual(['group_code']);
    expect(parsed.metadata.fields.some((field) => field.sourceFieldKey === 'group_code')).toBe(true);
    const groupField = parsed.metadata.fields.find((field) => field.sourceFieldKey === 'group_code');
    expect(groupField?.valueLabels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 1, label: 'Treatment' }),
        expect.objectContaining({ value: 2, label: 'Control' })
      ])
    );
  });

  itIfBridge('exports and re-reads ZSAV', async () => {
    const buffer = await writeSpssBuffer({
      format: 'zsav',
      fieldOrder: ['case_label', 'metric'],
      rows: [
        { case_label: 'Participant C', metric: 4.5 },
        { case_label: 'Participant D', metric: 6.25 }
      ],
      columnLabels: {
        case_label: 'Case Label',
        metric: 'Metric'
      },
      valueLabels: {},
      missingValues: {},
      missingRanges: {},
      variableMeasure: {
        case_label: 'nominal',
        metric: 'scale'
      },
      weightField: null,
      splitFields: [],
      fileLabel: 'muStatistics ZSAV test',
      notes: []
    });

    expect(buffer.length).toBeGreaterThan(0);
    const parsed = await readSpssBuffer('roundtrip.zsav', buffer);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[1].case_label).toBe('Participant D');
  });
});
