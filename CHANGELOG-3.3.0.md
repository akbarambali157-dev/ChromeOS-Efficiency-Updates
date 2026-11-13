# 3.3.0 — Mini-app Expansion

## Added
- Mini-app Store page in the navigation.
- Research Library using OpenAlex public search, filtered to open-access records.
- Local PDF Reader for user-selected PDF files up to 40 MB.
- Citation Manager with locally stored APA-style references (maximum 200).
- Focus Timer with start, pause, resume and reset; timer runs only while its app is active.
- Markdown Editor with escaped preview and local draft saving.
- JSON Studio with local format and minify operations.
- Mini-app search, category filtering and locally saved favourites.

## Compatibility and privacy
- Manifest V3 and minimum Chrome 103 retained.
- No new permissions, dependencies, frameworks or build steps.
- No background polling. Mini-app code runs only on the Mini-app Store page.
- Research discovery uses OpenAlex and links to legitimate open-access landing pages; no pirated-copy access or bypass is provided.
- PDF files are opened locally in the browser tab; no upload is performed.
- Citation data and Markdown drafts remain in browser local storage.

## Verification
- Syntax, HTML script ordering, manifest and navigation checks performed before release.
