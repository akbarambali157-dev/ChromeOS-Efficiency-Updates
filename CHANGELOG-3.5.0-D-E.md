# 3.5.0-D/E — Storefront, Launcher Integration and Backup

## Added
- Rebuilt the Vercel storefront with responsive cards, search, category filters, sorting, resource estimates and clear installation guidance.
- Published twelve app metadata entries and distinguished the live twelve from the 40-app target.
- Added launcher-note read/copy actions for Quick Notes.
- Added an explicit Mini Kanban action to send a selected task to the launcher's task list.
- Added launcher theme synchronisation for custom accents, text size, density, high contrast and reduced motion.
- Added app registrations, favourites, resource profile and app-scoped IndexedDB data to launcher backup/restore.
- Added per-app data limits and a 1.5 MB total mini-app backup limit.
- Older backups without miniAppData preserve existing local mini-app data.

## Security and data handling
- The app frame remains sandboxed without allow-same-origin.
- Its CSP denies direct network access; the OpenAlex request remains a narrow launcher-side relay.
- Shared launcher actions are explicit and limited to the note and task operations documented in the architecture.
- App data is validated before restore and stored by app ID in IndexedDB.
- Credentials remain excluded from backups.

## Verification
- Syntax checks passed for the changed extension and storefront JavaScript.
- Registry, catalogue and manifest JSON parsed successfully.
- Vercel production deployment for the redesigned storefront and 40-entry catalogue reached READY. The production homepage and catalogue were fetched successfully (HTTP 200), and the deployed catalogue contained 40 entries (12 live, 28 planned).
- Browser-level tests on Chrome 103 and the actual 2 GB Chromebook remain necessary.

## Remaining
- Expand the catalogue from twelve working apps toward the 40-app target.
- Complete final integration, offline and storage recovery acceptance tests.
- Bump the extension manifest version only after the complete 3.5.0 release gates pass.
