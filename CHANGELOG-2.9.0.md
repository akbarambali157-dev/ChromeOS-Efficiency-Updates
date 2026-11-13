# My Launcher 2.9.0

## Reliability and data integrity

- Wallpaper rotation now derives its next item from the currently saved wallpaper, rather than relying on one global index. Switching collections with different orders or lengths no longer carries an unrelated index into the next collection.
- Backup import rejects unsupported backup versions, malformed data roots and files larger than 20 MB before parsing.
- Claude usage-session data is normalized during import: bounded session/model counts, bounded text fields, and finite non-negative counters.
- Backup restore writes validated data before removing keys omitted from the backup. A failed write therefore no longer begins by deleting the user's existing settings.
- Restore reports storage errors instead of silently reloading after an unsuccessful write or cleanup.

## Compatibility and performance

- Manifest V3 retained.
- Minimum Chrome version remains 103.
- No new permissions, host permissions, dependencies, frameworks, timers or background polling.
- Existing features, settings keys and backup format version 1 remain supported.

## Validation performed

- Manifest JSON parsed successfully.
- Changed JavaScript files passed syntax checks.
- Wallpaper rotation logic and backup validation paths were checked against the current source.
- Version references and release notes updated.

No memory or CPU improvement is claimed without repeatable Task Manager measurements on the target Chromebook.
