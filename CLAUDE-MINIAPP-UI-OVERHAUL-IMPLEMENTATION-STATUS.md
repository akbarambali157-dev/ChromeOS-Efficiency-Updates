# Claude Mini-App UI Overhaul — Recovery Checkpoint

**Date:** 2026-11-27
**Checkpoint branch:** `claude-miniapp-ui-overhaul-copy-checkpoint`
**Source copied from:** `claude-ui-overhaul-next5-project-context` at `2a83cec13ec8fed9934e46dce0576b2fa147edf3`
**Base:** `main` contains the merged Phase 1 foundation PR #29 (`dbb16276510ed6eaf758eae1db72c89058fd0a9b`).
**User authorization:** The user explicitly authorized copying the unmergeable recovery branch contents to another branch and completing all 31 overhaul features, with checkpoint notes maintained and integration into main afterward.

## Honest current status

- **5/31 completed and merged into main:** Foundation/design system, App shell/navigation, Chat experience, Composer, Ida activity experience.
- **Feature 6 (Coding/file workspace):** implemented in the main codebase earlier and included in the prior checkpoint, but its overhaul acceptance and integration status need verification before counting as complete under the 31-feature definition.
- **Features 7–11 (Projects & Context, AI Teams, Research, Creative Lab, Reference Lab):** recovery checkpoint contains partial implementation work. Treat as **in progress**, not complete, pending code audit, conflict resolution, behavioral tests, and review.
- **Features 12–31:** remaining work needs implementation/review according to the approved plan.
- This checkpoint is documentation-only. **No feature implementation or final tests have been completed in this turn.**

## Recovery branch copy

A new branch was created from the recovered remote checkpoint:
- `claude-miniapp-ui-overhaul-copy-checkpoint`

This preserves the recovered source and commits as a separate branch. It does **not** resolve the merge conflict with main; that remains an integration task.

The approved original specification from PR #28 is copied into this branch as `CLAUDE-MINIAPP-UI-OVERHAUL-PLAN.md` to ensure the complete 31-item checklist and roadmap remain available.

## Full master checklist (31 items)

1. Foundation and design system
2. App shell and navigation
3. Chat experience
4. Composer
5. Ida activity experience
6. Coding/file workspace
7. Projects and context
8. AI Teams
9. Research
10. Creative Lab
11. Reference Lab
12. Artifacts
13. Settings
14. Errors and recovery
15. Notifications and activity
16. Micro-interactions
17. Accessibility
18. Performance and responsive design
19. Home/landing screen
20. Unified search/command palette
21. Onboarding
22. Continuity/checkpoints
23. Adaptive workspace
24. Task Center
25. Observable work timeline
26. Smart workspace suggestions
27. Interactive task plans
28. Intelligent output layouts
29. Quality/review panel
30. Focus mode
31. Workspace presets and file previews

Note: Items 30 and 31 are grouped above to fit the original numbered checklist; the approved plan separately lists Focus Mode, Workspace Presets, and File Previews. For final progress reporting, count these as **31 total** only after the list is normalized to exactly one feature per checklist item; do not inflate or compress the count. The original plan remains the authoritative list.

## Eight-phase delivery plan

1. **Foundation & visual system** — design tokens, shell, navigation, themes, shared components.
2. **Chat & composer** — message presentation, draft persistence, attachments, context, model/effort controls.
3. **Ida & task activity** — truthful observable status, controls, low-resource/reduced-motion behavior.
4. **Coding & file workspace** — file explorer/editor, live activity, diffs, validation, recovery and safety.
5. **Projects & Context Inspector** — project dashboard, context transparency, continuity, checkpoints, tasks.
6. **AI Teams, Research & Creative** — reliable specialized workflows and integrated outputs.
7. **Reference Lab, artifacts & productivity** — library, artifact versioning, search, task center, focus, presets, file previews.
8. **QA, performance & release** — regression, accessibility, Chromebook optimization, responsive acceptance, integration and changelog.

## Resume instructions for the next session

1. Start by verifying this branch, main, PR #30, and the newly merged PR #29; read the complete original plan.
2. **Do not proceed by blind wholesale file replacement.** PR #30 conflicts with main. Compare overlapping files and preserve changes that arrived on main; resolve deliberately.
3. Continue with Features 6–11: coding/file workspace acceptance, Projects & Context, AI Teams, Research, Creative Lab, Reference Lab. Audit each against the plan and implement missing functionality.
4. After every feature slice, add tests (behavioral where possible, not selector-only contracts), run the relevant tests, and checkpoint the result in this status document.
5. Complete Features 12–31 from the original checklist in staged batches, keeping the target ChromeOS 103 / Acer CB3-532 low-memory constraints and mobile responsiveness.
6. Run the full test suite, syntax checks, mini-app validation, accessibility checks, responsive visual checks, and performance measurements. Do not claim visual/performance checks without actual evidence.
7. Create reviewable commits/PRs, integrate with current main, resolve conflicts safely, and merge only verified work.
8. Update this checkpoint at each stopping point with: features completed/remaining, changed files/commit, tests and results, unverified checks, next task and exact resume point.

## Current environment blocker

On 2026-11-27, attempts to provision or reopen a Vercel sandbox/desktop for code execution were denied by the Vercel API with **403 Forbidden**. Sandbox snapshot restoration had previously failed with 400 and the original sandbox is stopped. The GitHub connector remains usable for remote inspection and documentation writes, but it cannot run the project's Node test suite or provide a safe working code-edit/test loop. Do not attempt to merge PR #30 or claim all 31 features are finished until a code-capable sandbox is available.

## Recovery safety rule

Keep this branch as a preservation checkpoint. Do not merge it to main in its current state. Do not overwrite main files with stale checkpoint files until differences are reviewed.