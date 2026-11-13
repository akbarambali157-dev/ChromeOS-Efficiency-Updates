# ChromeOS Efficiency Updates 2.2.0

## Productivity
- Added a lightweight task list to the home page.
- Tasks support completion, deletion, optional due dates, overdue indicators and automatic local saving.
- Task data is included in backup export and validated during backup import.
- Added a command-bar action to jump directly to the new-task field.
- Kept the existing quick note, session manager and command-bar search; the command bar already searches shortcuts, open tabs, bookmarks and browsing history.

## Reliability and compatibility
- Capped the task list at 100 items to keep storage and rendering predictable on low-memory devices.
- Limited task titles and validates imported task dates and fields.
- Updated project and extension version metadata to 2.2.0.
- Minimum Chrome version remains 103.
- Existing dark-mode and wallpaper work from 2.1.0 is preserved.

## Verification
- JavaScript syntax, manifest JSON, HTML insertion points and CSS block balance were checked.
- Browser runtime testing on ChromeOS is still required; this release has not been exercised on the target Chromebook in this editing session.
