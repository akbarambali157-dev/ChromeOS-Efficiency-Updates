# Mini-app Platform 3.5.0-A — Repository Audit

**Audit baseline:** 3.4.1  
**Audited branch:** `main`  
**Audited commit:** `3399fb3a6d7f5de5fe1d783d51ae19b1ce1347d7`  
**Target device:** Acer Chromebook 15 CB3-532, ChromeOS 103, Intel Celeron N3060, 2 GB RAM, 16 GB eMMC  
**Constraints:** Manifest V3, Chrome 103 minimum, plain HTML/CSS/JavaScript, no framework/build step, avoid new permissions and recurring background work.

## 1. Executive result

The repository is a lightweight, modular Manifest V3 extension with an existing launcher UI, a working remote catalogue flow, and six hosted mini-app experiences. It is **not yet an integrated mini-app runtime**. The current marketplace install action stores a launch record; opening an app creates a normal browser tab. App pages are hosted on Vercel and use that site's storage origin. They are not downloaded, installed as local packages, or available offline after a cold cache.

The 3.5.0 implementation must therefore introduce a real local app host and installation lifecycle rather than merely restyling the catalogue.

## 2. Repository and compatibility baseline

- Repository: `akbarambali157-dev/ChromeOS-Efficiency-Updates`
- Default branch: `main`
- Baseline commit: `3399fb3a6d7f5de5fe1d783d51ae19b1ce1347d7`
- Extension version: `3.4.1`
- Manifest V3, `minimum_chrome_version: 103`
- Plain HTML, CSS and classic JavaScript; no package manager or build system.
- Existing extension permissions: `storage`, `tabs`, `sessions`, `scripting`, `alarms`, `system.memory`, `bookmarks`, `history`.
- Existing host permissions: `<all_urls>`.
- Background service worker imports `tools.js`; extension pages load classic scripts in explicit order.
- The extension already has theme, backup/restore, notes, tasks, memory display, and navigation modules that should be reused rather than duplicated.

No reason was found in the audited architecture to add a framework or background polling.

## 3. Current marketplace findings

### Extension marketplace page

Files:
- `new-tab-launcher/apps.html`
- `new-tab-launcher/apps.css`
- `new-tab-launcher/apps.js`

Current behaviour:
- Fetches the catalogue from GitHub Raw.
- Validates catalogue entries and the Vercel versioned app URL pattern.
- Caches validated catalogue metadata in `chrome.storage.local` and falls back to that cache after fetch failure.
- Stores installed records, favourites and resource profile in `chrome.storage.local`.
- Supports Conservative (20 MB), Balanced (35 MB), and Unrestricted profiles.
- Displays package/RAM/CPU estimates and permissions/network disclosures.
- Opens installed apps with `window.open(..., '_blank')`.
- Installation stores app ID, version, URL and timestamp only. It does not download app code.

The existing app catalogue schema accepts only the three categories `research`, `productivity`, and `developer`, so it must be extended for the proposed eight-category catalogue.

### Vercel storefront

Files:
- `marketplace/index.html`
- `marketplace/store.js`
- `marketplace/assets.css`
- `marketplace/catalogue/index.json`
- `marketplace/apps/v1.0.0/app.html`
- `marketplace/apps/v1.0.0/app.js`

The storefront script is currently a minimal catalogue renderer. It is not the extension's install manager and does not communicate with the extension. The hosted app runtime is a single page that switches on app ID. Its six apps are Research Library, PDF Reader, Citation Manager, Focus Timer, Markdown Editor and JSON Studio.

The hosted apps are separate web pages. Citation and Markdown data use Vercel-origin browser storage, not extension storage. Research Library requires OpenAlex connectivity for fresh searches. PDF Reader reads a user-selected local PDF. Focus Timer pauses when the page is hidden.

### Current data ownership and gaps

- `launcherMarketplaceInstalled`: launch-record map, not a package registry.
- `launcherMarketplaceFavourites`: favourite IDs.
- `launcherMarketplaceProfile`: resource profile.
- `launcherMarketplaceCatalogue` and `launcherMarketplaceCatalogueChecked`: cached validated metadata.
- Hosted app data is origin-local and is not currently part of launcher backup/restore.
- There is no app workspace, window manager, local app runtime, app lifecycle controller, app-scoped storage broker, package cache, offline install mechanism, or theme message bridge.
- Existing 3.3 app data and Vercel-origin data are separate; no migration should be claimed without an explicit migration flow.

## 4. Security and architecture decision

### Recommended 3.5.0 direction: locally bundled, sandboxed first-party apps

For this release, the safest and most reliable offline-first implementation is to ship the first-party app runtime and app implementations inside the signed extension package, then let installation enable/register an app locally.

This means:
- A user can install and open an app without downloading executable JavaScript from Vercel.
- The marketplace catalogue remains remotely refreshable metadata, with a validated offline cache.
- Installed app code is available offline as part of the installed extension.
- New app code and app-code updates arrive through a normal extension release, not by silently executing mutable remote code.
- Vercel remains the public discovery/storefront and release-information site.
- The UI must clearly explain that "Install" enables a bundled local app; it must not claim to download a separate package.

