# Project Atlas — Modernization & Release Roadmap

**Status:** Stages A–B complete. Stages A–C source/CI complete. Stage D.1 home/sidebar/onboarding is in implementation in 5.8.0; visual device verification pending.
**Current baseline recorded in README:** 5.8.0 (Stage D.1 UI refresh candidate; device verification pending).
**Guiding goal:** A lightweight personal AI work environment that remains usable on constrained Chromebook hardware while offering integrated projects, research, creative work, teams and utility tools.

## Operating principles

1. **Audit before building:** Verify the existing implementation, recent history, active bugs, and module boundaries before duplicating or replacing features.
2. **No feature pile-ups:** Integrate through shared contracts and clear ownership rather than adding disconnected pages.
3. **Device-first performance, platform-aware design:** Keep the Chromebook baseline efficient; design modularity and progressive enhancement so a future desktop/browser environment can use more capability without making the Chromebook heavier.
4. **Observable, not invisible:** User-visible background work, timers, polling, storage writes, model calls, permissions, and agent actions must have a discoverable status and control wherever practical.
5. **Honest readiness:** Automated pass ≠ device pass. Report exactly what was tested and what remains untested.
6. **Checkpoint releases:** Deliver one major milestone at a time, pause for the user's device testing, then use feedback to guide the next cycle.
7. **Protect user data:** Diagnostics must avoid collecting page contents, prompts, files, credentials, tokens, or personal browsing content by default.

## Release and checkpoint cadence

Each cycle follows: **audit → scope/spec → implementation → automated checks → integrated QA → release candidate → user testing → feedback/fix release → closeout**.

- **Major releases (x.0.0):** substantial integrated capability, architecture or UX changes. Never use a major number merely because a large amount of code was written.
- **Minor releases (x.y.0):** coherent feature additions or subsystem improvements.
- **Patch releases (x.y.z):** bug fixes, regression corrections, security/performance fixes, or narrowly scoped polish.
- **Test/QA releases:** explicitly labeled *Testing Build* or *QA Checkpoint*; their primary purpose is diagnostics, measurement, regression checks and gathering evidence—not feature expansion. They may be numbered prereleases or interim versions, but the final numbering is chosen after scope and compatibility review.
- **Release candidates:** freeze feature scope; fix blockers and test. A release candidate is not presented as finished.
- **User test window:** after a milestone, pause planned feature work until user feedback is received unless the user asks to continue.

## Planned milestones (sequencing, not fixed version numbers)

### Stage A — Deep audit and inventory (source pass complete; runtime/visual evidence deferred)
- Inspect the complete repository and relevant Git history, not only README or selected files.
- Inventory extension pages, mini-apps, scripts, modules, shared APIs, storage keys/databases, listeners, timers, alarms, permissions, network destinations, and lazy-load boundaries.
- Classify each capability as: implemented and verified; implemented but unverified; partial; UI-only/mock; broken/duplicate; obsolete; or planned.
- Trace critical user journeys and module-to-module handoffs.
- Reproduce and retest known reported issues (selector/touch problems, null target errors, missing store references, non-working navigation/icons, reviewer empty output, research HTTP 400, Video Studio exceptions, provider/model switching, text-input limits, file/project persistence). These are **historical reports to investigate**, not assumed current bugs.
- Produce a prioritized defect ledger and integration map with evidence and proposed fixes.

**Source audit exit gate: met.** Repository inventory, module boundaries, CI evidence, prioritized findings and explicit limitations are recorded in `AUDIT-PHASE-A-COMPLETED.md`. Runtime/browser visual inspection, Chromebook measurements, and full interaction coverage remain deferred to Stage B/D because they require a browser/device test environment. No app code was changed during this source audit.

### Stage B — QA/Diagnostics instrumentation build (source/CI complete; user device checkpoint recorded)
Build a project-wide Diagnostics & Performance Center (spec in `TESTING-SYSTEM-SPEC.md`) and a baseline capture mode:
- system/extension health overview and test run history
- module/app inventory and missing/duplicate registration checks
- route/navigation, selector, required element and listener contract checks
- storage health, bounded usage estimates, migrations and recoverability checks
- timers, alarms, polling, background work and active-operation visibility
- request/model-call activity counters, latency/error categories, retry/cancel status (metadata only)
- resource/performance measurements supported by the browser; explicitly mark unavailable metrics
- error/exception capture with source location where available, grouped deduplication
- diagnostic report export with secrets and user content redacted
- manual QA checklist and one-click lightweight smoke suite

