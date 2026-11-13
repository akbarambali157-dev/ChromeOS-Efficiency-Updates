# My Launcher Mini-app Marketplace

The extension fetches catalogue **metadata only** from GitHub Raw. It never fetches remote JavaScript for execution inside an extension page. Each app is a normal web page hosted on GitHub Pages and opens in a separate tab, outside the extension origin and without access to `chrome.*` APIs.

An extension-side Install action stores only an app ID, pinned version, approved URL and timestamp in `chrome.storage.local`. It does not download the app package to the Chromebook. Package size describes hosted assets; local install-record size is a tiny metadata estimate. Closed apps use no runtime RAM. Citation and Markdown data are stored by the GitHub Pages origin, separately from extension storage. Export important data before clearing site data.

## Security
- Catalogue schema and publisher URL are validated before display.
- App URLs are restricted to this repository's GitHub Pages path.
- Catalogue and app data are rendered as text; no remote commands are interpreted.
- Remote code executes only as a normal hosted web page, not in the extension context.
- Apps receive no extension tokens, browser history, tabs, local storage, or extension permissions.
- App URLs are versioned (for example, /apps/v1.0.0/). Publish every release to a new version folder and never overwrite an existing version folder; the install record keeps the exact version URL, and updates require user review.

## Resource budgets
RAM is estimated incremental tab memory while running, not total Chrome process memory. CPU values represent expected idle and short-burst percentages of one logical core; they are estimates, not live telemetry. Actual use varies with content, PDF size, network results, Chrome and other tabs. Chrome Task Manager is the practical measurement reference.

For this 2 GB Chromebook: Conservative profile recommends <=20 MB estimated RAM; Balanced <=35 MB; Unrestricted permits all entries with warnings. The user can override warnings. Installing a record does not keep the app running.

## GitHub Pages setup
Enable GitHub Pages for this repository using the `main` branch and repository root as the publishing source. The catalogue is served at:
`https://raw.githubusercontent.com/akbarambali157-dev/ChromeOS-Efficiency-Updates/main/marketplace/catalogue/index.json`
Hosted app URLs in the catalogue assume:
`https://akbarambali157.github.io/ChromeOS-Efficiency-Updates/`
Verify the Pages URLs after enabling Pages before relying on the remote app launch.

## Apps
Research Library uses OpenAlex and only links open-access records. PDF Reader reads a user-selected local file. Citation Manager and Markdown Editor use origin-local browser storage. Focus Timer pauses when hidden. JSON Studio processes data locally. No pirated-copy service is included.
