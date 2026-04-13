# SQL and Office Hooks

muStatistics can now run in three practical modes:

1. standard server mode with PostgreSQL
2. portable single-user mode with an embedded database
3. integration-hook mode for external SQL and installed Microsoft Office

## What can be embedded

### SQL

For portable single-user use, muStatistics already embeds its own local Postgres-compatible database.

That means:

- no PostgreSQL install is required for portable mode
- the app carries its own local database under `data/portable-db`

### Microsoft Office

Microsoft Office should not be bundled into muStatistics.

Reason:

- Office is separately licensed software
- it should be integrated through installed desktop applications and file associations, not redistributed inside this app

## What is implemented now

### SQL hooks

Environment variables:

- `MU_SQL_HOOK_ENABLED=1`
- `MU_SQL_EXTERNAL_URL=...`

These are the foundation for future external SQL connection workflows. The current app exposes the integration state at:

- `GET /integrations/status`

### Office hooks

Environment variables:

- `MU_OFFICE_HOOK_ENABLED=1`
- `MU_OFFICE_WORD_PATH=...`
- `MU_OFFICE_EXCEL_PATH=...`

The app already exports Office-native formats where applicable:

- Word `.docx`
- Excel `.xlsx`

The current hook layer reports whether Word and Excel launch targets are available at:

- `GET /integrations/status`

Portable and web mode now also:

- search for Word and Excel on app load / sign-in using configured paths and common Windows Office install paths
- expose recent Office export artifacts per project at `GET /integrations/office/recent`
- open the most recent Word or Excel export from the browser UI through `POST /integrations/office/open`

## Current scope

The hook layer currently supports:

- availability/configuration detection
- sign-in/runtime status reporting
- reopening recent `.docx` and `.xlsx` exports in installed Word/Excel on Windows

It does not yet:

- sync live edits back from Office documents
- browse external SQL schemas from the UI
- import directly from arbitrary SQL databases

## Recommended next steps for these integrations

### Office

1. add file-watch or reimport workflow for round-tripping edited outputs
2. optionally support nonstandard Office discovery beyond configured/default paths
3. add richer “open exported file” actions in more report surfaces

### SQL

1. add connection-profile management
2. add table/schema discovery
3. add import-from-SQL workflows into cases, attributes, and datasets
4. add guarded export-to-SQL workflows if you need write-back
