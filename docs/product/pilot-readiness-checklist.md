# Pilot Readiness Checklist

This checklist defines the minimum bar for a controlled department or research-team pilot.

## Purpose

The pilot is ready when a small real-world team can complete a representative mixed-methods workflow without manual database changes, missing exports, or unclear access behavior.

## Scope

The pilot workflow must cover:

1. sign in and project selection
2. source and dataset import
3. codebook setup
4. segment coding
5. memo and annotation capture
6. variable derivation from coded evidence
7. quantitative analysis
8. evidence and dataset export
9. backup and restore
10. audit review

## Preconditions

- API and web app start cleanly
- `pnpm doctor` passes
- local or pilot database is reachable
- storage root is writable
- session and governance policies are configured
- pilot users have assigned roles
- if MU SSO is not ready yet, pilot users are created with the approved fallback auth path

## Required Workflow Validation

### 1. Access and session behavior

- user can sign in successfully
- idle timeout behaves as expected
- failed-login throttling behaves as expected
- permission-denied actions show clear UI feedback

### 2. Import workflow

- text import succeeds
- CSV import succeeds
- mixed-file import can partially succeed without aborting the whole batch
- invalid files return readable error messages
- field mapping feedback is visible to the user

### 3. Qualitative workflow

- user can create codes
- user can create or import segments
- user can apply codes to segments
- user can create memos
- user can create annotations
- retrieval returns coded evidence

### 4. Mixed-methods bridge

- user can create a derived variable from coded evidence
- trace-link regeneration succeeds
- derived variable appears in the dataset summary

### 5. Quantitative workflow

- descriptives run successfully
- at least one inferential procedure runs successfully
- saved analyses can be rerun
- output views render without manual refresh or state resets

### 6. Export workflow

- dataset export succeeds
- evidence export succeeds
- at least one formatted report export succeeds
- exported files are readable in the target application

### 7. Resilience workflow

- project backup succeeds
- restore succeeds to a new project
- audit trail contains the major workflow actions

## Required Commands

Run these before a pilot decision:

```powershell
pnpm doctor
pnpm -r typecheck
pnpm -r test
pnpm -r build
pnpm test:e2e:smoke
```

## Smoke Test Coverage

`scripts/e2e-smoke.mjs` is the baseline pilot workflow check. It currently validates:

- login
- project creation
- text and CSV import
- source and case creation
- code creation
- segment creation
- code application
- memo creation
- annotation creation
- derived variable creation
- trace-link derivation
- descriptives
- retrieval
- reliability analysis
- factor analysis
- regression
- dataset export
- evidence export
- framework report export
- backup
- restore
- audit review
- governance status

## Known Pilot Constraints

These are not pilot blockers if the pilot scope does not require them, but they must be stated clearly:

- MU SSO may still be pending admin-provided Intune or Entra details
- advanced SPSS parity is incomplete
- advanced NVivo parity is incomplete
- some workflows are still broad in the UI and may require brief onboarding
- autocoding is still keyword-based, not semantic

## Go / No-Go Decision

The pilot is a `go` only if:

- all required commands pass
- the smoke workflow passes without manual intervention
- at least one realistic project is completed end to end
- exports open correctly in downstream tools
- restore produces a usable cloned project
- role and permission behavior matches the pilot plan

The pilot is a `no-go` if:

- imports fail on representative data
- exports are unreadable or incomplete
- restore fails or produces corrupted project state
- permission behavior is inconsistent
- the smoke workflow fails
