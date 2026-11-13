# ChromeOS Efficiency Updates 2.4.0

## Optional assistant context
- Added an off-by-default setting to share selected launcher context with general AI questions.
- When enabled, the assistant can use the active shortcut workspace name, shortcut labels, task titles and aggregate file-scan totals.
- Context is read only when a general AI question is sent; local commands continue to run locally.
- Supplied context is treated as untrusted reference data, not instructions.
- File contents, filenames, quick notes, API keys and GitHub credentials are not included.
- The context preference is included in validated backup/restore settings.

## Compatibility and verification
- Preserved Manifest V3 and minimum Chrome 103.
- Browser runtime testing on ChromeOS is still required.
