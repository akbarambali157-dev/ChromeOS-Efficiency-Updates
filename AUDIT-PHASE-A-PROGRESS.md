# Project Atlas — Initial Audit Progress (Phase A)

**Date:** 2026-11-26  
**Repository baseline inspected:** `main`, manifest version 5.7.0  
**Audit status:** In progress — this is an evidence-based first pass, not a complete source or runtime audit.  
**Target environment:** Acer Chromebook 15 CB3-532; ChromeOS 103; 2 GB RAM; 1366×768 (as recorded in the project README).

## Scope inspected in this pass
- Repository recursive file tree and inventory.
- Manifest V3 configuration.
- README release description and stated capabilities.
- Architecture documentation and runtime/module responsibilities.
- Main new-tab page HTML structure and CSS selector inventory.
- Launcher controller, settings, theme/wallpaper controller, deferred script loader.
- Background service-worker source, selected portions of launcher modules.
- Mini-app registry and static validation script.
- AI Workspace 4.0 spec and QA checklist.
- Performance baseline guide.
- Several focused response/provider/parallel-search regression tests.

## Verified initial observations (source-level only)

### Positive foundations already present
- Plain HTML/CSS/JS with no build step or third-party runtime dependency.
- MV3 architecture with separate extension pages and service worker.
- Shared theme/catalogue ownership and documented page/module boundaries.
- 40-app local/remote registry/install/runtime consistency checks.
- Mini-app iframe isolation and restrictive CSP checks in validator.
- Local project/file handling and reviewed proposals have specific safety assertions.
- Response normalization, truncation/continuation handling and focused tests exist.
- Lazy-loading for selected noncritical home scripts; hidden-page behavior is explicitly considered in the architecture.
- Existing performance-baseline documentation correctly distinguishes Task Manager memory/CPU from JS heap estimates and admits device testing is pending.

### Initial concerns to investigate (not yet classified as confirmed defects)
1. **Permission scope:** manifest declares `<all_urls>` host permissions. Audit each feature's true host needs and determine whether narrower permissions or user-triggered access can reduce exposure without breaking functionality.
2. **Complex new-tab page:** newtab.html combines launcher, shortcuts/workspaces, tab tools, sessions, notes/tasks, settings, customization, wallpaper collections, memory controls and backup/restore. Assess whether information hierarchy and surface complexity are contributing to the reported poor UI.
3. **Large global stylesheet:** newtab.css contains extensive styling for many surfaces, theme palettes, wallpapers, motion, navigation, memory, assistant and task/workspace controls. Assess cascade coupling, duplicated rules, visual consistency and whether shared tokens/components can be introduced safely.
4. **Instrumentation gap:** the existing static validator is broad for contracts but source-based. It checks registration consistency and several expected code features; it cannot prove actual click/touch behavior, API connectivity, screen rendering, performance, or Chromebook compatibility.
5. **Performance evidence:** performance guide contains useful methodology, but several rows remain blank. No current measured CPU, long-session growth, startup latency, or full device result can be claimed from this pass.
6. **Manual interaction testing:** selectors, dialogs, focus/touch, navigation, state transitions, error feedback and overflow need real browser/device verification; source inspection alone is insufficient.
7. **Background activity inventory:** service worker, alarms, polling, timers, visibility guards, requests, listeners and cleanup need a systematic ownership map. Initial code inspection confirms activity exists; completeness/cleanup has not been established.
8. **UI audit coverage:** visual quality cannot be fully assessed without screenshots/browser inspection. This audit will record unseen surfaces as uninspected rather than inventing a visual assessment.

## Validation inventory seen in repository
- `scripts/validate-miniapps.mjs`
- `scripts/test-ai-response.mjs`
- `scripts/test-model-effort.mjs`
- `scripts/test-parallel-search.mjs`
- `scripts/test-creative-library.mjs`
- `scripts/test-project-folders.mjs`
- `scripts/test-project-tools.mjs`
- `scripts/test-recreation-lab.mjs`

These test files were located and some source contents inspected. **Tests have not been executed in this remote source-only pass**, because a local checkout/runtime was not available in this connector session. CI history and current check results must be inspected separately.

## Work still required before Audit Phase A closes
- Complete the code inventory and inspect every source module in manageable batches.
- Map all page script load order, DOM IDs, routes and event/listener ownership.
- Inventory storage keys, IndexedDB databases, limits, migrations and backup paths.
- Inventory timers, alarms, polling, fetch destinations, retries and cancellation behavior.
- Inspect every mini-app handler and the 40 apps' runtime behaviors, not only their registry metadata.
- Trace end-to-end flows for AI requests, teams, research, projects, file edits, GitHub, Supabase, creative assets, video export, session/tab management and backup/restore.
- Inspect recent commit history and known historical bug reports; retest them rather than assume they persist.
- Execute test scripts/CI and add missing tests; actual local execution requires a checkout/runtime.
- Perform screenshot/browser inspection and Chromebook testing when available.
- Maintain prioritized defects, integration-gap and visual backlog with evidence.

