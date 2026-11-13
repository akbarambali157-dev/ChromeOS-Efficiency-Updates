# My Launcher Mini-app Marketplace

## Current 3.7.0 implementation architecture

The Vercel site remains the public marketplace storefront and remote metadata catalogue. The extension reads catalogue metadata from:

`https://raw.githubusercontent.com/akbarambali157-dev/ChromeOS-Efficiency-Updates/main/marketplace/catalogue/index.json`

Production storefront: `https://chromeos-efficiency-marketplace.vercel.app/`

The 3.4.1 marketplace stored a URL launch record and opened a hosted app in a separate browser tab. The 3.7.0 implementation includes all **40 first-party apps** in a **locally bundled, sandboxed runtime** inside My Launcher. The 3.8.0 milestone is the remaining marketplace-wide regression and target-device QA pass.

## What Install means now

- Install registers/enables an app that is already bundled with the extension.
- It does not download or execute JavaScript from Vercel.
- The installed app opens in `app-workspace.html`, inside a restricted iframe.
- The local app code remains available when the Chromebook is offline.
- New app code and app-code updates are delivered through a normal extension release. A remote catalogue version cannot silently replace executable code.
- Vercel is still used for discovery and catalogue metadata. A cached validated catalogue is used when the network is unavailable.

The local registry is `new-tab-launcher/miniapps/registry.json` (40 unique app IDs). The shared app frame loads the original twelve implementations plus `miniapps/extended-apps.js`, which supplies the other 28. The public catalogue metadata and local registry are kept aligned; all 40 are registered in the install map.

## Runtime isolation and message contract

- The app frame uses a sandboxed iframe without `allow-same-origin`.
- The frame CSP denies general direct network access. Research Library search is routed through one narrowly defined launcher-side OpenAlex request; QR Studio has a narrowly allowed image source for its optional online QR rendering. Local media and PDF blob URLs are allowed only in the relevant resource directives.
- Parent messages are accepted only from the exact iframe window and must contain the current per-launch nonce and app ID.
- The bridge supports only theme synchronisation, app-scoped storage, the Research Library query, and close/flush lifecycle messages.
- The app frame does not receive Chrome extension APIs, extension tokens, tabs, browser history or another app's storage.
- App data is stored in IndexedDB database `my-launcher-miniapps`, object store `apps`, keyed by app ID. Each registry entry defines a bounded data limit.
- Closing the workspace requests a data flush and waits for the IndexedDB write acknowledgement.
- Uninstall asks whether local app data should also be deleted. Keeping data allows a later reinstall to recover it.

This is a first-party runtime, not an unrestricted third-party developer platform. Do not add arbitrary remote code execution to the frame.

## Launcher Integration API

The current bridge is deliberately small and versioned by its channel name:

| Message | Direction | Purpose |
|---|---|---|
| `theme` | Launcher → app | Send background, panel, text, muted, accent, colour scheme, text size, density, contrast and motion preferences |
| `storage.get` / `storage.result` | App ↔ launcher | Read the current app's own IndexedDB namespace |
| `storage.set` | App → launcher | Save JSON data within the app's registered byte limit |
| `app.flush` / `app.flushed` | Launcher ↔ app | Pause transient work and acknowledge a completed data write before closing |
| `app.suspend` | Launcher → app | Pause time-sensitive work when the workspace is minimised |
| `research.search` / `research.results` | App ↔ launcher | Submit a bounded OpenAlex query and receive a reduced result set |
| `launcher.notes.get` / `launcher.notes.result` | App ↔ launcher | Explicitly load the launcher's quick note |
| `launcher.notes.set` / `launcher.notes.saved` | App ↔ launcher | Explicitly copy text into the launcher's quick note |
| `launcher.tasks.add` / `launcher.tasks.added` | App ↔ launcher | Explicitly add one bounded task to the launcher's task list |

Every message includes the fixed channel, current app ID and per-launch nonce. The launcher accepts messages only from the active iframe's exact `contentWindow`. No arbitrary storage key, Chrome API method, URL fetch or cross-app read is exposed.

## Offline behaviour

- Installed bundled apps work without Vercel or GitHub connectivity.
- The marketplace catalogue refreshes when online and falls back to the last validated local metadata cache.
- Research Library's fresh OpenAlex search requires internet; saved app data is local.
- PDF Reader works with a user-selected local PDF. Other current first-party apps process their data locally.
- The Vercel website itself is a discovery storefront and is not the offline runtime.

## Resource budgets

RAM and CPU figures are engineering estimates, not live per-app process telemetry. Closed apps do not keep an app runtime active. The current profiles are Conservative (15 MB estimated active app RAM), Balanced (35 MB), and Unrestricted (warnings only). The default workspace design is one foreground mini-app at a time for the 2 GB Chromebook. Measure real process memory and CPU with Chrome Task Manager on the target device before claiming a measured result.

## Storage and backup

Small install records and preferences remain in Chrome extension storage. App-specific records use IndexedDB, not `chrome.storage.local`. App data is included in launcher backup/restore as bounded JSON records. The backup includes install registrations, favourites and resource profile; app data is stored in the backup under app IDs and validated against per-app byte limits before an IndexedDB restore. Older backups without miniAppData preserve existing app data. Large PDFs and temporary image buffers are never included. Large PDFs and temporary image buffers must not be copied into the app-data store.

## Security and compatibility

- Manifest V3 and minimum Chrome 103 remain required.
- No new extension permission, framework or third-party dependency was introduced for the 40-app implementation.
- Do not weaken the iframe sandbox or permit direct arbitrary network access to app frames.
- Catalogue metadata is untrusted input and must be validated before rendering.
- App updates must correspond to code bundled in the extension version; metadata alone is not an executable update.

## Deployment

- Vercel project: `chromeos-efficiency-marketplace`
- Repository: `akbarambali157-dev/ChromeOS-Efficiency-Updates`
- Production branch: `main`
- Project root: `marketplace`
- GitHub remains the source of truth; commits to `main` trigger Vercel deployment.

## Planned catalogue

The target is 40 apps across eight categories. The current local registry contains twelve first-party implementations. Only entries with a working local implementation and passing tests may be marked installable; future entries remain catalogue-only until implemented. The staged 40-app target is tracked in `MINI-APP-3.5.0-AUDIT.md`.