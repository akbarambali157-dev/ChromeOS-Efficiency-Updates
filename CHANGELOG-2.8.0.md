# My Launcher 2.8.0 — Interface refinement

This release improves keyboard navigation, assistive-technology labels and touch interaction without adding runtime work.

## Changes
- Added a keyboard-accessible “Skip to dashboard content” link that appears when focused.
- Standardised visible keyboard focus outlines across links, buttons, inputs, selects, textareas and other focusable controls, including components with older outline-reset rules.
- Added descriptive accessible names to shortcut edit and remove buttons, including each shortcut's name.
- Increased button and shortcut-management touch targets on coarse-pointer devices while retaining the compact desktop layout.
- Improved narrow-screen wrapping for wallpaper collection and custom-colour controls.
- Updated project and extension version metadata to 2.8.0.

## Performance and compatibility
- No new JavaScript timers, event polling, permissions, dependencies or background work.
- Existing animation and reduced-motion behaviour is unchanged.
- Minimum Chrome version remains 103.
- Changes are limited to the dashboard interface and documentation.

## Verification
- Static source and manifest checks are required before treating this release as complete.
- Actual ChromeOS keyboard, touch, screen-reader and Task Manager checks require the target Chromebook; they are not claimed as completed here.
