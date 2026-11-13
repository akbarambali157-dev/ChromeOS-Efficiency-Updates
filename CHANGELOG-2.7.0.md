# ChromeOS Efficiency Updates 2.7.0

## Reduced idle work
- Memory dashboard now uses one 30-second visible-page refresh; each refresh already includes the system-memory reading, so the separate four-second system polling timer was removed.
- Memory dashboard refreshes promptly when the page becomes visible again.
- Main launcher clock and secondary time-zone clock now update once per minute instead of every 15 seconds, matching their minute-level display precision.
- Both clocks refresh immediately when their page becomes visible again.
- No new permissions, dependencies, or background timers were added.

## Performance measurement
- Recorded the user's initial 2.6.0 idle observation of approximately 62,000 KB (about 60.5 MiB) as an unverified process-level baseline; the exact Task Manager row still needs identification.
- Expanded the measurement table to include 2.7.0 comparisons.

## Compatibility and verification
- Preserved Manifest V3 and minimum Chrome 103.
- Modified JavaScript syntax and manifest JSON validated. Live Chromebook testing and CPU measurements remain outstanding.
