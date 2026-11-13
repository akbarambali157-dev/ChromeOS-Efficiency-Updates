# Performance baseline and Chrome Task Manager guide

The goal for version 3.0 is to have repeatable, real-device CPU and memory readings for My Launcher on the target Chromebook. Do not substitute estimates or JavaScript heap figures for Task Manager measurements.

## What to measure

Chrome Task Manager reports process-level resource use. Depending on Chrome's process layout, the dashboard tab and extension service worker may appear as separate rows or share a process. Record the row labels exactly as shown and avoid adding the same shared process twice.

Record:
- ChromeOS and Chrome version
- Extension version
- Number of open tabs and windows
- Whether the launcher tab is the active tab
- Wallpaper and motion settings
- Whether the assistant panel is open
- Memory footprint (MB) and CPU (%)
- Whether the reading is idle or during a specific interaction

## Open Task Manager

1. Open Chrome.
2. Press **Search + Esc** on a Chromebook, or open Chrome's menu and choose **More tools → Task Manager**.
3. If available, show the **Memory footprint** and **CPU** columns.
4. Find the launcher/new-tab row and any row labelled for the My Launcher extension or its service worker.
5. Record each relevant row separately. Do not use the browser's total memory as if it were the extension's memory.

## Repeatable baseline procedure

1. Restart Chrome and wait two minutes after the browser settles.
2. Open one new tab with My Launcher and leave it idle for 60 seconds.
3. Record memory footprint and CPU at roughly 15-second intervals for one minute. Use the median of the readings as the idle baseline.
4. Open the assistant panel, use the command bar, and switch between settings and the memory page. Record the highest sustained readings during each action.
5. Close extra launcher tabs, wait one minute, and record whether resource use settles.
6. Repeat the same steps after each major release, with the same tab count and settings.

For a useful comparison, take three runs and keep the median for each condition. A single short CPU spike is not a meaningful sustained-CPU result.

## Measurement cautions

- Task Manager's **Memory footprint** is the primary process-level measure for this project.
- The Memory page's performance.memory values are JavaScript heap estimates for individual pages. They are not total process memory and are not a replacement for Task Manager.
- ChromeOS system memory usage includes Chrome, the operating system, and other processes. It is useful context, not the extension's own footprint.
- CPU usage changes with page activity, background tabs, network responses and browser scheduling. Record the test condition alongside every reading.
- Do not claim that the extension uses a particular number of MB or CPU percent until those readings have actually been collected on the Chromebook.

## Blank results sheet

| Version | Condition | Launcher tabs | Relevant Task Manager row | Memory (MB) | CPU (%) | Notes |
| --- | --- | ---: | --- | ---: | ---: | --- |
| 2.6.0 | Idle, 60 seconds | 1 | | | | |
| 2.6.0 | Assistant panel open | 1 | | | | |
| 2.6.0 | Settings / wallpaper interaction | 1 | | | | |
| 2.6.0 | Several launcher tabs | | | | | |
| 3.0.0 | Idle, 60 seconds | 1 | | | | |
| 3.0.0 | Assistant panel open | 1 | | | | | |
| 3.0.0 | Settings / wallpaper interaction | 1 | | | | | |
| 3.0.0 | Several launcher tabs | | | | | |
