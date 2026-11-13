# ChromeOS Efficiency Updates 2.5.1

## Wallpaper collections and lightweight automation
- Added up to 8 named wallpaper collections, each holding up to 20 unique built-in wallpapers.
- Added manual next-wallpaper selection, collection deletion, and an optional rotation switch.
- When enabled, rotation advances once as a new-tab page starts. It uses the active collection and a saved index; no timer, alarm, or background polling is used.
- Collection data, active collection, rotation preference and index are included in validated backups.
- User photos remain available as individual wallpapers; collections intentionally contain built-in scenes only, avoiding duplicated large image data in backups.

## Compatibility and verification
- Preserved Manifest V3 and minimum Chrome 103.
- Added no permissions and no background worker tasks.
- Static checks are required before release. Live ChromeOS runtime testing remains outstanding.
