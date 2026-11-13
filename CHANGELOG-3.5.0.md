# My Launcher 3.5.0 — Offline-first Mini-app Platform

## Marketplace and catalogue
- Rebuilt the public Vercel storefront with responsive app cards, search, category filtering and sorting.
- Published a 40-entry catalogue across eight categories: twelve implemented apps and twenty-eight explicitly planned apps.
- Planned apps are clearly marked and cannot be installed until their local implementation is bundled.
- The extension can fall back to its built-in twelve-app catalogue when the remote catalogue is unavailable.

## Local app runtime
- Added a dedicated launcher workspace with sandboxed app frames.
- Apps run without `allow-same-origin`, direct Chrome extension APIs or direct network access.
- A nonce- and source-bound message bridge handles app data, theme settings, approved OpenAlex search and explicit launcher note/task actions.
- Added theme, custom accent, text size, density, high contrast and reduced-motion synchronisation.
- Added minimise/suspend, expand/restore and close-with-save-flush controls.
- The first twelve apps are Research Library, PDF Reader, Citation Manager, Focus Timer, Markdown Editor, JSON Studio, Quick Notes, Mini Kanban, Study Planner, Flashcard Studio, Advanced Calculator and Colour Studio.
- Research Library's fresh OpenAlex search requires internet; the other first-party app features are designed to work offline.

## Storage and backup
- App data is isolated in IndexedDB by app ID with per-app byte limits.
- Install registrations, favourites, resource profile and bounded app data are included in launcher backup/restore.
- Older backups without mini-app data preserve existing app data.
- Uninstall separately asks whether local app data should be retained or deleted.
- Credentials remain excluded from backups.

## Resource policy and compatibility
- Conservative active-app estimate threshold: 15 MB.
- Balanced active-app estimate threshold: 35 MB.
- Unrestricted permits higher estimates with warnings.
- RAM and CPU values remain estimates, not measured process telemetry.
- Manifest V3 and minimum Chrome 103 are retained.
- No new extension permissions, third-party dependencies, frameworks or build steps were added.

## Verification completed
- Syntax parsing passed for all 37 JavaScript files under the extension and marketplace.
- All 13 extension HTML pages reference existing local scripts and styles.
- All three extension/marketplace JSON files parsed successfully.
- Catalogue validation: 40 unique app IDs, 12 live and 28 planned; all versioned URLs match the catalogue policy.
- Local app registry: twelve entries matching the twelve live catalogue entries.
- Static security checks confirmed the app frame CSP denies direct network access, the iframe omits `allow-same-origin`, the frame contains no Chrome extension API calls, and parent messages are checked against the iframe source, nonce and app ID.
- Vercel production deployment for the 40-entry catalogue and redesigned storefront reached READY. The deployed homepage and catalogue returned HTTP 200; the served catalogue contained 40 entries (12 live, 28 planned).

## Manual verification still required
The code has not been executed in the user's ChromeOS 103 browser or measured on the physical 2 GB Chromebook from this session. In particular, verify PDF rendering in the sandbox, theme changes, offline cold-start, app data backup/restore, and performance in Chrome Task Manager before treating every runtime behaviour as device-verified.

## Next roadmap
- 3.5.1: expand to 20 working apps.
- 3.6.0: expand to 30 working apps.
- 3.7.0: complete the 40 working apps.
