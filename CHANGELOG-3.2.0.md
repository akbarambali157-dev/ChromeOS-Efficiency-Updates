# My Launcher 3.2.0 — Deep refactor

## Editor and GitHub integration

- Added github-api.js as the shared authenticated GitHub REST client used by the GitHub dashboard and editor.
- Bound each push approval to the exact file ID, file content snapshot, repository and encoded path shown during review. Editing the file or changing the destination invalidates the approval; the push uses only the reviewed snapshot.
- Validated repository paths by segment and URL-encoded each segment before calling the GitHub Contents API.
- Editor file persistence now reports storage failures, flushes pending edits on pagehide, validates loaded file records and enforces the existing 40-file limit without silently truncating a new file.

## Themes and wallpaper

- Moved all 14 theme swatch metadata and default wallpaper mappings into the theme engine's shared catalog. The settings page now derives its swatches from that source instead of maintaining a second theme list.
- Bounded custom wallpaper uploads to 20 MB, a 1280-pixel maximum dimension and 40 million decoded pixels; canvas failures are handled without leaving object URLs behind.
- Added theme timing to validated backup exports and update the local theme cache only after the storage restore succeeds.
- Preserved per-file chat attachment preferences in editor backups.

## Files and data integrity

- Replaced first-64-KB SHA-1 duplicate guesses with full-file SHA-256 verification for files up to 16 MB. Larger files are skipped for duplicate classification to avoid high memory use.
- Duplicate candidates are no longer preselected.
- File moves now use collision-safe destination names, check that the source has not changed since scanning, compare source and destination streams byte-for-byte, and remove the original only after verification.
- If the original cannot be removed, the verified copy is cleaned up where possible so the original remains the only copy.

## Tasks and sessions

- Added the missing local task save function, with storage-error feedback.
- Centralised task normalisation for initial loads and storage-change events.
- Bounded usage JSONL imports: up to 20 files, 25 MB total, 100,000 records, 512,000 characters per line, 500 sessions and 20 models per session. Numeric usage values are validated and prototype-safe maps are used.
- Usage imports and clears update the in-memory view only after Chrome storage confirms success.
- Browser session saves are capped at 100 saved sessions and 200 web tabs per session. Restored URLs are restricted to HTTP(S), and tabs are closed only after the session has been saved successfully.
- Weather geocoding and forecast requests ignore stale responses so earlier requests cannot overwrite newer selections.

## Compatibility

- Manifest V3 retained.
- Minimum Chrome version remains 103.
- No new permissions, third-party dependencies, frameworks or build steps.
- Existing storage keys and data formats are preserved; no destructive migration is introduced.
