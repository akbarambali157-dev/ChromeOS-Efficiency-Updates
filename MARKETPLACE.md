# My Launcher Mini-app Marketplace

The extension fetches catalogue **metadata only** from GitHub Raw. It never fetches remote JavaScript for execution inside an extension page. Each app is a normal web page hosted on Vercel and opens in a separate tab, outside the extension origin and without access to `chrome.*` APIs.

The static storefront and versioned apps are deployed from the `marketplace/` directory of this repository to Vercel. The Vercel project is linked to the repository's `main` branch, so commits to that branch trigger deployments. GitHub remains the source of truth; the extension reads the catalogue from:

`https://raw.githubusercontent.com/akbarambali157-dev/ChromeOS-Efficiency-Updates/main/marketplace/catalogue/index.json`

The production site is:

`https://chromeos-efficiency-marketplace.vercel.app/`

An extension-side Install action stores only an app ID, pinned version, approved URL and timestamp in `chrome.storage.local`. It does not download the app package to the Chromebook. Package size describes hosted assets; local install-record size is a tiny metadata estimate. Closed apps use no runtime RAM. Citation and Markdown data are stored by the Vercel origin, separately from extension storage. Data previously saved on the old GitHub Pages origin is not automatically migrated; export it from that origin before switching if you need to keep it.

## Security
- Catalogue schema and publisher URL are validated before display.
- App URLs are restricted to the versioned Vercel marketplace path.
- Catalogue and app data are rendered as text; no remote commands are interpreted.
- Remote code executes only as a normal hosted web page, not in the extension context.
- Apps receive no extension tokens, browser history, tabs, local storage, or extension permissions.
- App URLs are versioned (for example, `/apps/v1.0.0/`). Publish every release to a new version folder and never overwrite an existing version folder; the install record keeps the exact version URL, and updates require user review.

## Resource budgets
RAM is estimated incremental tab memory while running, not total Chrome process memory. CPU values represent expected idle and short-burst percentages of one logical core; they are estimates, not live telemetry. Actual use varies with content, PDF size, network results, Chrome and other tabs. Chrome Task Manager is the practical measurement reference.

For this 2 GB Chromebook: Conservative profile recommends <=20 MB estimated RAM; Balanced <=35 MB; Unrestricted permits all entries with warnings. The user can override warnings. Installing a record does not keep the app running.

## Deployment
- Vercel project: `chromeos-efficiency-marketplace`
- Git repository: `akbarambali157-dev/ChromeOS-Efficiency-Updates`
- Production branch: `main`
- Project root directory: `marketplace`
- No framework, build command, dependencies or environment variables are required for this static site.
- The GitHub Pages deployment is no longer the active hosting target.

## Apps
Research Library uses OpenAlex and only links open-access records. PDF Reader reads a user-selected local file. Citation Manager and Markdown Editor use origin-local browser storage. Focus Timer pauses when hidden. JSON Studio processes data locally. No pirated-copy service is included.
