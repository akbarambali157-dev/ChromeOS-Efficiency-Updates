# My Launcher architecture

**Release baseline:** 3.3.0  
**Runtime:** Chrome Extension Manifest V3, minimum Chrome 103  
**Implementation:** plain HTML, CSS and JavaScript; no build step or third-party runtime dependency.

This document records the architecture established in 3.0 and the deeper reliability and data-integrity boundaries added in 3.2. It is intended to make later changes safer, not to prescribe a framework migration.

## Runtime boundaries

The extension has two kinds of execution context:

- **Extension pages** (newtab.html, assistant.html, claude-app.html, github.html, drive.html, brewkeg.html, sessions.html, memory.html, files.html, and popup.html). Each page has its own JavaScript global scope and loads only the scripts it needs.
- **Background service worker** (background.js). It owns extension-wide event listeners, dynamic dark-mode content-script registration, tab-age tracking, optional auto-suspend scheduling, and the validated API relay. It imports tools.js with importScripts().

Scripts are classic scripts, not ES modules. Their order in each HTML file is part of the runtime contract: dependencies such as theme.js, tools.js, gauge.js, assistant-intents.js, and assistant-core.js must load before the page controller that consumes them.

## Module responsibilities

| Module | Responsibility |
| --- | --- |
| background.js | MV3 service-worker events, dark-mode registration/synchronisation, tab age, auto-suspend, chat/search relay |
| tools.js | Shared tab operations: duplicate closing, safe suspension predicate, manual memory freeing |
| common.js | Shared, identical page helpers: safe text-node element factory, GiB formatter, plural formatter and URL normaliser |
| theme.js | Theme engine, wallpaper rendering, day/night selection, and the complete shared theme/swatches/default-wallpaper catalog |
| nav.js | Builds the sidebar from the page data-app identifier |
| gauge.js | Shared SVG memory gauge renderer |
| newtab.js | Home clock, shortcuts, workspace profiles, notes and dashboard rendering |
| tasks.js | Task creation, due dates, completion and persistence |
| home-tools.js | Home-page tab tools and recently closed tabs |
| home-settings.js | Memory display, auto-suspend settings, backup export/import and backup validation |
| home-look.js | Theme/wallpaper controls, wallpaper collections and motion preference |
| customization.js | Dashboard layout, palette and accessibility preferences |
| home-dark.js, dark-detect.js, dark.css | Website dark-mode preferences and isolated-page detection/styling |
| assistant-intents.js | Pure text-to-intent parser |
| assistant-core.js | Shared assistant logic, speech, commands, context and Brewkeg requests |
| assistant.js, orb.js | Full-page and floating assistant views; neither duplicates the assistant brain |
| commandbar.js | Command matching, shortcuts, open tabs, bookmarks and history |
| claude-app.js | Lightweight editor, chat, search, diff review and snapshot-bound GitHub push workflow |
| github-api.js | Shared authenticated GitHub REST client and status/error handling |
| github.js | GitHub dashboard, Codespaces, pull requests, commits and builds |
| files.js | User-selected folder scan, exact duplicate candidates and verified move-to-_Review workflow |
| sessions.js, sessions-page.js | Bounded browser tab-session save/restore and validated, streamed Claude usage imports |
| memory.js | System memory and tab-level memory view |
| weather.js | Weather forecast and secondary timezone clock |
| apps.js | On-demand Mini-app Store, open-access research search, local PDF reader, citations, focus timer, Markdown and JSON tools |
| popup.js | Toolbar popup controls and Cloudflare diagnostic |
| defer.js | Defers non-critical home-page scripts until idle |

## Shared identifiers and logic

- common.js owns the small helpers that were byte-for-byte duplicated across page controllers. It is loaded only on pages that consume those helpers. Page-specific selectors, status setters and URL-host policies remain local.
- theme.js is the source of truth for theme metadata, swatch colours, default wallpapers and IDs. It exposes LAUNCHER_THEMES, LAUNCHER_THEME_IDS, THEME_WALL and WALLPAPER_MODES. Settings, assistant intents and backup validation consume those catalogs; custom-photo mode is deliberately excluded from the built-in wallpaper list.
- tools.js is the source of truth for duplicate-tab closing, the neverSuspend() safety predicate, and manual memory freeing. The worker and extension pages use the same predicate rather than maintaining competing versions.
- assistant-core.js is shared by the full assistant page and floating orb. View-specific rendering stays in assistant.js and orb.js.
- Chat and search use one relayRequest() implementation in the service worker. Endpoint, authentication header and size limit remain explicit per request type.
- github-api.js owns authenticated GitHub REST request handling for the GitHub dashboard and editor. Token storage remains with each page; 404-as-missing is opt-in for the editor's create-or-update flow.
- Editor pushes capture the reviewed file ID, content snapshot, repository and encoded path. A changed file or destination invalidates the review, and the PUT uses only the reviewed snapshot.
- Files are called exact duplicates only after matching size and a full-file SHA-256 digest (files above 16 MB are skipped to keep memory bounded). Duplicate candidates are unselected by default. A move copies to a collision-safe destination, compares the streams byte-for-byte, and only then removes the source.
- Task validation is shared between initial load and storage-change events. Task writes have an explicit local persistence function.
- Usage JSONL imports are streamed and bounded by file count, total bytes, record count, line length, session count and model count. Browser sessions are capped for new saves, validate restored URLs, and close source tabs only after the save succeeds.
- Tiny DOM selectors, status setters and formatters remain page-local where their meaning or output differs. A repeated name alone is not evidence that two helpers should become a global dependency.

