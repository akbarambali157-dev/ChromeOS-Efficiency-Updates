# My Launcher — 40-app catalogue and release roadmap

**Catalogue status:** 40 entries published; 12 bundled implementations; 28 planned.  
**Target hardware:** Acer Chromebook 15 CB3-532, 2 GB RAM, ChromeOS 103.  
**Policy:** offline-first, small packages, one foreground app by default. A planned listing is not an installable app.

## Productivity
| # | App | Status |
|---:|---|---|
| 1 | Focus Timer | Live |
| 2 | Quick Notes | Live |
| 3 | Mini Kanban | Live |
| 4 | Study Planner | Live |
| 5 | Calendar Mini | Planned |
| 6 | Habit Tracker | Planned |

## Research and learning
| # | App | Status |
|---:|---|---|
| 7 | Research Library | Live; fresh search online |
| 8 | Citation Manager | Live |
| 9 | Flashcard Studio | Live |
| 10 | Quiz Builder | Planned |
| 11 | Mind Map | Planned |

## Documents and files
| # | App | Status |
|---:|---|---|
| 12 | PDF Reader | Live |
| 13 | Markdown Editor | Live |
| 14 | Document Studio | Planned |
| 15 | Text & CSV Viewer | Planned |
| 16 | File Toolkit | Planned |

## Developer and data tools
| # | App | Status |
|---:|---|---|
| 17 | JSON Studio | Live |
| 18 | Code Playground | Planned |
| 19 | Regex Tester | Planned |
| 20 | CSV Data Studio | Planned |
| 21 | Diff Checker | Planned |

## System and utilities
| # | App | Status |
|---:|---|---|
| 22 | Advanced Calculator | Live |
| 23 | System Monitor | Planned |
| 24 | Storage Dashboard | Planned |
| 25 | Unit Converter | Planned |
| 26 | QR Studio | Planned |

## Creative studio
| # | App | Status |
|---:|---|---|
| 27 | Colour Studio | Live |
| 28 | Image Studio | Planned |
| 29 | Drawing Pad | Planned |
| 30 | Diagram Maker | Planned |
| 31 | SVG Icon Studio | Planned |

## Personal organisation
| # | App | Status |
|---:|---|---|
| 32 | Expense Tracker | Planned |
| 33 | Reading Tracker | Planned |
| 34 | Bookmark Library | Planned |
| 35 | Daily Journal | Planned |

## Media and accessibility
| # | App | Status |
|---:|---|---|
| 36 | Audio Player | Planned |
| 37 | Video Library | Planned |
| 38 | Image Viewer | Planned |
| 39 | Text-to-Speech | Planned |
| 40 | Accessibility Checker | Planned |

## Implementation waves

- **3.5.0:** the twelve current first-party apps, runtime, workspace, theme integration, scoped storage, backup/restore, storefront and release acceptance tests.
- **3.5.1:** complete the next eight apps, prioritising Calendar Mini, Quiz Builder, Mind Map, Document Studio, Text & CSV Viewer, File Toolkit, Code Playground and Regex Tester.
- **3.6.0:** complete the next ten apps, prioritising CSV Data Studio, Diff Checker, System Monitor, Storage Dashboard, Unit Converter, QR Studio, Image Studio, Drawing Pad, Diagram Maker and SVG Icon Studio.
- **3.7.0:** complete the final ten apps across personal organisation and media/accessibility.

The version targets are planning milestones. A release count changes only after each app is implemented, tested and marked live. Do not enable Install for planned entries.

## Resource policy

Estimates in catalogue metadata are planning estimates, not measured process RAM. Measure each app on Chrome 103 and the target Chromebook before promoting an estimate to a measured result. Apps should release timers, media and object URLs when closed. No planned app should run a background polling loop.

## Offline policy

The core app must work without a network unless its feature inherently requires a remote source. Research Library's fresh search is an explicitly disclosed online feature. QR camera scanning may require a user-granted camera permission. Other planned permissions and data handling must be reviewed before an app is marked live.