This is preferable to executing remotely downloaded code because a catalogue and app package served from the same mutable web origin do not provide an independent publisher-signature trust root. Hashing a package against a hash delivered by that same origin detects accidental corruption but does not independently authenticate the publisher.

### Runtime isolation

Use a dedicated local app host and a sandboxed iframe with the minimum required sandbox flags. The app frame must not receive extension APIs or unrestricted parent DOM access. A narrow, versioned message bridge should:
- bind messages to the exact iframe `contentWindow` and a per-launch random nonce;
- validate message type, payload shape, size and app identity;
- expose only theme read/change events and app-scoped storage operations required by the app;
- reject unknown message types and never forward arbitrary Chrome API requests;
- avoid `allow-same-origin` and avoid arbitrary remote origins in the runtime.

If Chrome 103 behaviour or extension CSP prevents a safe implementation of this design, stop and revise the design rather than weakening sandboxing.

### Storage

- Keep small install records, favourites, resource preferences and theme settings in extension storage.
- Keep app-specific records in a dedicated IndexedDB database, namespaced by app ID and schema version.
- Do not put PDFs, images or large app data into `chrome.storage.local`.
- Use bounded payloads, bounded record counts, defensive JSON validation and explicit export/delete behaviour.
- Add install records and user-owned app data to backup/restore only after validating size, schemas and migration semantics.
- Uninstall must offer a clear choice to retain or delete app data; never silently imply that website-origin data has been deleted.

## 5. Runtime integration plan

1. Add an installed-app section to the launcher and marketplace.
2. Add a dedicated workspace page with one foreground app at a time as the safe default for 2 GB RAM.
3. Provide app header controls: back to launcher, minimise/close, and maximise where the layout supports it.
4. Ensure closing an app tears down timers, event listeners, object URLs, media playback and temporary buffers.
5. Use the existing theme catalog and preferences as the single source of truth.
6. Synchronise theme changes to the active app through the validated message bridge.
7. Keep apps dormant until opened; do not create background app tabs or poll inactive apps.
8. Add per-app data namespaces and documented API methods. No app may read another app's namespace.

## 6. Catalogue target

The target catalogue contains 40 planned apps across eight categories:
- Productivity
- Research and learning
- Documents and files
- Developer and data tools
- System and utilities
- Creative studio
- Personal organisation
- Media and accessibility

The six existing app experiences are retained as the starting set. The 40-app catalogue must distinguish implemented, planned and unavailable entries. Never present a planned app as installable until its local implementation and tests exist.

Recommended staged counts: 12 working apps in 3.5.0, 20 by 3.5.1, 30 by 3.6.0, and 40 by 3.7.0.

## 7. Resource and storage policy

Initial policy targets (to be measured, not represented as guaranteed usage):
- Conservative active-app estimate: 15 MB or less.
- Balanced active-app estimate: 15–25 MB.
- Heavy active-app estimate: 25–35 MB.
- Above 35 MB: warning and workload review.
- Default: one active app workspace; no background mini-app execution.
- Marketplace catalogue cache: 256 KB maximum.
- Individual logical app package target: 5 MB maximum.
- Marketplace app-code storage target: zero separately downloaded executable bytes in 3.5.0 because first-party code is bundled in the extension.
- App-specific user data: separately quota-managed in IndexedDB.

The browser does not expose complete, reliable per-extension-app process RAM telemetry. Displayed estimates must be labelled as estimates. Where supported, use Chrome Task Manager for device-level validation; do not infer whole-device RAM from JavaScript heap size.

## 8. Required test gates

- Existing launcher pages and features continue to load.
- Existing notes, tasks, themes, wallpapers, sessions, shortcuts and backups remain intact.
- Manifest remains MV3 and Chrome 103 compatible.
- No unnecessary permissions, dependencies, framework or recurring background timer is introduced.
- Install/open/close/uninstall lifecycle works offline for bundled apps.
- Theme changes propagate without reload.
- App storage is isolated by app ID.
- Malformed and oversized messages are rejected.
- Sandboxed apps cannot access `chrome.*`, parent DOM or other app data.
- Timers, media and object URLs are cleaned up on close.
- Backup/restore validates and bounds app data.
- Vercel catalogue failure falls back to the last valid cache.
- Every advertised offline capability is tested with network unavailable.
- Vercel production deployment and the user's extension installation are verified separately; a successful deployment alone is not a browser QA pass.

## 9. Audit conclusion

The existing 3.4.1 code is a sound lightweight launcher foundation, but its marketplace is a remote catalogue and tab launcher rather than an offline mini-app platform. The 3.5.0 work should preserve the current modular extension and replace the launch-record-only concept with a local, sandboxed, first-party app runtime.

**Audit status: complete.**  
**Next implementation stage:** 3.5.0-B — app manifest/schema, local runtime skeleton, app-scoped storage contract and security tests.
