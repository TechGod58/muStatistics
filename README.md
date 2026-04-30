<!-- WIP-BANNER:START -->
> [!IMPORTANT]
> **Status: Work in Progress**
>
> This repository is under active development. Content, structure, and implementation details may change frequently.
<!-- WIP-BANNER:END -->

# muStatistics

muStatistics is a web-native mixed-methods research platform in progress.

Its practical goal is narrower than full IBM SPSS + NVivo parity:

- qualitative coding
- case management
- traceable variable derivation
- basic descriptive statistics
- export for downstream reporting

## Legal and license

- Legal notice: `LEGAL_NOTICE.md`
- License: `LICENSE.txt` (Proprietary Non-Commercial)

## Current direction

This project is being shaped around the workflows a university research or assessment team uses most often:

- code interview and open-ended survey text
- organize cases and participant attributes
- derive variables from coding
- inspect simple summaries
- export clean datasets and evidence bundles

See the scoped roadmap in `docs/product/university-focused-roadmap.md`.
Collaboration expansion notes live in `docs/product/collaboration-platform.md`.
Current SPSS/NVivo coverage and remaining gaps are tracked in `docs/product/parity-audit.md`.
Pilot readiness and pre-pilot validation steps are tracked in `docs/product/pilot-readiness-checklist.md`.
Portable runtime and packaging notes live in `docs/deployment/portable-mode.md`.
SQL and Microsoft Office integration-hook notes live in `docs/deployment/integration-hooks.md`.
Production hardening and deployment validation runbooks live in `docs/deployment/production-hardening.md`.

## Current implementation

The repo already contains:

- `apps/api` - Fastify API with auth, projects, memberships, imports, sources, codes, variables, cases, segments, code applications, trace-link derivation, export, transforms, crosstabs, and regression
- `apps/web` - browser UI for coding, case management, collaboration, import/export, descriptives, crosstabs, saved transforms, regression, and media-linked segment capture
- `apps/worker` - scaffold only, not a production background job runner yet
- `packages/core-domain` - shared mixed-methods domain model
- `packages/qual-engine` - minimal qualitative retrieval helper
- `packages/quant-engine` - descriptives, transforms, crosstabs, and first-pass regression helpers
- `packages/mixed-methods` - binary code-to-variable bridge

Scaffolds still present in the repo, but not active MVP features:

- `packages/ai`
- `packages/auth`
- `packages/storage`
- `packages/ui`

## Windows restart-safe startup

If Windows restarts and your shell does not pick up `pnpm` on `PATH`, use the bundled launcher scripts:

- `scripts\windows\start-all.cmd`
- `scripts\windows\start-api.cmd`
- `scripts\windows\start-web.cmd`
- `scripts\windows\stop-dev.cmd`
- `scripts\windows\status.cmd`

The launchers call Node/Corepack from the default Windows install location and do not depend on `pnpm.cmd` being available in the current shell.

## Portable mode

For a single-user portable run without a PostgreSQL install:

- `pnpm -r build`
- `start-portable.cmd`

To build a moveable Windows bundle:

- `pnpm build:portable`

## Product boundary

Near-term target:

- university mixed-methods MVP

Not the near-term target:

- full SPSS parity
- full NVivo parity

## Next build priorities

1. Finish access-control hardening and auditability.
2. Add MU identity integration instead of local-only accounts.
3. Expand qualitative retrieval, search, and evidence export.
4. Expand derived variable coverage beyond binary code presence.
5. Replace worker and scaffold packages with real implementations or remove them.

## Validation

Before a pilot run, use:

- `pnpm doctor`
- `pnpm -r typecheck`
- `pnpm -r test`
- `pnpm -r build`
- `pnpm test:e2e:smoke`
- `pnpm test:e2e:hardening`
- `pnpm test:perf:baseline`
- `pnpm test:perf:gate`

`scripts/e2e-smoke.mjs` exercises the main mixed-methods pilot workflow from login through import, coding, derivation, analysis, export, backup, and restore.
