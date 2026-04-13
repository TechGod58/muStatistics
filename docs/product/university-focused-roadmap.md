# University-Focused Roadmap

## Product direction

muStatistics should not aim for full IBM SPSS + NVivo parity.

The practical goal is narrower:

- replace the most common university mixed-methods workflows
- reduce annual software spend
- keep evidence traceability strong enough for research, accreditation, and grant reporting

## Target user

Primary user:

- faculty researchers
- institutional research staff
- graduate assistants
- assessment teams

Common work:

- code interview, focus-group, and open-ended survey text
- organize cases and participant attributes
- derive simple quantitative variables from qualitative coding
- compute descriptive statistics
- export clean datasets and evidence summaries

## What we are building

muStatistics should become a focused mixed-methods research platform with five core capabilities:

1. qualitative coding
2. case management
3. traceable variable derivation
4. basic descriptive statistics
5. export for downstream analysis and reporting

## What is explicitly out of scope for now

These are not version-1 goals:

- full SPSS statistical parity
- full NVivo media/query parity
- advanced modeling
- structural equation modeling
- syntax language parity with SPSS
- audio/video waveform coding
- automated transcription pipeline
- complex survey weighting
- multi-tenant enterprise administration
- real-time collaborative editing

See `docs/product/collaboration-platform.md` for the newer collaboration and team requirements that expand beyond the original narrow MVP.

## Version 1 scope

### 1. Project workspace

- create projects
- invite collaborators
- manage project membership by role
- keep a clear audit trail of who changed what

### 2. Source management

- import text documents
- import CSV datasets
- store source metadata
- support transcript and open-ended survey response workflows first

### 3. Qualitative analysis

- create and organize codes
- apply codes to text segments
- attach memos to projects, sources, segments, codes, and cases
- search and retrieve coded excerpts
- filter by code, case, source, and coder

### 4. Case and attribute management

- create cases
- link sources to cases
- manage attributes like department, cohort, role, or demographic fields
- browse a case-by-attribute table

### 5. Mixed-methods bridge

- derive binary variables from code presence
- derive count variables from number of code applications
- derive categorical variables from code groups
- preserve trace links back to the exact coded evidence

### 6. Basic descriptive statistics

- frequency tables
- percentages
- means
- medians
- minimum and maximum
- simple crosstabs

### 7. Export

- export project dataset to CSV
- export evidence-linked JSON
- export codebook
- export case summaries

## Success criteria

The product is successful when a university team can complete this workflow without SPSS or NVivo:

1. import interview transcripts or open-ended responses
2. create a codebook
3. code excerpts
4. organize participants as cases
5. derive variables from coded evidence
6. inspect descriptive summaries
7. export a final dataset and traceable evidence bundle

## Recommended delivery phases

## Phase 1: Stable foundation

- align docs and runtime
- fix environment tooling
- add migrations
- harden auth and sessions
- add role-based permissions
- add audit events

Exit criteria:

- one-command local startup works
- docs match reality
- project membership is safe enough for internal pilot use

## Phase 2: Research workflow MVP

- text source import
- source content storage
- code CRUD
- segment CRUD
- code application workflow
- case CRUD
- attribute CRUD
- memo support

Exit criteria:

- a user can complete a real small qualitative project end to end

## Phase 3: Mixed-methods dataset builder

- derived variables beyond binary
- trace-link regeneration jobs
- dataset view
- case-by-variable matrix
- export dataset to CSV and JSON

Exit criteria:

- a team can produce a defensible mixed-methods dataset from coded evidence

## Phase 4: Basic quantitative analysis

- descriptive summaries
- grouped summaries
- crosstabs
- downloadable summary tables

Exit criteria:

- most routine descriptive reporting no longer requires SPSS

## Phase 5: Pilot readiness

- activity log
- backup and restore plan
- performance tuning
- smoke tests for key flows
- pilot documentation and onboarding

Exit criteria:

- one department can pilot the tool for real work

## Collaboration expansion

The product now also needs a collaboration layer that was not part of the original narrow MVP:

- support up to 100 concurrent connections
- support `solo` and `collaborative` workspace modes
- allow student-created teams
- invite collaborators by email
- provide in-app project chat
- define professor/instructor oversight rules

Those requirements should be delivered as a platform track alongside the research workflow track, not mixed into ad hoc feature work.

## Immediate engineering priorities

1. Finish access-control hardening for all collection endpoints and audit sensitive actions.
2. Replace local-only account handling with MU identity integration.
3. Replace placeholder packages with real implementations or remove them from the active architecture story.
4. Expand qualitative retrieval, search, and evidence-linked export.
5. Expand variable derivation beyond binary code presence.
6. Replace the worker scaffold with real background processing for derivation and export jobs.
7. Lock down the professor cross-project access policy before any broader rollout.

## Product positioning

The near-term message should be:

"muStatistics is a web-native mixed-methods research platform for coding, case management, evidence-linked variable derivation, descriptive statistics, and export."

That message is much more credible than claiming full SPSS and NVivo replacement today.
