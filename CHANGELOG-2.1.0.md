# ChromeOS Efficiency Updates 2.1.0

## Dark mode
- Removed the MAIN-world `window.matchMedia()` override so websites continue to receive their real operating-system colour preference.
- Fixed dark-mode reactivation for tabs that were first visited while dark mode was disabled or excluded.
- Made detection conservative: uncertain pages are left alone rather than automatically inverted.
- Re-checks the page after load and when it is restored from the back-forward cache.
- Existing Cloudflare challenge and GitHub Codespaces exclusions remain in place.

## Wallpapers and themes
- Reworked dunes into deeper, overlapping sand formations with wind-carved highlights and a fixed dead-bush silhouette.
- Refined mountain layers with more irregular peaks, distant depth and restrained highlights.
- Added a gentle fade between wallpaper changes and when removing a wallpaper.
- Slowed landscape movement to reduce the sense of abrupt scene resets.
- Kept wallpaper colours linked to the active theme's six palette slots, so manually selected wallpapers adapt when the launcher theme changes.
- Kept all existing themes, wallpaper choices, motion controls and reduced-motion support.

## Compatibility and verification
- Manifest version: 2.1.0.
- Minimum Chrome version remains 103.
- JavaScript syntax was checked for the updated background, dark-mode detector and wallpaper engine.
- CSS changes were reviewed for balanced block structure.
- Full browser testing was not available in this editing session. Please test the unpacked extension in ChromeOS after downloading, especially repeated dark-mode toggles and wallpaper changes.
