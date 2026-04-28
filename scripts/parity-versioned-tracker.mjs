import process from 'node:process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const registryPath = path.resolve(process.cwd(), 'docs/product/parity/registry.json');
const reportPath = path.resolve(process.cwd(), 'docs/product/parity/registry.md');
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (const item of argv) {
    if (!item.startsWith('--')) {
      args._.push(item);
      continue;
    }
    const eq = item.indexOf('=');
    const key = eq === -1 ? item.slice(2) : item.slice(2, eq);
    const value = eq === -1 ? '1' : item.slice(eq + 1);
    if (args[key] === undefined) {
      args[key] = value;
    } else if (Array.isArray(args[key])) {
      args[key].push(value);
    } else {
      args[key] = [args[key], value];
    }
  }
  return args;
}

function asArray(value) {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [String(value).trim()].filter(Boolean);
}

function normalizeTrack(value) {
  return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
}

function normalizeRegistry(payload) {
  const registry = payload && typeof payload === 'object' ? payload : {};
  registry.schemaVersion = Number(registry.schemaVersion ?? 1);
  registry.updatedAt = typeof registry.updatedAt === 'string' ? registry.updatedAt : new Date().toISOString();
  registry.snapshots = Array.isArray(registry.snapshots) ? registry.snapshots : [];
  return registry;
}

function openGapCount(snapshot, trackName) {
  return Array.isArray(snapshot?.tracks?.[trackName]?.openGaps)
    ? snapshot.tracks[trackName].openGaps.length
    : 0;
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function renderMarkdown(registry) {
  const snapshots = registry.snapshots ?? [];
  const lines = [
    '# Versioned Parity Registry',
    '',
    'This file is generated from `docs/product/parity/registry.json`.',
    'Update it via `pnpm parity:snapshot` so parity stays versioned as SPSS/NVivo evolve.',
    '',
    `Last updated: ${registry.updatedAt}`,
    '',
    '## Snapshot Timeline',
    '',
    '| Snapshot | muStatistics | Captured | SPSS reference | NVivo reference | SPSS open gaps | NVivo open gaps | Platform open gaps |',
    '| --- | --- | --- | --- | --- | ---: | ---: | ---: |'
  ];

  for (const snapshot of snapshots) {
    lines.push(
      `| ${snapshot.id} | ${snapshot.muStatisticsVersion} | ${formatDate(snapshot.capturedAt)} | ${snapshot.references?.spss ?? 'n/a'} | ${snapshot.references?.nvivo ?? 'n/a'} | ${openGapCount(snapshot, 'spss')} | ${openGapCount(snapshot, 'nvivo')} | ${openGapCount(snapshot, 'platform')} |`
    );
  }

  const latest = snapshots[snapshots.length - 1];
  if (latest) {
    lines.push('', '## Latest Snapshot', '', latest.summary || '_No summary provided._');
    for (const trackName of ['spss', 'nvivo', 'platform']) {
      const open = latest.tracks?.[trackName]?.openGaps ?? [];
      lines.push('', `### ${trackName.toUpperCase()} Open Gaps`);
      if (open.length === 0) {
        lines.push('', '- None');
      } else {
        lines.push('');
        for (const item of open) lines.push(`- ${item}`);
      }
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function ensureTrack(snapshot, trackName) {
  snapshot.tracks = snapshot.tracks ?? {};
  snapshot.tracks[trackName] = snapshot.tracks[trackName] ?? { openGaps: [], closedSincePrior: [] };
  snapshot.tracks[trackName].openGaps = normalizeTrack(snapshot.tracks[trackName].openGaps ?? []);
  snapshot.tracks[trackName].closedSincePrior = normalizeTrack(snapshot.tracks[trackName].closedSincePrior ?? []);
}

function applyTrackUpdates(snapshot, prior, trackName, addValues, closeValues) {
  ensureTrack(snapshot, trackName);
  const baseOpen = normalizeTrack(prior?.tracks?.[trackName]?.openGaps ?? []);
  const add = normalizeTrack(addValues);
  const close = normalizeTrack(closeValues);
  const nextOpen = new Set(baseOpen);
  for (const item of add) nextOpen.add(item);
  for (const item of close) nextOpen.delete(item);
  snapshot.tracks[trackName].openGaps = Array.from(nextOpen);
  snapshot.tracks[trackName].closedSincePrior = close;
}

function getPackageVersion() {
  const pkg = readJson(packageJsonPath, {});
  return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
}

function runStatus(registry) {
  const snapshots = registry.snapshots ?? [];
  if (snapshots.length === 0) {
    console.log('No parity snapshots found.');
    return;
  }
  const latest = snapshots[snapshots.length - 1];
  console.log(`latest snapshot: ${latest.id}`);
  console.log(`muStatistics version: ${latest.muStatisticsVersion}`);
  console.log(`captured: ${latest.capturedAt}`);
  console.log(`SPSS reference: ${latest.references?.spss ?? 'n/a'}`);
  console.log(`NVivo reference: ${latest.references?.nvivo ?? 'n/a'}`);
  console.log(`open gaps -> SPSS:${openGapCount(latest, 'spss')} NVivo:${openGapCount(latest, 'nvivo')} Platform:${openGapCount(latest, 'platform')}`);
}

function runSnapshot(registry, args) {
  const snapshots = registry.snapshots ?? [];
  const prior = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const muStatisticsVersion = String(args['mu-version'] ?? getPackageVersion()).trim();
  const capturedAt = String(args['captured-at'] ?? new Date().toISOString()).trim();
  const id = String(args.id ?? `${muStatisticsVersion}-${formatDate(capturedAt)}`).trim();

  const snapshot = {
    id,
    muStatisticsVersion,
    capturedAt,
    references: {
      spss: String(args['spss-ref'] ?? prior?.references?.spss ?? 'IBM SPSS Statistics current major release').trim(),
      nvivo: String(args['nvivo-ref'] ?? prior?.references?.nvivo ?? 'NVivo current major release').trim()
    },
    summary: String(args.summary ?? prior?.summary ?? '').trim(),
    tracks: {}
  };

  applyTrackUpdates(snapshot, prior, 'spss', asArray(args['spss-gap']), asArray(args['spss-close']));
  applyTrackUpdates(snapshot, prior, 'nvivo', asArray(args['nvivo-gap']), asArray(args['nvivo-close']));
  applyTrackUpdates(snapshot, prior, 'platform', asArray(args['platform-gap']), asArray(args['platform-close']));

  const duplicateIndex = snapshots.findIndex((item) => item.id === snapshot.id);
  if (duplicateIndex >= 0) {
    snapshots[duplicateIndex] = snapshot;
  } else {
    snapshots.push(snapshot);
  }
  registry.snapshots = snapshots;
  registry.updatedAt = new Date().toISOString();

  writeJson(registryPath, registry);
  writeFileSync(reportPath, renderMarkdown(registry), 'utf8');
  console.log(`snapshot saved: ${snapshot.id}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = String(args._[0] ?? 'status').trim().toLowerCase();
  const registry = normalizeRegistry(readJson(registryPath, {}));

  if (command === 'snapshot') {
    runSnapshot(registry, args);
    return;
  }
  if (command === 'status') {
    runStatus(registry);
    return;
  }
  if (command === 'render') {
    registry.updatedAt = new Date().toISOString();
    writeFileSync(reportPath, renderMarkdown(registry), 'utf8');
    console.log(`rendered: ${reportPath}`);
    return;
  }
  throw new Error(`Unsupported command: ${command}`);
}

main();
