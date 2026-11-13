# 3.5.0-C — First 12 Local Mini-apps

## Added
- Expanded the bundled local registry from six to twelve apps.
- Added Quick Notes with bounded autosaved local text.
- Added Mini Kanban with To Do, In Progress and Done columns.
- Added Study Planner with local subject/date/duration entries.
- Added Flashcard Studio with local question-and-answer decks.
- Added Advanced Calculator with arithmetic, powers, square root, trigonometry and logarithms; no expression evaluator is used.
- Added Colour Studio with local HEX colour harmonies and copy actions.
- Expanded catalogue validation to the eight planned marketplace categories.
- Added a built-in local catalogue fallback so the store can be opened and installed apps managed when GitHub Raw is unreachable.
- Expanded the published metadata catalogue to twelve app entries.

## Verification
- JavaScript syntax parsed for the changed marketplace and runtime controllers.
- The local registry and remote catalogue JSON parsed successfully and each contains twelve entries.
- The extension manifest remains MV3, minimum Chrome 103, with the same permission and host-permission lists.
- Manual UI, offline, storage-recovery, iframe sandbox and target-device tests remain required.

## Remaining 3.5.0 work
- Full Vercel storefront redesign and accurate local-app availability messaging.
- App-data export/import and backup integration.
- Resource/lifecycle refinements and acceptance tests.
- Final version bump only after the release gates pass.
