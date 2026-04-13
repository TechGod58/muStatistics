# Portable Mode

muStatistics is not a fully portable program by default. The standard development setup depends on:

- Node.js
- pnpm workspace installs
- a PostgreSQL server

Portable mode removes the PostgreSQL requirement and lets the API serve the built web app directly.
Integration-hook notes for SQL and Microsoft Office live in `docs/deployment/integration-hooks.md`.

## What portable mode does

- uses an embedded local database stored under `data/portable-db`
- serves the built web app from the API on `http://127.0.0.1:4000`
- stores portable runtime data under `data`
- runs as a single-user local application

## What portable mode does not do

- it is not the right deployment model for shared multi-user use
- it does not replace a campus deployment with centralized auth and governance
- it does not remove the need for MU SSO work when this moves into shared use

## Run portable mode from the repo

```cmd
pnpm -r build
start-portable.cmd
```

To remove the runtime dependency on a machine-level Node install for repo launches, cache the local Node runtime into the repo first:

```cmd
embed-node-runtime.cmd
```

## Build a portable bundle

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\portable\build-portable.ps1
```

That produces:

- `portable\muStatistics-portable\start-portable.cmd`
- `portable\muStatistics-portable\status-portable.cmd`
- `portable\muStatistics-portable\stop-portable.cmd`
- `portable\muStatistics-portable\install-desktop-shortcut.cmd`
- `portable\muStatistics-portable\app`

## Portable bundle behavior

- if a local Node runtime is available on the build machine, the build script copies it into `runtime\node`
- the launcher now prefers a bundled runtime at `runtime\node\node.exe`
- if no bundled Node runtime is present, the launcher falls back to `node` on `PATH`
- the launcher creates a root `.env` file on first run with a generated session secret
- the launcher writes runtime state under `data\portable-runtime.json`

## Intended use

Portable mode is appropriate for:

- demos
- one-machine field use
- moving the app between laptops without a PostgreSQL install
- offline or near-offline single-user research work

It is not the target mode for campus deployment.
