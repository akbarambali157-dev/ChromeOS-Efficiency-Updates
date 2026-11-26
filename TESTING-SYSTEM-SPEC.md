# Project-wide Diagnostics & Testing System

**Purpose:** Create a dedicated QA/testing build and a durable, integrated diagnostics center that can inspect the extension's health, identify missing wiring and broken interactions, and make resource usage and background activity visible. This specification is design-first; it does not claim these checks exist yet.

## UX proposal

Diagnostics is a first-class entry in Settings/System or a clearly discoverable Tools area, not hidden in the Claude app. It should be useful on a small screen and on the 1366×768 Chromebook.

### Dashboard overview
- Overall status: **Healthy / Attention / Failed / Not checked** with plain reasons.
- Four top summary groups: **Structure**, **Functionality**, **Performance**, **Activity & privacy**.
- Last scan time, test mode, version, browser baseline, and test duration.
- Buttons: **Quick Scan**, **Full Audit**, **Performance Snapshot**, **Activity View**, **Export Report**.
- Each check has a status, short explanation, severity, evidence, timestamp, and (if possible) a safe fix or navigation target.
- Filter by all, failures, warnings, unavailable checks; search check names.
- Re-run one check or group; don't rerun expensive/intrusive checks without telling the user.
- Never display green "passed" for a check that was skipped or could not run. Use distinct Not run / Unsupported / Needs manual verification statuses.

## Check catalog

### 1. Structural & wiring
- Manifest validity, required entry files and referenced resources.
- Registered page/app/module inventory; missing, duplicate or orphan registrations.
- Navigation targets resolve to known pages.
- Required DOM elements/selectors exist in relevant views; null-target risks are surfaced with guard contracts.
- App catalog entries have required metadata, launch path, lifecycle contract, storage namespace and files.
- Static script import/load order and obvious missing dependencies; report limitations of static analysis.
- Expected event/message handlers exist and do not have obvious duplicate registration.
- No orphaned code references in the registry and no broken lazy-load path.
- All 40 mini-app registrations, loading entrypoints, theme bridge and restricted workspace contract.

### 2. Interaction smoke checks
- Testable selectors/buttons are mapped to semantic action names (not fragile display-text matching).
- Navigation routes, close/back, settings tabs, selector opening/choosing, touch target sizes, keyboard focus and modal dismissal.
- Click/tap handler presence and expected state transitions, without activating destructive or external actions.
- Validate disabled states and forms (missing required fields, malformed input, error feedback).
- Tests are non-destructive by default; actions that write data use a temporary test namespace or explicit confirmation.
- Provide a manual checklist for flows that cannot be safely automated in extension context or on the target device.

### 3. Storage & recovery
- Storage API availability and errors; key/DB inventory and namespace collisions.
- IndexedDB database/store existence, schema version, transaction failures, orphan metadata references, and size estimates where browser support allows.
- Boundedness of histories, caches, logs, Blob assets and app data; estimate limits vs actual usage.
- Backup/import validation, malformed payload rejection, compatibility, and partial failure reporting.
- Test backup/restore using a disposable fixture; never overwrite real user data during diagnostics.
- Detect quota warnings and interrupted migration states where observable.

### 4. Performance & resource checks
Capture only metrics the browser exposes; clearly label estimates:
- Extension/new-tab launch and readiness timings.
- Navigation/action latency and UI responsiveness samples.
- Idle/background wakeups and active polling/timer/alarm counts, including ownership and enabled state.
- Request counts, bytes where available, latency, retry/backoff/error class for extension-owned AI/research requests (metadata only).
- Memory estimates where APIs expose them; otherwise manual Chrome Task Manager readings.
- CPU impact via measured profiler/manual Task Manager—not fabricated extension telemetry.
- DOM node counts for active extension pages, large list sizes, animation activity and hidden-page behavior.
- Storage bytes/counts, caches, retained object URLs, selected media preview status.
- Long-session test: open/close apps, switch projects, run workflows, check listeners/timers/object URLs for growth.
- Check reduced-motion preference, animation disable, hidden-page pause/suspend behavior.
- Performance budget warning thresholds are provisional until a real Chromebook baseline is collected.

### 5. Activity transparency ("nothing invisible")
- Inventory owned work: AI requests, research fetches, imports/exports, scans, media processing, timers, polling, alarms, background suspend/resume and storage writes.
- Activity view lists current and recent extension operations with: name, module, start time/duration, category, state (running/waiting/retrying/completed/failed/cancelled), reason/trigger, and cancel/pause control if supported.
- Background Activity panel includes each timer/alarm/poll with purpose, interval or next-run time, enabled status, and owning module.
- Show when no activity is running. Don't silently hide retries or recurring tasks.
- User can stop cancellable operations and disable optional scheduled/background functions.
- For invisible/unsupported operations, report the best available evidence and limits; do not imply the monitor sees all browser internals.
- Activity records are bounded and stored locally; default metadata only.