The old store.js read-through cache was removed in 3.0: it had one consumer and did not provide cross-page caching. The command bar now reads its shortcut list directly through the native Chrome storage API.

## Storage ownership

Chrome extension storage is the persistence layer for extension settings and app data. The following key groups describe intended ownership; a feature may read another feature's data only where the user-facing integration requires it.

| Data area | Main keys / location | Owner |
| --- | --- | --- |
| Shortcuts and workspaces | shortcuts, workspaces, activeWorkspace | newtab.js |
| Notes and tasks | note, tasks | newtab.js, tasks.js |
| Saved browser sessions | sessions | sessions.js |
| Theme and wallpaper | theme, themeMode, wallMode, wallpaper, wallpaperCollections, activeWallpaperCollection, wallpaperRotation, wallpaperRotationIndex, motion | theme.js, home-look.js |
| Appearance preferences | layoutPrefs, customPalette, accessibilityPrefs | customization.js |
| Website dark mode | darkMode, darkSkip, nativeDark | background.js, home-dark.js, dark-detect.js, popup.js |
| Assistant | assistant, aiKey | assistant-core.js, assistant.js |
| Editor and imported usage | ccFiles, ccLogs, ccSessions | claude-app.js, sessions-page.js |
| GitHub and web-search credentials | Stored separately from backup data | github.js, claude-app.js |
| Weather | weather, weatherCache | weather.js |
| File scan summary | fileScan | files.js, read by assistant |
| File-system directory handle | IndexedDB database launcher, object store kv, key dir | files.js |
| Per-browser-session tab timestamps | chrome.storage.session: born, seen | background.js, memory.js |

### Storage rules

1. Use chrome.storage.local for persistent extension settings and user data; use chrome.storage.session for tab timestamps that should not survive a browser session.
2. Keep storage operations close to the feature that owns the data. Cross-feature reads should be limited to documented integrations.
3. Do not put API credentials in backup exports. Chrome local storage is not an encrypted secret vault.
4. Validate imported JSON and bound collection sizes and text lengths before writing it.
5. Preserve existing keys and data formats unless a release explicitly includes a migration. No storage schema migration is introduced in 3.2; existing keys and data formats are retained.
6. Use the callback or Promise form supported by the target Chrome API, but do not mix both forms for the same operation.

## Background message contract

The service worker accepts messages only from this extension's own ID. Current message types are:

| Type | Purpose |
| --- | --- |
| darkSync | Re-register and synchronise website dark mode |
| reregister | Reapply dark mode and auto-suspend configuration after restore |
| autoSuspendConfigChanged | Reconfigure the optional auto-suspend alarm |
| getTabs | Return a reduced tab list when the command bar is focused |
| chat | Relay a validated JSON request to Brewkeg |
| search | Relay a validated JSON request to Parallel |

The chat relay retains a 200,000-character serialized-body limit; search retains a 100,000-character limit. Both require a non-empty string credential no longer than 4,096 characters and an object-shaped request body. Responses are returned as status and text; credentials are not logged.

## Performance and compatibility constraints

- Keep Manifest V3 and minimum_chrome_version 103.
- Do not add a framework, build system, dependency or permission for convenience.
- Avoid recurring background work. Dashboard timers pause while hidden; auto-suspend alarms exist only while enabled.
- Keep non-critical home-page scripts deferred.
- Do not move tab queries, memory scans or network requests into idle startup paths without a demonstrated need.
- Measure process memory and CPU using PERFORMANCE-BASELINE.md, not JavaScript heap estimates alone.

## 3.0 foundations

3.0 established module responsibilities, shared page helpers and catalogs, a consolidated background API-relay path, and documented storage/message contracts.

## 3.3 mini-app expansion

3.3 adds a standalone apps.html page registered in nav.js. The app catalogue is rendered on demand and each tool initialises only after the user opens it. Research Library queries OpenAlex for records marked open access and links to the returned OA landing page or DOI; it does not proxy, mirror or bypass publisher access. PDF Reader uses a user-selected local PDF and revokes its object URL when the view closes. Citation records and Markdown drafts are stored locally with bounded collection/text sizes. Focus Timer owns a page-local interval that is cleared when the app closes or the page is hidden. JSON formatting is local and uses textContent for output. No new permissions, dependencies, frameworks, background jobs or storage schema migrations are introduced.

## 3.2 deep-refactor boundaries

3.2 strengthens the editor/GitHub approval boundary, centralises GitHub REST handling, makes theme metadata single-source, verifies file moves and exact duplicate candidates, bounds usage imports and session restores, and repairs task persistence. It preserves the existing feature set, Manifest V3, Chrome 103 minimum, storage keys and formats, and the no-new-dependencies/no-new-permissions constraints.