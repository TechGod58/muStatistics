# Domain model

## Core objects

- Project
- Source
- Segment
- Code
- CodeApplication
- Case
- Attribute
- Variable
- TraceLink
- AnalysisRun
- Export

## Design rule

There is one project graph.
Qualitative and quantitative workflows are not separate products.
They are two analysis modes over the same evidence graph.

## Mixed-methods bridge

The bridge converts coded evidence into derived variables while preserving traceability:

- code application -> case
- code application -> segment
- segment -> source
- variable -> trace link -> code applications

That is the base requirement for defensible mixed-methods analysis.