## Status rules
- **Confirmed defect:** reproduced or supported by clear source/test evidence.
- **Suspected:** risk or inconsistency found; needs reproduction.
- **Historical:** user previously reported it; current status not assumed.
- **Untested:** no verification yet.
- **Not applicable/unsupported:** explicitly justified.

## Immediate next audit batch
Review the launcher's page boundaries and controller ownership: newtab/home, settings, customization/theme, memory, sessions, navigation, popup, app launcher and background service worker. Then proceed through AI Workspace modules, projects/files, AI Teams, research, creative tools, Video Studio, and mini-app runtime/registry in separate evidence-based batches.

**No application source code has been changed in this audit pass.** This report records findings and directs the next inspection; it is not a release or device validation.

## Audit batch 2 — Launcher, runtime and CI findings (2026-11-26)

### Additional source inspected
- CI workflow `.github/workflows/mini-app-validation.yml`
- New-tab HTML (full main structure), launcher and navigation controllers
- Settings/backup controller, customization controller, theme/wallpaper controller
- Background service-worker sections for dark mode, request relays, tab tracking and auto-suspend
- Mini-app iframe shell and host workspace message bridge
- App marketplace controller and local registry
- Shared assistant core, assistant UI controller, command bar, popup, home-tools
- AI workspace main controller, workspaces/Teams/research/GitHub/Supabase orchestration, Video Studio, project folders
- Existing validator's full tail and regression test inventory

### Evidence-based notes
- The CI workflow runs JavaScript syntax checks, focused Node tests for response handling, model effort, project tools/folders, Parallel Search, Creative Library and Recreation Lab, plus the mini-app contract validator. This is a valuable foundation, but it is still primarily source-contract/unit testing—not real browser end-to-end testing.
- The mini-app validator cross-checks 40 app IDs across local registry, remote catalogue, install map and runtime registry; checks app metadata/network disclosures, MV3/Chrome 103 baseline, sandbox CSP, some unsafe API patterns, copy-only Files behavior, workspace control presence and numerous AI workspace contracts.
- The extension's home page uses a classic-script load sequence. The documented script order and global shared APIs are architecture-sensitive and need automated load-order/dependency checks before any reorganizing.
- Home-page memory monitoring is visibility-aware and polls at 15-second intervals only while the page is visible (initial delayed sync); clock updates at 60-second cadence and refreshes on visibility return. These are documented/visible patterns, not evidence of every timer in every module being lifecycle-safe.
- `defer.js` postpones weather and command-bar scripts until idle (with a fallback), showing the existing Chromebook-first lazy-loading direction.
- Mini-apps run inside a sandboxed iframe with a restrictive CSP and a message bridge; the host validates source window, channel, nonce and app ID. This is an important boundary to preserve and test more thoroughly.
- The UI source shows the home page as a single long page with many sections, including shortcut/workspace management, tools, sessions, recently closed tabs, notes, tasks, theme/wallpaper collections, custom colours, layout controls, accessibility, website dark-mode settings, memory and backup/import controls. This is a **confirmed structural complexity** and a strong redesign target; it is not yet a visual quality verdict.
- The extension's responsive CSS includes a compact sidebar behavior, touch-specific control sizing, motion disable/reduced-motion paths and multiple themes. Presence in source does not establish that each screen is usable at every viewport.
- The extension has a centralized app registry, install records and a constrained local mini-app data broker; the broker's lifecycle, edge cases, quota handling and per-app behavior still require deeper review.

