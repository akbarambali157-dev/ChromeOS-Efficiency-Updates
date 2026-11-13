# My Launcher — 40-app catalogue and release roadmap

**Current release:** 3.8.0 quality gate. Automated repository validation is being added; target-device QA remains pending.

**Catalogue status:** 40 entries published; all 40 implementations bundled and registered; final QA in progress.  
**Target hardware:** Acer Chromebook 15 CB3-532, 2 GB RAM, ChromeOS 103.  
**Policy:** offline-first, small packages, one foreground app by default. All 40 catalogue entries are bundled and locally installable; the final device QA pass is still pending.

## Productivity
| # | App | Status |
|---:|---|---|
| 1 | Focus Timer | Live |
| 2 | Quick Notes | Live |
| 3 | Mini Kanban | Live |
| 4 | Study Planner | Live |
| 5 | Calendar Mini | Live |
| 6 | Habit Tracker | Live |

## Research and learning
| # | App | Status |
|---:|---|---|
| 7 | Research Library | Live; fresh search online |
| 8 | Citation Manager | Live |
| 9 | Flashcard Studio | Live |
| 10 | Quiz Builder | Live |
| 11 | Mind Map | Live |

## Documents and files
| # | App | Status |
|---:|---|---|
| 12 | PDF Reader | Live |
| 13 | Markdown Editor | Live |
| 14 | Document Studio | Live |
| 15 | Text & CSV Viewer | Live |
| 16 | File Toolkit | Live |

## Developer and data tools
| # | App | Status |
|---:|---|---|
| 17 | JSON Studio | Live |
| 18 | Code Playground | Live |
| 19 | Regex Tester | Live |
| 20 | CSV Data Studio | Live |
| 21 | Diff Checker | Live |

## System and utilities
| # | App | Status |
|---:|---|---|
| 22 | Advanced Calculator | Live |
| 23 | System Monitor | Live |
| 24 | Storage Dashboard | Live |
| 25 | Unit Converter | Live |
| 26 | QR Studio | Live; QR rendering online |

## Creative studio
| # | App | Status |
|---:|---|---|
| 27 | Colour Studio | Live |
| 28 | Image Studio | Live |
| 29 | Drawing Pad | Live |
| 30 | Diagram Maker | Live |
| 31 | SVG Icon Studio | Live |

## Personal organisation
| # | App | Status |
|---:|---|---|
| 32 | Expense Tracker | Live |
| 33 | Reading Tracker | Live |
| 34 | Bookmark Library | Live |
| 35 | Daily Journal | Live |

## Media and accessibility
| # | App | Status |
|---:|---|---|
| 36 | Audio Player | Live |
| 37 | Video Library | Live |
| 38 | Image Viewer | Live |
| 39 | Text-to-Speech | Live; browser support dependent |
| 40 | Accessibility Checker | Live; basic heuristic checks |

## Implementation waves

- **3.5.0:** runtime foundation and the original twelve apps.
- **3.5.1:** audit/fix the original twelve and deliver Calendar Mini, Quiz Builder, Mind Map, Document Studio, Text & CSV Viewer, File Toolkit, Code Playground and Regex Tester (20 total).
- **3.6.0:** add CSV Data Studio, Diff Checker, System Monitor, Storage Dashboard, Unit Converter, QR Studio, Image Studio, Drawing Pad, Diagram Maker and SVG Icon Studio (30 total).
- **3.7.0:** add Habit Tracker, Expense Tracker, Reading Tracker, Bookmark Library, Daily Journal, Audio Player, Video Library, Image Viewer, Text-to-Speech and Accessibility Checker (40 total).
- **3.8.0:** run automated inventory/security/syntax checks, then complete marketplace-wide regression, accessibility, storage, offline, security and target-device QA. Release remains QA-in-progress until the Chromebook checks are completed.
- **3.9.0:** begin the Claude file-reader upgrade only after the 40-app QA gate passes.

The current 3.7.0 implementation candidate registers all 40 apps as bundled. A release count is not a claim of target-device verification: the 3.8.0 gate must still validate every app on Chrome 103 and the target Chromebook. QR image generation is an optional online feature; its payload editor remains local. Code Playground intentionally does not execute user JavaScript.

## Resource policy

Estimates in catalogue metadata are planning estimates, not measured process RAM. Measure each app on Chrome 103 and the target Chromebook before promoting an estimate to a measured result. Apps should release timers, media and object URLs when closed. No planned app should run a background polling loop.

## Offline policy

The core app works without a network unless its feature inherently requires a remote source. Research Library search and QR image rendering are disclosed online features. QR Studio stores the payload locally but sends it to the QR image service when the user chooses Generate. Text-to-Speech depends on the browser's available speech engine and voices.