**Exit gate:** diagnostic UI is useful, safe, low-overhead, and accurately distinguishes a test pass, warning, failure, and unavailable check. The source/CI tests must be green and the manual Chromebook checklist completed. Do not make it silently run intrusive tests. See `STAGE-B-DIAGNOSTICS-IMPLEMENTATION.md` and `PROJECT-ATLAS-STAGE-B-MANUAL-QA.md`.

### Stage C — Reliability & regression fixes (targeted patch series)
- Fix high/critical defects found in audit and surfaced by Diagnostics.
- Strengthen initialization order, null-safe DOM access, message contracts, event delegation, selector integrity, navigation, storage migration/recovery and error propagation.
- Make async operations cancellable where possible and prevent duplicate/in-flight work.
- Add regression tests for every fixed defect.
- Validate all 40 mini-apps against the app contract, not merely catalogue registration.
- Add no unrelated features.

**Exit checkpoint:** Source-level Stage C implementation and CI are complete in 5.7.2. The merged fixes cover bounded project-folder search, project-note page-exit persistence, debounce flush lifecycle, and idempotent/wait-for-controller workspace initialization. PR #25 CI passed. Chromebook validation of note persistence and critical workspace journeys is still required; see `STAGE-C-RELIABILITY-CHECKPOINT.md`. Stage D stays paused until the user reports this checkpoint.

### Stage D — Full UI audit and competitive redesign (dedicated major workstream)
- Perform a screen-by-screen visual and interaction audit of the entire extension, including launcher, AI workspace, Teams, projects/files, research, creative tools, all mini-apps, settings, integrations, themes, tab/session tools, and all loading/empty/error/confirmation states.
- Research competitor/reference products and document which UX patterns are worth adapting; do not copy branding or proprietary design.
- Produce a UI inventory, screenshot/reference matrix, UX journey map, and prioritized redesign backlog before implementation.
- Establish a shared design system (typography, spacing, semantic colors, surfaces, iconography, components, states, responsive breakpoints, motion and reduced-motion).
- Redesign navigation, hierarchy, discoverability, touch controls, selectors, dialogs, loading/errors and common interaction patterns.
- Implement in coherent batches, starting with global shell/shared components, then AI workspace, project foundation, AI Teams, research, creative tools, mini-apps and remaining settings/system surfaces.
- Validate at Chromebook 1366×768 and smaller/mobile viewport where available; avoid overflow, clipped menus, tiny touch targets and regressions.
- Preserve existing capability, deep links, registration contracts and user data; don't equate a visual makeover with functional correctness.

**Exit gate:** inventory accounted for, reference findings documented, shared design system applied to high-priority surfaces, critical journeys regression-tested, responsive/accessibility basics reviewed, and manual user-device test checkpoint completed. See `UI-REDESIGN-SPEC.md`.


### Stage D.1 — Core UX & navigation integration
- Reassess launcher/home, navigation, app discovery, search/command bar, workspaces, settings, touch ergonomics, keyboard accessibility, small-screen layout and state handling.
- Reduce fragmented surfaces and make cross-module paths obvious.
- Design consistent selectors, dialogs, confirmations, back/close, status and feedback.
- Simplify without removing useful capability; preserve user data and migration paths.

**Exit gate:** usability review and manual touch/device pass; no redesign that breaks existing affordances.

### Stage E — Project/workspace foundation
- Treat projects as coherent workspaces with clearly visible context, files, notes, tasks, conversations, generated outputs, and activity history.
- Define project context inclusion and exclusion, user control, context size limits, and provenance.
- Provide explicit file creation/editing inside a selected project/folder, preview diffs, confirmation, guarded apply, and recovery/undo.
- Keep data local by default; make any external transmission clear and consent-driven.
- Make project switching and restoring state reliable.