### Risks and potential audit targets
| ID | Concern | Evidence | Classification | Next action |
|---|---|---|---|
| A-01 | Broad website access | Manifest `host_permissions: <all_urls>` and website dark-mode injection | Reviewable permission risk, not automatically a defect | Trace each feature; assess optional host permissions/user activation alternatives |
| A-02 | Main home/settings information overload | Large combined home page and many settings sections | Confirmed structural complexity | Inventory settings groups and propose progressive disclosure/navigation |
| A-03 | Static CI cannot confirm runtime UI | CI uses `node --check` and Node tests/validator; no browser automation in inspected workflow | Confirmed testing coverage limitation | Design project-wide diagnostics and browser smoke test strategy |
| A-04 | App contract testing gaps | Validator checks registrations and many contracts but not full app interactions | Coverage limitation | Map each app to interaction/state tests; identify missing coverage |
| A-05 | Runtime script-order coupling | Plain classic scripts with global shared dependencies | Architecture risk | Generate dependency/load-order map and verify contracts |
| A-06 | Activity visibility incomplete until inventoried | Service worker, timer/alarm and module async activity exist | Audit pending | Inventory owner, lifecycle, interval, wake trigger, cancellation and cleanup |
| A-07 | UI responsive quality unverified | CSS has breakpoints/touch styles; actual screenshots not available | Untested | Browser/device test matrix and visual inventory |
| A-08 | Metrics are estimates in catalogue | Apps show RAM/CPU estimate fields and labels, README caveats | Needs accuracy review | Check how estimates are derived; make uncertainty/disclaimer consistent |
| A-09 | Diagnostics completeness | Existing diagnostics module is workspace-specific | Confirmed scope limitation from architecture/file inventory | Compare it with new project-wide diagnostics spec; don't duplicate |

### CI coverage that is already useful
- Syntax validation for JavaScript under `new-tab-launcher/`.
- Response extraction, truncation, partial response, continuation and malformed-response tests.
- Model-specific effort selection/forwarding.
- Parallel search normalizer: empty, malformed, wrong shape, HTTP and valid results.
- Project folder boundaries, stale proposal/path safety.
- Creative Library and Recreation Lab validation/privacy checks.
- Mini-app catalogue and runtime-contract validation.

### CI coverage that is still missing or not evidenced in inspected workflow
- Browser-driven interaction tests for primary page flows.
- Screenshot/visual regression tests.
- Keyboard and touch behavior automation.
- Whole-project DOM selector integrity across all pages.
- Full test coverage for all mini-app functionality (contract checks are not equivalent).
- Background service-worker timer/alarm lifecycle and duplicate listener tests.
- Storage quota, migration, corruption and backup/restore end-to-end tests.
- Real provider/API integration tests (must use safe mocks/fixtures in CI; credential tests manual).
- Long-session/resource leak tests and device CPU/memory measurements.

**Audit continues. No application code changed, no runtime tests executed, and no release is being claimed.**

## Audit batch 3 — AI workspace, Teams and mini-app boundary review

### Further verified foundations
- AI workspace has distinct project dashboard, editor/chat, AI Team, research, GitHub, Supabase, Video Studio, Creative Library, Recreation Lab, settings and diagnostics surfaces.
- Provider abstraction and shared response parser modules exist. Existing tests cover response extraction, truncation and continuation, provider/model effort handling, and Parallel Search response normalization.
- AI Team mode labels are explicit: debate, three **sequential** agents, and two independent audits. The implementation deliberately enforces a one-agent-at-a-time concurrency limit. This is not a mislabeled parallel execution defect in the UI; the label is accurate. Review the user-facing explanation and efficiency trade-offs later.
- The mini-app host iframe uses a sandbox without `allow-same-origin`, plus a restrictive CSP (`connect-src 'none'`) in the app frame. The message bridge validates source window, channel, nonce and app ID. These security boundaries must remain intact.
- Extended mini-app runtime is built from DOM helpers and handler branches; in the inspected source no `innerHTML`, recurring timer, or object-URL pattern was found by the limited pattern scan. This is not a proof of absence across all app paths.
- Mini-app registry/catalogue both contain 40 apps across 9 categories; network disclosures show only Research Library and QR Studio with declared external endpoints in the catalogue inspected.
- The AI Workspace's Diagnostics is a separate script loaded by that page. It captures JavaScript errors/unhandled promise rejections and checks a set of required IDs, navigation controls, APIs and module initialization. It is **workspace-only**, not the whole extension; it does not currently prove provider connectivity, team workflow success, mini-app interactions, performance, or other pages.

### Confirmed diagnostics weakness
- The Provider module check repeats `!!window.CCProviders` as the final fallback (`!!window.CCProviders || !!window.CCProvidersModule || !!window.CCProviders`). This is redundant and should be corrected in the eventual diagnostics reliability patch. Severity appears low; it weakens the check's clarity rather than causing a product feature failure.
- The workspace diagnostic result list currently reduces checks to pass/fail. The broader QA system should use distinct statuses such as not-run, unsupported, skipped and warning so unavailable checks do not create misleading results.
- Error collection currently holds captured page errors in an in-memory array for the duration of that page. Assess boundedness and redaction before adapting it into any project-wide observer.

