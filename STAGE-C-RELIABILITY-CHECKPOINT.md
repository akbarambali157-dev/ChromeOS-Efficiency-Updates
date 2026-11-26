# Project Atlas — Stage C Reliability & Regression Checkpoint

**Build:** 5.7.1
**Branch:** project-atlas-stage-c-reliability
**Scope:** targeted reliability defect fix; no unrelated feature work.

## Confirmed defect fixed

The project-folder search declared a 12 MiB scan budget (MAX_SEARCH_BYTES) but never incremented its bytesRead counter. As a result, the intended byte limit was effectively inactive: searches could scan the entire supported-file list (up to the existing file-count limits) and the response did not expose byte-budget or skipped-file details.

## Change

- Enforce the 12 MiB scan budget using each read file's reported size, with encoded content length as fallback when size is absent/zero.
- Stop scanning when the next file would exceed the budget rather than process it.
- Mark result sets as partial (truncated=true) when the result cap is reached, the byte cap is reached, or a supported file is skipped because it is oversized, binary, or unsupported.
- Report bytesRead and skippedFiles alongside query/matches/truncated so downstream tools can communicate the scope of a search.
- Preserve sequential file reads, existing path validation, the 1 MiB per-file limit, explicit project-folder access, and no-network/no-delete behavior.
- Add deterministic regression tests for byte-budget enforcement, result-count limiting, skipped files, partial-result status, and invalid query rejection.
- Add the regression test to CI.

## Validation

The regression test runs the actual search function in a Node VM with a deterministic mock folder boundary. It verifies that 13 files × 900,000 bytes (11,700,000 bytes) are scanned, a 14th file that would exceed the 12 MiB budget is not processed, and partial-result status is set. It also verifies the result-count cap stops further reads and that unreadable/oversized files are reflected as partial results.

## Limitations

This is source-level and automated regression coverage. The browser File System Access API, real IndexedDB persistence, permission revocation/reconnect, and Chromebook interaction remain manual QA. CI results must be reviewed before merging.