**Exit gate:** create/open/switch/reopen project, persist, edit/preview/apply/recover files, and verify context selection without cross-project leakage.

### Stage F — AI Core and AI Teams reliability
- Normalize provider/model request/response contracts, completion reasons, usage, errors and timeouts.
- Preserve partial results safely and distinguish truncation from valid completion.
- Team orchestration: explicit plan/stages, dependency handling, role boundaries, progress, output schema checks, handoffs, review, evidence, retries, cancellation and final summary.
- Avoid false completion claims: stages must be verified before marked done.
- Provide run history, clear outputs, errors and user control.
- Evaluate quality using a small repeatable task suite and saved expected behavior, not anecdotal prompts alone.

**Exit gate:** representative tasks across providers and teams pass; cancellation/recovery/error cases behave honestly.

### Stage G — Research & evidence workflow
- Plan a research task and define questions before searching.
- Track source URLs, retrieved dates, relevance and evidence snippets/notes with clear source provenance.
- Synthesize with citations, uncertainty, contradictions and unanswered questions.
- Handle failed/empty search results, timeouts, rate limits, invalid responses and retry controls.
- Keep source data separate from instructions; treat pages and retrieved text as untrusted.
- Save research to a project and export in a useful format.

**Exit gate:** a full research workflow can be completed, checked, saved and reopened with source links intact.

### Stage H — Creative tools and shared assets
- Connect Creative Library, style profiles, Recreation Lab, Video Studio, storyboards, character/project references and outputs into a clear shared creative workflow.
- Design UI for selecting references, brief, constraints, style, output, comparisons and evaluation.
- Explicitly disclose when a tool only creates a plan, storyboard, preview or text—versus actual generated media.
- Add staged processing, memory-safe previews, cleanup of object URLs, bounded assets and export recovery.
- Preserve local reference privacy; require clear confirmation before any upload/analysis.

**Exit gate:** creative assets and projects persist, previews clean up, and output capabilities are accurately described.

### Stage I — Performance & Chromebook efficiency
- Establish measured baseline and target budgets for startup, interaction, idle CPU, memory, storage, network, and long-session behavior.
- Profile on the target Chromebook where available, plus a modern browser comparison only as supplemental evidence.
- Audit eager imports, duplicate listeners, DOM size, animations, polling, timers, network retry loops, object URLs, media previews, IndexedDB transactions, memory leaks and unnecessary wakeups.
- Use lazy loading, event-driven updates, bounded queues/history, backoff, cleanup and suspension.
- Avoid claiming actual CPU/RAM usage from estimates or unsupported APIs.

**Exit gate:** before/after measurements are documented, user-facing interactions remain responsive on the baseline device, and background activity is explainable.

### Stage J — Cross-device / remote approval capability (later, separate design phase)
**Intentionally deferred until core reliability and project workflows are mature.**
Explore secure mobile notifications/messages for approvals, confirmations, task completion and decision requests from AI/AI Teams.
- First decide the delivery architecture (push service, companion web app, or another option), identity/authentication, device pairing, and privacy model.
- Approval requests must be scoped, expiring, tied to a specific action and exact reviewed payload, and revocable.
- Require a safe default when approvals time out; no consequential action should silently proceed.
- Remote controls: approve, reject, pause, cancel, view details, and request clarification, as appropriate.
- Show task state and decision audit trail on both the computer and mobile.
- Do not expose credentials, private file contents, prompts, or full browsing activity in notification previews.
- Prototype UX and threat model before implementation; evaluate network availability, abuse, replay, impersonation and lost-device scenarios.

**Exit gate:** threat model, design review, prototype user flow, and explicit user approval before building live integrations.

### Stage K — Cross-platform evolution and product positioning
- Re-evaluate whether the extension should remain Chrome-first, add a standalone companion/workspace, or support other desktop browsers/platforms.
- Prioritize portable core modules and platform adapters; avoid duplicating the entire app or weakening Chromebook constraints.
- Validate demand and technical feasibility before investing in desktop packaging.
- Keep product identity: a lightweight personal AI work environment with project continuity, useful tools, AI workflows and creative/research capability—not a feature-count race.