### Integration/design risks to examine in later batches
- Main AI workspace is a large controller with many responsibilities; the workspaces module also owns multiple integrations. Assess whether state ownership and module boundaries are sufficiently clear and whether they create maintenance risks, but do not refactor purely by file size.
- Project folder tools, stale-proposal checks, reviewed writes and undo safety are present in source and tests; inspect the full tool lifecycle and failure paths before declaring it reliable.
- Research query planning, provider retry behavior, citation/source preservation, Supabase read-only limits and GitHub review binding need end-to-end inspection.
- Video Studio includes writer/reviewer/editor orchestration, editable storyboard/character data, canvas preview and WebM export; investigate UI lifecycle, storage limits, media cleanup, cancellation and error recovery.
- AI Workspace UI contains many sections and controls within a shared workspace shell. The later visual audit must assess information hierarchy, density and navigation at device widths.

**Tests not executed:** Node test scripts/CI could not be run through the GitHub connector source-read environment. Findings above are static source inspection only.

## Audit batch 4 — File safety, sessions, memory and theme lifecycle

### Confirmed safe/efficiency patterns
- The Files page asks the user to choose a directory and stores the directory handle in IndexedDB; reconnect flow explicitly requests permission again.
- The scanner protects likely project/extension directories and refuses a root containing a manifest or Git directory. It bounds traversal to 4,000 files and depth, skips the review folder, and hashes exact-duplicate candidates only when files are ≤16 MB.
- Cleanup suggestions are staged into a `_Review` folder via verified copy. The code checks source size/modification timestamp before copying, compares copied output byte-for-byte, and deliberately preserves originals. The UI explicitly asks for confirmation and reports copy failures.
- Session saving uses a bounded number of sessions/tabs, validates web URLs, and only closes tabs after session persistence succeeds. Restored background tabs are discarded where Chrome permits.
- Usage JSONL import is streamed, bounded by file count/aggregate bytes/line and record limits, and aggregates metadata rather than importing entire conversation content.
- The Memory page uses a bounded worker pool (four concurrent tab probes), samples supported page heap metrics only, and clearly explains that per-tab JavaScript heap estimates are not full process memory. The page is user-opened and its refresh cadence is visibility-aware.
- Wallpaper selection and rotation occur on new-tab startup; the theme source documents that rotation has no recurring timer. Wallpaper animations are paused while the page is hidden. Reduced-motion preference is considered.
- Background auto-suspend is configured only while enabled and uses a single named alarm. The sweep excludes active, audible, pinned and discarded tabs and consults the shared never-suspend policy.

### Risks / areas requiring validation
- The memory monitor probes all eligible non-discarded web tabs using four concurrent workers. It is bounded in concurrency but not in total tab count; a very large tab collection could make a manual/visible refresh slow. Test with many tabs and consider a maximum sample count or incremental/abortable scan with a truthful partial-result indicator.
- The memory monitor refreshes every 30 seconds while visible and on visibility return. Verify that hidden page transitions, extension-page discard/reopen and script errors don't create duplicate timers or overlap; `busy` prevents overlapping refresh calls.
- The Files scanner can still traverse a large tree up to its file/depth caps, and duplicate detection reads candidate files up to 16 MiB into buffers for SHA-256. Measure scan duration/peak memory on target hardware and ensure cancellation/progress is adequate. It is user-triggered and copy-only, which reduces data-loss risk.
- Weather geocoding and forecast fetches require network. Review caching, retry behavior and error messaging; no runtime weather integration test was executed.
- The wallpaper engine contains many visual modes, some with animated layers. Existing hidden-page and reduced-motion handling is positive, but actual idle CPU, multiple-tab animation behavior and transition glitches need measurement.

### Noted interaction/coverage limits
- The Files page's scan and copy flows have safety protections, but manual picker/permission prompts, filesystem edge cases, quota/errors, permission revocation and large-folder UX are not tested here.
- Session restore is bounded, but real restore/discard behavior and partial tab-creation failure require browser testing.
- Memory estimates are intentionally incomplete when a page does not expose the heap API; verify unsupported states are displayed clearly.
- Theme/wallpaper settings, custom photos, collections, auto-theme, backup restore and accessibility controls have not yet been tested end-to-end.

**No source application code changed in this batch. No runtime or device test performed.**


## Phase A completion
Source-level Audit Phase A is complete for this pass. A prioritized findings/backlog report and CI evidence are published in [AUDIT-PHASE-A-COMPLETED.md](AUDIT-PHASE-A-COMPLETED.md). Browser visual inspection, runtime testing, and Chromebook metrics remain explicitly outstanding; do not treat source review as device certification.
