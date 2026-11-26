# Project-wide UI/UX Audit & Redesign Specification

**Status:** Planned workstream. The UI audit/redesign has not yet been performed or implemented.
**Sequence:** Begin after the current full-project audit and initial diagnostics/testing foundation. Treat the visual redesign as a project-wide effort, not a Claude Mini App-only makeover.

## Objective
Raise the interface quality to a contemporary, cohesive, competitive standard while preserving the project's distinctive lightweight Chromebook foundation, existing capability, data and interaction affordances. Aim for a polished, understandable product—not a visual clone of another tool and not decoration at the expense of clarity.

## Phase 1 — Visual and interaction inventory (before design)
Inspect every surface and record:
- Main launcher/new-tab/home and primary navigation
- AI assistant and Claude Mini App / development workspace
- Provider, model and effort controls
- Project and folder selection; file creation/editing, previews and diffs
- AI Teams setup, execution, progress, results, review and history
- Research/search results, source lists, citations and exports
- Creative Library, Recreation Lab, Video Studio, storyboard and asset flows
- All mini-app catalog entries and individual app screens
- Settings, permissions, integrations, credentials controls, backups/import
- Themes, wallpapers, shortcuts, tab/session tools and contextual menus
- Loading, empty, error, offline, unsupported, confirmation and success states
- Touch/mobile-width, keyboard navigation, focus, and reduced-motion behavior

For each surface capture/record its current appearance, entry point, primary actions, dependencies, state behavior, responsive behavior, accessibility issues, and what feels inconsistent. Distinguish functional defects from visual/UX issues and missing capabilities. Use available screenshots and browser/device testing; don't claim visual inspection of screens that were not actually seen.

## Phase 2 — Competitive benchmark and design direction
Compare representative competing products and interface patterns for:
- Information hierarchy and density
- Navigation model and discoverability
- Workspace/project continuity
- AI chat, model selection and execution controls
- Multi-agent/task orchestration progress
- Research source/evidence presentation
- Creative tools and media handling
- Settings, confirmations, feedback and error recovery
- Responsive behavior and interaction polish

Use benchmark findings as inspiration and principles, not copying layouts, branding, or proprietary details. Produce a concise reference matrix: pattern, competitor/reference, what works, applicability, adaptation, and trade-offs.

## Phase 3 — Design system
Define before large-scale implementation:
- Typography hierarchy, spacing scale, sizing and density
- Color roles and semantic states with text/icon cues (not color alone)
- Surface, border, elevation, radius, divider and shadow rules
- Icon style and icon sizing; avoid mismatched icon libraries or inconsistent stroke weights
- Buttons, toolbars, menus, selectors, inputs, tabs, dialogs, toast/status, cards, lists, tables and progress components
- Layout grid, content width, responsive breakpoints, touch target sizing
- Light/dark themes and theme-safe contrast
- Motion/animation principles, durations, easing, reduced-motion and idle behavior
- Component states: default, hover, focus, pressed, selected, disabled, loading, error and success
- Shared tokens and CSS ownership to avoid per-app visual drift

## Phase 4 — UX architecture and navigation
Map major user journeys before rearranging:
- Open launcher → find/launch tool → return safely
- Start/resume project → inspect context → files/tasks/notes/output
- Choose provider/model/effort → run request → view errors/partial output → recover
- Create/run AI Team → track stages → review → save/export
- Research → source inspection → synthesis → project save
- Creative brief → choose references → produce preview/output → compare/save/export
- Settings/integrations → configure → verify → revoke/reset safely

Simplify navigation and make key actions discoverable. Keep advanced controls accessible without crowding the primary workflow. Standardize back/close, dialog, selection, confirmation and status behavior. Avoid breaking existing deep links, app registrations or persisted user data.

## Phase 5 — Redesign implementation order
Recommended sequence:
1. Shared foundations/tokens and layout primitives.
2. Launcher/home/navigation and global shell.
3. Common dialogs, selectors, buttons, inputs, menus, notifications and status patterns.
4. AI workspace and model/provider controls.
5. Projects, folders, files and context UI.
6. AI Teams execution/review surfaces.
7. Research and evidence interfaces.
8. Creative Library/Recreation Lab/Video Studio.
9. Mini-apps and specialized surfaces, in batches, using shared components.
10. Settings, integrations, diagnostics, session/tab tools, backup/restore and edge states.
11. Themes, polish, motion and accessibility pass.

Do not change all screens at once if it creates untestable risk. Batch implementation by coherent surface and keep regression checkpoints.

## Phase 6 — Visual quality criteria
Review at minimum:
- Clear hierarchy and balanced spacing; avoid cramped or oversized layouts
- Consistent alignment, typography, iconography and component behavior
- Intentional empty space and information density
- Controls look interactive and have correct tap/focus/disabled/loading states
- Avoid excessive nested cards, gradients, glowing borders, random accent colors or decorative noise
- Strong readability on the 1366×768 Chromebook baseline and smaller mobile viewport
- No clipping, overflow, overlapping controls, inaccessible menus or tiny touch targets
- Responsive layouts preserve useful functionality instead of merely shrinking
- Accessible contrast, keyboard focus, semantic labels and reduced-motion
- Loading and error states communicate what's happening and how to recover
- Avoid visual regressions, lost features or inconsistent styling in mini-apps

## Phase 7 — UI testing & validation
- Create an inventory-to-test matrix linking each screen to its critical interactions and states.
- Automated checks: routes, required elements, selector behavior where testable, accessibility heuristics, responsive/overflow checks, and shared component regressions.
- Manual checks: touch selectors, menus, modals, scrolling, navigation, dialogs, keyboard, loading and error states.
- Screenshot comparisons where reliable; investigate meaningful differences rather than treating every pixel change as failure.
- Test on Chromebook baseline and a wider/desktop viewport if available; mobile width as supplemental.
- User test checkpoint: provide a release summary and short prioritized test checklist. Pause for user feedback before proceeding to the next large UI batch.

## Deliverables
1. UI inventory with all surfaces and current state.
2. Competitive/reference matrix with findings and adaptation decisions.
3. UX journey map and navigation findings.
4. Shared design system and component behavior specification.
5. Prioritized redesign backlog with acceptance criteria.
6. Incremental implementation commits and screenshot/test evidence.
7. A final user-facing testing release with known limitations.

## Definition of completion
The redesign is complete only when the inventory has been accounted for, all high-priority surfaces have been redesigned using the shared system, critical flows pass regression checks, supported viewport/device tests are documented, accessibility basics and reduced-motion behavior are reviewed, no major regressions remain, and the user has tested the release on their device. A polished home screen alone is not completion.