## Continuous patch and maintenance track (runs between milestones)
- Reproduce bug reports, capture expected behavior, fix the smallest responsible layer, add regression test, check neighboring modules, release a patch and document it.
- Triage: P0 data loss/security/extension unusable; P1 core workflow broken; P2 significant feature or UX defect; P3 minor polish.
- Never merge a patch solely because the edited screen looks correct; check shared consumers.
- Dependency/API changes require compatibility review and rollback path.

## Release gates (mandatory)
A milestone cannot be called ready until:
- [ ] scope and acceptance criteria are defined
- [ ] audit and integration impact are complete
- [ ] code review and automated checks are complete
- [ ] critical paths and adjacent modules are regression-tested
- [ ] storage migration and backup/restore checked if affected
- [ ] performance and background-work impact reviewed
- [ ] permissions and privacy impact reviewed
- [ ] limitations and untested areas documented
- [ ] manual QA checklist prepared
- [ ] user is notified with a testing summary
- [ ] merge to `main` happens only after the agreed release gate

## What the user receives at every checkpoint
1. Release/build identifier and branch/commit link.
2. Plain-language changes and intended behavior.
3. What automated tests ran and their actual results.
4. What was not tested or could not be measured.
5. Known issues/risks.
6. Short device test checklist.
7. Clear instruction that development pauses for feedback when this is a user-test milestone.

## Project-wide quality areas (audit checklist)
- Launcher and navigation; icon/button touch behavior; responsive layout; focus/accessibility
- 40 mini-app catalogue, store, loading/launch/close lifecycle, app-specific persistence
- AI Assistant/orb, intents, chat history, relay, provider keys and privacy switches
- AI Development Workspace, editor/files, context, model/provider/effort selectors, request lifecycle
- AI Teams planning, stages, shared context, reviewer, outputs, cancellation and retries
- Research/search, citation/source handling, synthesis, export, empty/error states
- GitHub integration, permissions, diff preview, commit/push controls
- Drive/Brewkeg integrations and credential isolation
- Project/workspace lifecycle, notes, tasks, files, history and recovery
- Creative Library, Recreation Lab, Video Studio, export and asset cleanup
- Themes/wallpapers/animations, customization and schedules
- Tab/session tools, duplicate tabs, suspension and monitor accuracy
- Backup/import, migration, integrity, size limits and data preservation
- Background service worker, alarms, listeners, message contracts, network, storage and permissions
- Security/privacy, untrusted web content, secrets, confirmations and diagnostics redaction
- Performance, memory/CPU/network, idle behavior, startup and long-session stability

## Roadmap maintenance
This document is the living plan. Each phase should be converted to small actionable tasks with completion criteria, linked test evidence and status. Reorder only after a short rationale is recorded. Features discovered during audit are added to the appropriate phase rather than forgotten or rushed into the current release.


### Stage D.1 — Home, navigation and onboarding (5.8.0 candidate)
- [x] Responsive, roomier dashboard layout with less density and clearer panel separation.
- [x] Settings collapsed by default behind personalization disclosure.
- [x] Animated desktop sidebar collapse/expand and touch drawer.
- [x] Installed bundled mini-apps listed as direct sidebar launch links.
- [x] First-run tour, replayable Guide control, action-linked steps, blackout/fade transitions and reduced-motion support.
- [x] Source-contract regression test wired into CI.
- [ ] Chromebook/browser/touch visual validation, screenshot review and bug fixes.
- [ ] Continue redesigning the AI workspace, common controls and mini-app surfaces in follow-on batches.


### Stage D.1 — Home, navigation and onboarding (5.8.0 candidate)
- [x] Responsive, roomier dashboard layout with less density and clearer panel separation.
- [x] Settings collapsed by default behind personalization disclosure.
- [x] Animated desktop sidebar collapse/expand and touch drawer.
- [x] Installed bundled mini-apps listed as direct sidebar launch links.
- [x] First-run tour, replayable Guide control, action-linked steps, blackout/fade transitions and reduced-motion support.
- [x] Source-contract regression test wired into CI.
- [ ] Chromebook/browser/touch visual validation, screenshot review and bug fixes.
- [ ] Continue redesigning the AI workspace, common controls and mini-app surfaces in follow-on batches.
