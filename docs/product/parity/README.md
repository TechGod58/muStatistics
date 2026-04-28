# Parity Tracking Workflow

Use the versioned registry to track parity shifts across releases as SPSS and NVivo add features.

## Commands

- `pnpm parity:status`
- `pnpm parity:snapshot --summary="<release summary>"`

## Snapshot update examples

Add new open gaps for a release:

```powershell
pnpm parity:snapshot --mu-version=0.2.1 --summary="Post-hardening release" --spss-gap="New SPSS delta" --nvivo-gap="New NVivo delta"
```

Close previously tracked gaps:

```powershell
pnpm parity:snapshot --mu-version=0.2.2 --summary="Closed tracked deltas" --spss-close="New SPSS delta" --platform-close="OIDC finalization pending admin handoff"
```

## Registry files

- `docs/product/parity/registry.json` (source of truth)
- `docs/product/parity/registry.md` (generated summary)
- `docs/product/parity/sem-amos-strategy.md` (AMOS/SEM parity boundary decision and integration contract)
