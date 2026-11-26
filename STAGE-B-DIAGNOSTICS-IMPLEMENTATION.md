# Project Atlas Stage B — Diagnostics Implementation Checkpoint

**Status:** First implementation slice complete; Stage B continues.  
**Branch:** `project-atlas-stage-b-diagnostics`  
**Pull request:** [#23 — Project Atlas Stage B](https://github.com/akbarambali157-dev/ChromeOS-Efficiency-Updates/pull/23) (draft; not merged)  
**CI:** [Run #206 — successful](https://github.com/akbarambali157-dev/ChromeOS-Efficiency-Updates/actions/runs/45838495505)

## Delivered in this checkpoint

### Diagnostics page
- New extension page: `diagnostics.html`, with responsive styles and shared sidebar navigation.
- Read-only run button and check cards; summary counts for passed, warnings, failed, skipped/unsupported and not-run.
- Copy report and save report controls.
- Report content is bounded, uses text output and redacts common key/token/password patterns and URL query strings.
- Captured page JavaScript errors and unhandled promise rejections are capped at 20 entries.

### Checks currently implemented
1. Diagnostics-page duplicate DOM ID check.
2. Sidebar navigation shell.
3. Stylesheet availability.
4. Script resource-timing presence.
5. Local sidebar destination fetches.
6. Extension runtime/manifest availability.
7. Chrome local-storage API presence.
8. Storage usage via `getBytesInUse` only—stored values are not read or modified.
9. Background service-worker safe ping.
10. Device-wide memory API availability and reported capacity/free memory (explicitly not extension-specific).
11. Mini-app registry structure, record validity, duplicate IDs and count.
12. Launcher script/stylesheet references in `newtab.html` fetched and checked.
13. Broad host-permission warning.
14. Explicit skipped live provider/credential tests.
15. Explicit skipped click-through coverage.
16. Explicit not-run Chromebook performance baseline.

### Background-worker change
Added a minimal `atlasDiagnosticsPing` message handler that returns a simple health response. It does not perform work, inspect tabs, read credentials, or modify storage.

### Shared navigation
Diagnostics is available from the existing shared sidebar on extension pages. The existing app navigation pattern is retained.

### Automated tests
Added `scripts/test-diagnostics-core.mjs` for pure diagnostics-core tests:
- valid/invalid status normalization
- duplicate DOM ID detection
- local link validation
- summary aggregation
- common credential/query redaction
- report generation and privacy wording

CI now runs this test alongside the existing tests. Run #206 passed:
- JS syntax validation
- diagnostics-core test
- existing response normalization and continuation tests
- provider effort tests
- project tool adapter tests
- Parallel Search tests
- project folder safety tests
- Creative Library tests
- Recreation Lab tests
- mini-app contract validator

## Important limitations

This checkpoint is not a complete extension QA system:
- Browser interaction tests are not automated yet.
- No click/tap, dialog, keyboard, focus, touch, responsive or screenshot checks are performed by this page.
- The diagnostics page currently validates launcher assets, not every page/app resource.
- The registry check does not exercise all 40 mini-apps.
- Storage check only reports approximate usage; it does not verify backup/restore, migrations, quota failure or corruption.
- The background ping only confirms that the worker can answer a simple message, not that every worker feature works.
- Provider/API credentials are not read or tested.
- Memory numbers are device-wide; they cannot be attributed to this extension.
- No target Chromebook performance measurements are collected.
- Report redaction is defense-in-depth and is not a formal guarantee that every arbitrary string is secret-free. Review before sharing any diagnostic report.

## Next Stage B work

1. Add selector/DOM contract scans for all extension pages and key controls.
2. Expand page/resource integrity checks with a maintained page inventory and ownership mapping.
3. Create browser smoke tests for critical workflows where tooling supports Chrome 103 compatibility.
4. Add safe background activity lifecycle instrumentation (task ownership, timers/alarms, visibility, cancellation and errors) without logging payloads.
5. Add tests for storage/backup/restore and project-file lifecycle edge cases.
6. Prepare a manual Chromebook checklist and diagnostic report review.
7. Verify the diagnostics page itself on Chromebook and correct any UI/API issues found.

No merge to `main` or release was performed. The draft PR is the review/test checkpoint.