### 6. Error and issue reporting
- Central error registry with categories (initialization, UI binding, storage, provider, network, schema, timeout, cancellation, export, media, permission).
- Deduplicate repeated errors while retaining occurrence count and latest time.
- Capture sanitized stack/location where safe, module and version, recent operation IDs, and reproduction steps if user enters them.
- Offer copy/export diagnostics, issue summary and check IDs.
- Never include API keys, authorization headers, prompt text, full file content, private browsing page content or user data in diagnostics. Scrub URLs to origin or omit query/hash where sensitive. Require preview before exporting.

### 7. Security & privacy checks
- Permission inventory with plain-language purpose and current status.
- External endpoint inventory, identifying third-party destinations and features that call them.
- Credential storage checks: never included in backups/logs/export; no plaintext display; provider isolation.
- Review extension message sender/target validation and allowed origins.
- Untrusted page/source content stays data, not system instruction; inspect risky dynamic execution and external content handling.
- Verify approvals and user confirmation for file edits, pushes, uploads, external navigation, AI analyses, and other consequential actions.
- Diagnostics should be opt-in for detailed scans and never collect sensitive contents by default.

## Scan modes
- **Quick Scan:** low-cost structural checks, registry/route/selectors, permissions, storage availability, current owned activity.
- **Full Audit:** expanded integrity checks, safe fixture tests, app contracts, data migration/recovery checks, interaction map; describe potentially heavier checks before running.
- **Performance Snapshot:** timing, DOM/list/media, activity inventory, storage estimates, supported resource metrics.
- **Long-session soak (test build only):** scripted or manual sequence over time; user starts/stops it; records bounded counts and trend only. No uncontrolled background stress.
- **Manual Device QA:** checklist with pass/fail/blocked/not-tested, notes, and test date/device/browser.
- **Test data mode:** clearly marked disposable namespace, automatic cleanup and cleanup verification.

## Testing architecture (proposed)
- Central registry of check definitions with stable IDs, category, severity, description, prerequisites, safe/invasive flag, and check function.
- Separate adapters for checks: static source/catalog, DOM view contract, storage, activity scheduler, network metadata, performance, and manual checklist.
- Shared results schema: check ID, timestamp, status, duration, evidence summary, limitations, remediation hint, and report version.
- Tests must be read-only or use isolated fixtures. If a check requires writes, it declares them, shows scope, and cleans up.
- Instrumentation wrappers are lightweight, feature-flagged, and must not add significant overhead to ordinary usage.
- A diagnostic observer must not become a new persistent polling loop. Prefer event-based registration, counters and snapshots; only active scans run on demand.
- If instrumentation is unavailable, return **Unsupported/Not available**, not zero or false success.

## Expected visual behavior
- Clean, compact dashboard with readable status text (not color-only), expandable detail cards, progress indicator, cancellation, last-run timestamp, and an accessible report summary.
- Performance section: small trend/summary visuals only when enough samples exist; otherwise show “Baseline not yet recorded.”
- Activity section: live operation list plus a clear “No active work” empty state. Group background timers/polls separately from user-triggered operations.
- Results: each finding includes severity, why it matters, exact evidence, what was checked, and suggested next action. Provide copyable/exportable report; preview and redact first.
- Touch-first controls: comfortable tap targets, no tiny selector affordances, responsive layout, no horizontal overflow at 1366×768 or phone-sized view.

## Acceptance criteria
- Every check is catalogued and has a stable ID.
- Results distinguish pass, warning, fail, skipped, unsupported, and not-run.
- Quick scan completes without network calls and without changing user data.
- Full audit documents all writes and uses disposable fixtures.
- User can see running work, recurring activity and retries; stop where supported.
- Report is bounded, local, previewable and redacted.
- Tests verify diagnostics themselves: false-positive cases, unavailable API cases, cancellation, cleanup, storage limits, and no secret/content leakage.
- Overhead measured against a diagnostics-disabled baseline before enabling always-on instrumentation.
- Manual QA and actual device evidence are captured separately from automated results.

## Rollout plan
1. Source audit and activity inventory first.
2. Design UI mock/flow and check registry contract.
3. Implement instrumentation with a disabled/opt-in mode.
4. Build dedicated QA release; run automated checks in CI.
5. User checks dashboard and performs device QA.
6. Fix diagnostic bugs and false positives in a patch.
7. Keep diagnostics available in production, but lightweight and user-controlled; retain heavy checks in QA mode.
