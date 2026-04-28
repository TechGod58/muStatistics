# AMOS / SEM Parity Strategy

## Decision

`muStatistics` will use an explicit **integration-boundary strategy** for AMOS/SEM parity, not a native SEM engine in this release line.

## Why this strategy

- Native SEM parity at IBM ecosystem depth is a separate statistical product effort.
- The current platform already supports broad SPSS-style procedures; SEM can be integrated without destabilizing those paths.
- Universities often need governed execution and traceability around model tooling/licensing, which is cleaner with a boundary.

## Integration boundary contract

- Runtime status is exposed through `GET /integrations/sem/status` and included in `GET /integrations/status`.
- Strategy is controlled by:
  - `MU_SEM_PARITY_STRATEGY` (`integration_boundary` or `native`)
  - `MU_SEM_PROVIDER` (default `amos`)
  - `MU_SEM_HOOK_ENABLED`
  - `MU_AMOS_EXECUTABLE_PATH`
  - `MU_SEM_BRIDGE_SCRIPT_PATH`
- `executionReady` reports whether boundary execution is configured for production use.

## Current state

- Native SEM execution is intentionally marked as not implemented.
- Integration boundary is implemented and deployment-governed.
- If native strategy is selected without native implementation, status reports that mismatch explicitly.

## Next implementation layer (when needed)

- Add model-spec handoff and results import route under the SEM boundary.
- Add audit-trace fields for SEM model runs and artifacts.
- Add UI launcher and run-history view under quantitative advanced modeling.
