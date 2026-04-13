import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const requiredFiles = [
  'package.json',
  'pnpm-workspace.yaml',
  'apps/api/src/index.ts',
  'apps/api/src/db.ts',
  'apps/api/.env',
  'apps/web/index.html',
  'apps/web/src/app.js',
  'apps/web/src/styles.css',
  'packages/core-domain/src/index.ts',
  'packages/mixed-methods/src/index.ts',
  'docs/product/mvp.md',
  'docs/product/university-focused-roadmap.md'
];

function checkFile(relative) {
  const full = path.join(root, relative);
  const present = existsSync(full);
  console.log(`${present ? 'OK   ' : 'MISS '} ${relative}`);
  return present;
}

function loadEnvFile(relative) {
  const full = path.join(root, relative);
  if (!existsSync(full)) return {};
  const contents = readFileSync(full, 'utf8');
  const entries = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    entries[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return entries;
}

function resolveCommand(command, fallbacks = []) {
  if (path.isAbsolute(command) && existsSync(command)) return command;
  try {
    execFileSync(command, ['--version'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return command;
  } catch {
    for (const fallback of fallbacks) {
      if (existsSync(fallback)) return fallback;
    }
    return command;
  }
}

function checkCommand(label, command, args, fallbacks = []) {
  const resolved = resolveCommand(command, fallbacks);
  try {
    const isCmdScript = /\.(cmd|bat)$/i.test(resolved);
    const result = isCmdScript
      ? execFileSync('cmd.exe', ['/c', resolved, ...args], {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe']
        }).trim()
      : execFileSync(resolved, args, {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe']
        }).trim();
    console.log(`OK    ${label}: ${result}`);
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.log(`MISS  ${label}: ${detail}`);
    return false;
  }
}

function checkEnvConfig() {
  const env = {
    ...loadEnvFile('.env'),
    ...loadEnvFile('apps/api/.env'),
    ...process.env
  };

  let ok = true;
  const isPortable = ['1', 'true'].includes(String(env.MU_PORTABLE ?? '').toLowerCase());
  const databaseUrl = env.DATABASE_URL ?? '';
  if (isPortable) {
    console.log('OK    MU_PORTABLE embedded database mode');
  } else {
    try {
      const parsed = new URL(databaseUrl);
      const valid = parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
      console.log(`${valid ? 'OK   ' : 'MISS '} DATABASE_URL protocol`);
      ok = valid && ok;
    } catch {
      console.log('MISS DATABASE_URL parse');
      ok = false;
    }
  }

  try {
    new URL(env.APP_ORIGIN ?? '');
    console.log('OK    APP_ORIGIN parse');
  } catch {
    console.log('MISS  APP_ORIGIN parse');
    ok = false;
  }

  const sessionSecret = env.SESSION_SECRET ?? '';
  if (sessionSecret.length < 32 || sessionSecret.includes('change-this-secret-key')) {
    console.log('WARN  SESSION_SECRET is short or still using the placeholder value');
  } else {
    console.log('OK    SESSION_SECRET length');
  }

  const storageRoot = path.resolve(root, env.MU_STORAGE_ROOT || 'data');
  console.log(`${existsSync(storageRoot) ? 'OK   ' : 'WARN '} MU_STORAGE_ROOT ${storageRoot}`);

  const oidcKeys = ['OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_REDIRECT_URI'];
  const presentOidc = oidcKeys.filter((key) => (env[key] ?? '').trim());
  if (presentOidc.length > 0 && presentOidc.length < oidcKeys.length) {
    console.log(`WARN  OIDC partial configuration present (${presentOidc.join(', ')})`);
  } else if (presentOidc.length === oidcKeys.length) {
    console.log('OK    OIDC core settings present');
  } else {
    console.log('WARN  OIDC not configured');
  }

  return ok;
}

console.log(`Node: ${process.version}`);
console.log(`Working directory: ${root}`);

let ok = true;
for (const relative of requiredFiles) {
  ok = checkFile(relative) && ok;
}

ok = checkCommand('pnpm', 'pnpm', ['--version'], [
  path.join(process.env.APPDATA ?? '', 'npm', 'pnpm.cmd')
]) && ok;
ok = checkCommand('git', 'git', ['--version'], [
  'C:\\Program Files\\Git\\cmd\\git.exe'
]) && ok;
ok = checkCommand('postgres', 'psql', ['--version'], [
  'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe'
]) && ok;
ok = checkEnvConfig() && ok;

if (!ok) {
  process.exitCode = 1;
} else {
  console.log('Environment check passed.');
}
