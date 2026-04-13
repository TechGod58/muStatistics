# SPSS and NVivo Parity Audit

Date: April 9, 2026

## Purpose

This document maps the current `muStatistics` codebase to the major functional areas commonly associated with IBM SPSS Statistics and NVivo.

It is not a claim of full parity. It is a gap audit.

## Reference points reviewed

- IBM SPSS Statistics product and documentation areas:
  - https://www.ibm.com/products/spss-statistics
  - https://www.ibm.com/support/pages/ibm-spss-statistics-26-documentation
- NVivo product and help areas:
  - https://lumivero.com/products/nvivo/
  - https://help-nv.qsrinternational.com/

## Current completion estimate

- Narrowed university mixed-methods MVP: roughly `70%`
- Literal SPSS + NVivo parity: roughly `15%`

## SPSS feature map

### Represented in the repo

- Data import and export
  - CSV, JSON, XLSX export
  - file ingest for CSV, XLS, XLSX
- Dataset structure
  - variables
  - cases
  - attributes
  - saved transforms
- Core descriptive analysis
  - descriptives
  - frequencies
  - crosstabs
  - compare means / ANOVA-style summary
  - correlation
  - independent t-tests
  - paired t-tests
  - first-pass nonparametric comparisons
  - linear regression
  - logistic regression
- Analysis controls
  - weights
  - missing-data handling
  - saved analysis jobs
- Output handling
  - output viewer
  - compiled report flow
  - export packaging

### Partial only

- Data transformation
  - filters and recodes exist
  - broad SPSS-style compute, aggregate, rank, merge, split-file, and reshape workflows do not
- Inferential output
  - p-values, intervals, assumption checks, and some diagnostics exist
  - deeper diagnostics and post-estimation workflows are still limited
- Output management
  - printable output exists
  - full SPSS-style output tree, pivot editing, and chart builder do not

### Missing or materially incomplete

- Syntax language and automation parity
- Custom tables parity
- Advanced regression families beyond the current first pass
- General linear models beyond compare-means
- Repeated-measures procedures
- Mixed models
- Factor analysis
- Reliability analysis
- Cluster analysis
- Decision trees
- Neural networks
- Survival analysis
- Time series
- Bootstrapping breadth
- Missing-value imputation workflows
- Complex samples / survey design analysis
- Full charting and visualization layer

## NVivo feature map

### Represented in the repo

- Project and source management
  - projects
  - source storage
  - text, Word, PDF, CSV, XLS, XLSX ingest
- Coding workflow
  - codes
  - segments
  - code applications
  - in-context coding workspace
  - media segment capture
- Analytic notes
  - memos
- Case handling
  - cases
  - source-to-case linkage
  - attributes / classifications
- Retrieval and querying
  - evidence retrieval by source, code, case, coder, and text
  - code co-occurrence
  - code-by-case views
  - matrix coding by code x case
  - matrix coding by code x code
  - saved qualitative queries
  - qualitative query reports
- Evidence export
  - evidence export
  - codebook export
  - case summaries
  - appendix-style reporting

### Partial only

- Media support
  - media URLs and time-range segments exist
  - full transcript sync, waveform tooling, and transcription workflows do not
- Coding structure
  - parent code support exists
  - deeper codebook management and hierarchy tooling are still basic
- Reporting
  - Word, PDF, Excel packaging exists
  - committee-style qualitative reporting is still first-pass

### Missing or materially incomplete

- Framework matrices
- Word frequency queries
- Text search query tooling beyond current retrieval filters
- Compound query builder parity
- Annotations as a distinct object type
- See-also links / relationship modeling
- Sentiment analysis
- Auto-coding workflows
- Built-in transcription pipeline
- Rich visualizations:
  - charts
  - cluster analysis visuals
  - maps
  - word clouds
  - concept maps
- Source comparison and coding comparison metrics
- Inter-rater reliability workflows
- Team merge workflows closer to NVivo collaboration patterns
- Bibliographic / reference-manager integrations

## Repo-backed evidence for current implementation

### API surface

Current routes in `apps/api/src/index.ts` already cover:

- project and membership management
- presence and project messages
- sources, codes, variables, cases, memos, attributes, segments, code applications
- retrieval, matrix coding, code-by-case, code co-occurrence, code x code matrix, query report
- imports and export packages
- descriptives, crosstabs, dataset analysis, compare means, regression, correlation, t-tests, paired t-tests, nonparametric tests
- saved transforms, saved analysis jobs, saved qualitative queries

### Engine surface

Current analysis engines already cover:

- `packages/quant-engine/src/index.ts`
  - dataset building
  - descriptives
  - filters and recodes
  - crosstabs
  - compare means
  - correlation
  - t-tests
  - paired t-tests
  - nonparametric comparisons
  - linear and logistic regression
- `packages/qual-engine/src/index.ts`
  - retrieval
  - matrix coding
  - code-by-case view
  - code co-occurrence
  - code x code matrix
  - qualitative query reports
  - evidence export payloads

## Practical conclusion

`muStatistics` already represents a meaningful subset of the workflows that overlap SPSS and NVivo:

- mixed-methods project management
- qualitative coding and retrieval
- case-centered dataset building
- core descriptive and first-pass inferential statistics
- evidence-linked reporting and export

What it does not represent yet is full parity with either product.

## Highest-value functional gaps to close next

1. SPSS side:
   - output tree and richer result management
   - broader modeling and data management procedures
   - charting and diagnostics
2. NVivo side:
   - framework matrices
   - richer text-search and compound query tooling
   - inter-rater and coding comparison workflows
   - stronger media/transcript handling
3. Platform side:
   - MU SSO completion after admin handoff
   - background jobs for heavy export and derivation tasks
   - production hardening
