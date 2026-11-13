# 3.5.0-B — Local Mini-app Runtime Foundation (development stage)

## Added
- Added a local first-party app registry for six bundled mini-apps.
- Added a launcher-owned app workspace with a restricted sandboxed iframe.
- Added a nonce- and source-bound message bridge for theme, app-scoped storage, research queries and close/flush lifecycle.
- Added IndexedDB app data namespaces with per-app byte limits.
- Added a flush acknowledgement before the workspace closes.
- Added separate uninstall confirmation for deleting or retaining app data.
- Added a narrowly scoped OpenAlex query relay; the sandboxed frame itself has no direct network access.
- Migrated matching 3.4.1 install records only when their app ID and version match locally bundled code.

## Changed
- Marketplace Install now enables locally bundled app code instead of saving a hosted launch URL.
- Open launches the local workspace instead of a separate Vercel tab.
- Conservative resource profile now uses a 15 MB estimated active-app threshold.
- Marketplace copy distinguishes local app code from remote catalogue metadata.

## Preserved
- Manifest V3 and minimum Chrome 103.
- No new extension permissions, dependencies, frameworks or build step.
- Vercel remains the metadata storefront and GitHub remains the source of truth.

## Verification
- JavaScript syntax parsed for `apps.js`, `app-workspace.js` and `app-frame.js`.
- Local app registry and extension manifest JSON parsed successfully.
- Browser-level iframe sandbox, theme synchronisation, PDF rendering, offline behaviour and target-device performance still require manual testing on Chrome 103.

## Not yet complete
This is not the final 3.5.0 release. The initial 12 complete apps, 40-app catalogue, redesigned Vercel storefront, app-data backup/restore and full acceptance tests remain outstanding.
