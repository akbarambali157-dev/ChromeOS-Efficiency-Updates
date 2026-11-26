# Project Atlas Stage B — Manual QA Checklist

**Build:** Stage B Diagnostics & Testing Foundation  
**Branch:** `project-atlas-stage-b-diagnostics`  
**Purpose:** User/device checks that cannot be honestly verified by source-only or CI tests.  
**Status:** User reports completing the manual checklist on the Chromebook; details below are user-observed, not independently measured by the development agent.

## Record before testing
- Date: 26 November 2026 (reported in this conversation)
- Device: Chromebook (exact model/browser build not re-confirmed in this QA note)
- Tester: User
- Viewport/resolution: not recorded
- Extension build/version: Stage B branch / QA build (exact installed commit not confirmed)

## User-reported verification
- [x] User reports completing the manual test steps previously provided.
- [x] Task Manager was open while testing.
- [x] Memory readings were described as steady around “70k”; units and Chrome process scope were not confirmed.
- [x] User described approximately “40k” associated with Notes and related launcher features; attribution and units remain unconfirmed.
- [x] Home-screen load timing was hand-timed at approximately 2.4–2.6 seconds; stopwatch precision is limited by human start/stop reaction.
- [x] User did not report a memory increase over the observed usage in this message.

## 1. Install / launch / navigation
- [x] User reports completing the checklist section.
- [ ] No separate item-by-item evidence recorded.

## 2. Diagnostics dashboard
- [x] User reports completing the checklist section.
- [ ] No separate item-by-item evidence recorded.

## 3. Core extension smoke flows
- [x] User reports completing the checklist section.
- [ ] No separate item-by-item evidence recorded.

## 4. Background worker / extension APIs
- [x] User reports completing the checklist section.
- [ ] No separate item-by-item evidence recorded.

## 5. Performance capture (manual; device-wide metrics)
- [x] Task Manager was open during testing.
- [x] Memory reading reported stable at approximately 70k.
- [ ] Units/process scope not confirmed; do not interpret as an extension-only figure.
- [x] Home screen load time estimated at 2.4–2.6 seconds.
- [ ] Repeatable timed samples not captured in this note.
- [ ] Long-session/idle results not separately recorded.

## 6. Privacy / safe behavior
- [x] User reports completing the checklist.
- [ ] No separate privacy-report inspection evidence captured in this note.

## Result
- [x] User-reported manual QA completion; no failure reported in this message.
- [ ] Independent reproduction/evidence capture unavailable.

## Limitations
- User-reported observations are accepted for the checkpoint, but the developer agent cannot independently see the device, Task Manager units, console, or screenshots.
- The memory figures remain unconfirmed as KB/MB and cannot be attributed to one specific extension process.
- The hand-timed startup estimate is approximate.
- Browser/touch/keyboard/iframe interactions and 40 mini-app end-to-end flows are not individually documented here.

## Suggested next performance baseline
For a later optimization stage, capture 3 cold and 3 warm new-tab timings, then compare medians. If convenient, confirm Task Manager's memory units and process label; avoid repeatedly timing with a stopwatch if it adds friction.
