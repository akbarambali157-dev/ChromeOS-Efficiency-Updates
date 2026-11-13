# ChromeOS Efficiency Updates 2.6.0

## Reliability and background-work improvements
- Automatic tab suspension now creates its one-minute alarm only while the feature is enabled. Turning it off removes the alarm, avoiding unnecessary periodic tab and session-storage queries.
- Tab inactivity tracking now records activation timestamps, preserves them while tabs remain open, and removes entries when tabs close.
- Suspension intervals are constrained to the supported 10, 20, 30 and 60 minute options, including imported backup data.
- Settings changes immediately reconfigure the scheduler; backup restoration also re-registers it.
- Chat and web-search relays now validate credential and payload types and reject oversized requests before sending them to their fixed provider endpoints.
- The service worker ignores messages that do not originate from this extension.

## Security and performance documentation
- Documented that provider credentials are stored in Chrome extension local storage, excluded from backups, and not an encrypted password vault.
- Added a repeatable Chrome Task Manager measurement guide for the version 3.0 CPU and memory comparison.

## Compatibility and verification
- Preserved Manifest V3 and minimum Chrome 103.
- Added no permissions or dependencies.
- Modified JavaScript syntax and manifest validation passed. Live Chromebook Task Manager measurements and browser runtime tests remain outstanding.
