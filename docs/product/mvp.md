# MVP

## Goal

Deliver a usable university mixed-methods MVP that replaces the most common low-complexity workflows now handled in SPSS and NVivo.

The MVP is not full parity with either product.

## MVP workflow

1. create a project
2. add sources
3. define codes
4. create cases
5. code segments
6. derive variables from coded evidence
7. inspect simple summaries
8. export the resulting dataset

## MVP scope

- project workspace with authentication
- project membership and sharing
- source metadata and text-oriented source workflows
- code management
- segment management
- code applications
- case management
- evidence trace links
- binary derived variables from coding
- basic descriptive summaries
- CSV and JSON export

## Not included yet

- full SPSS statistical coverage
- full NVivo feature coverage
- advanced modeling
- audio/video waveform coding
- automated transcription
- MU single sign-on
- enterprise administration
- full audit trail

## Current implementation status

The current codebase already demonstrates:

- project creation
- authentication
- membership sharing
- source import and storage for text, Word, PDF, CSV, XLS, and XLSX
- sources, codes, variables, cases, segments, code applications, memos, and attributes
- trace-link derivation
- CSV and JSON dataset export
- descriptive summaries, crosstabs, filters, recodes, and first-pass regression
- collaboration workspace modes, presence, and project chat

The biggest remaining MVP gaps are:

- stronger authorization and auditability
- MU account integration
- richer qualitative retrieval and evidence export
- broader derived-variable support beyond binary code presence
- replacement of scaffold-only packages and worker logic
