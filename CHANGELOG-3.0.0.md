# My Launcher 3.0.0 — Architecture and foundations

## Architecture

- Established ARCHITECTURE.md with runtime boundaries, page/module responsibilities, storage ownership, background message contracts and performance constraints.
- Made theme.js the source of truth for theme and built-in wallpaper identifiers. Settings, backup validation and assistant intent parsing now consume the shared catalogs.
- Consolidated background chat and search request validation, payload bounds, fetch handling and response relaying into one helper. Endpoint-specific credentials, headers and size limits remain unchanged.

## Duplicate and unnecessary code

- Removed the single-consumer store.js cache. It had only one caller and did not provide cross-page caching; the command bar now reads shortcuts directly from chrome.storage.local.
- Removed the redundant save() alias in newtab.js; call sites now invoke the actual workspace persistence function.
- Retained small page-local helpers where they are intentionally scoped to separate pages or have different semantics. This avoids introducing global dependencies solely to eliminate short, unrelated functions.

## Compatibility and data safety

- Manifest V3 retained.
- Minimum Chrome version remains 103.
- No new permissions, dependencies, frameworks or build steps.
- No storage schema migration or user-data reset.
- Existing backup credential exclusions and validation remain in place.
- Auto-suspend remains opt-in and uses the existing alarm lifecycle.

## Verification

- Shared catalog consumers are loaded after theme.js on the pages that use them.
- Background relay call sites retain the original chat and search endpoints and respective 200,000 / 100,000 character serialized payload limits.
- The command bar no longer references store.js; the file and script include are removed.
- Full release checks include manifest validation, syntax checks for all JavaScript files, HTML script-reference checks, CSS structural checks, duplicate-function review and documentation/version consistency.