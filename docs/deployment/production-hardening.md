# Production Hardening Runbook

This runbook covers the deployment-hardening tracks for muStatistics:

- MU SSO/OIDC finalization
- governance policy controls
- end-to-end hardening checks
- large-project performance baselines

## 1) SSO finalization (when admin values arrive)

Set these in `apps/api/.env` (or your deployment env):

- `OIDC_ISSUER`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET` (if required by provider)
- `OIDC_REDIRECT_URI`
- `OIDC_SCOPES` (default `openid profile email`)
- `OIDC_ALLOWED_EMAIL_DOMAIN` (optional)
- `OIDC_EXPECTED_AUDIENCE` (recommended; defaults to `OIDC_CLIENT_ID`)
- `OIDC_ALLOW_USERINFO_FALLBACK=0` (recommended for strict deployments)

Validation:

1. Restart API.
2. Run `pnpm doctor`.
3. Sign in as Professor and open:
   - `GET /auth/oidc/readiness?probe=1`
   - `GET /deployment/validate`
   - `GET /deployment/cutover-check`
4. Confirm:
   - OIDC discovery probe is successful.
   - OIDC redirect alignment check passes (`APP_ORIGIN` origin matches `OIDC_REDIRECT_URI`).
   - OIDC issuer consistency check passes (discovery issuer matches configured issuer).
   - OIDC audience strictness check is `pass` (explicit `OIDC_EXPECTED_AUDIENCE` set).
   - no `OIDC_*` deployment errors remain.
   - cutover check reports `readyForCutover: true` (or only non-blocking warnings).

## 2) Governance policy controls

Professor accounts can configure:

- idle timeout
- absolute session timeout
- login throttle window/max failures
- local auth enabled/disabled
- password minimum length
- password complexity toggles (uppercase/number/symbol)
- audit export max rows
- backup retention days

Recommendation for campus deployment:

- local auth disabled only after OIDC is fully configured
- password min length >= 12 (if local auth remains enabled)
- all complexity toggles enabled
- absolute session timeout <= 12 hours

## 3) End-to-end hardening checks

Run:

- `pnpm test:e2e:smoke`
- `pnpm test:e2e:hardening`

`test:e2e:hardening` verifies:

- governance policy update path
- OIDC readiness endpoint
- deployment validation endpoint
- local-auth gating behavior when OIDC is enabled

## 4) Large-project performance baseline

Run:

- `pnpm test:perf:baseline`
- `pnpm test:perf:university`
- `pnpm test:perf:gate`

Optional row count override:

- `MU_PERF_ROWS=8000 pnpm test:perf:baseline`

Optional single-profile run:

- `MU_PERF_PROFILE=campus_peak_100 pnpm test:perf:university`

To lock updated SLO baselines from a validated perf run:

- `MU_PERF_LOCK_BASELINE=1 MU_PERF_PROFILE=pilot_lab_25 pnpm test:perf:university`

Outputs:

- `.logs/performance-baseline-<timestamp>.json`
- `.logs/university-load-<timestamp>.json`

Thresholds file:

- `tests/performance/baseline-thresholds.json`
- `tests/performance/university-slo-baselines.json`

Tune thresholds per hardware class (pilot laptops vs production server).

## 5) Continuous perf-regression enforcement

Pipeline gate:

- `.github/workflows/perf-regression.yml`

Gate command:

- `pnpm test:perf:gate`

The gate waits for API health, runs the large-project baseline script, then runs university SLO profile checks. Any threshold/SLO violation fails the pipeline.

Optional tolerance envs for noisy CI hosts:

- `MU_PERF_DURATION_TOLERANCE_MS` (default `50`)
- `MU_PERF_LATENCY_TOLERANCE_MS` (default `2`)
- `MU_PERF_THROUGHPUT_TOLERANCE` (default `0.05`)
- `MU_PERF_ERROR_RATE_TOLERANCE` (default `0`)

## 6) Versioned parity tracking

Parity moves over time because SPSS and NVivo ship continuously. Keep parity checks versioned:

- `pnpm parity:status`
- `pnpm parity:snapshot --summary="<what changed>"`

Registry files:

- `docs/product/parity/registry.json`
- `docs/product/parity/registry.md`
