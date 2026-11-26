# Project Atlas Stage B — Manual QA Checklist

**Build:** Stage B Diagnostics & Testing Foundation  
**Branch:** `project-atlas-stage-b-diagnostics`  
**Purpose:** User/device checks that cannot be honestly verified by source-only or CI tests.  
**Status:** Prepared; awaiting manual browser/device execution.

## Record before testing
- Date/time:
- Device:
- Chrome/ChromeOS version:
- Extension build/version:
- Viewport/resolution:
- Tester notes:

## 1. Install / launch / navigation
- [ ] Load extension from this branch (Developer mode → Load unpacked).
- [ ] Open new-tab launcher; page loads without obvious errors or missing styling.
- [ ] Sidebar buttons are usable with mouse and touch; labels/targets are correct.
- [ ] Diagnostics entry opens the diagnostics page and active navigation state is correct.
- [ ] Home, mini-apps, GitHub, Drive, Brewkeg, Sessions, Memory, Files and Claude pages open.
- [ ] Popup opens and its controls respond.
- [ ] Workspace iframe opens, minimizes/maximizes, and closes cleanly.

## 2. Diagnostics dashboard
- [ ] Dashboard renders on a narrow screen and at 1366×768 without horizontal overflow.
- [ ] Run button disables while checks run and re-enables after completion.
- [ ] Checks finish and summary totals match the displayed check statuses.
- [ ] Pass/warn/fail/skipped/not-run states are distinct in text (not color-only).
- [ ] A deliberately unavailable check is labeled unavailable/skipped, not passed.
- [ ] Runtime error capture is bounded and report generation remains usable after an error.
- [ ] Copy report works, or gives a usable fallback message.
- [ ] Save report downloads a text file with the expected filename.
- [ ] Report is reviewed before sharing; verify no credentials or sensitive content.
- [ ] Repeat scan works and does not create duplicate cards or persistent background work.

## 3. Core extension smoke flows (non-destructive)
- [ ] Search box accepts text, suggestions/submit behave.
- [ ] Workspace selector opens, selects, saves and reports status.
- [ ] Mini-app catalogue filters/searches and opens an app.
- [ ] Session list can be viewed; avoid destructive restore/close actions.
- [ ] Files page opens; do not move/copy user files during this checklist.
- [ ] Memory page refreshes and displays supported metrics without claiming extension-only RAM.
- [ ] Claude workspace pane selectors are tappable and switching panes works.
- [ ] Selector controls are large enough to tap reliably.

## 4. Background worker / extension APIs
- [ ] Diagnostics safe ping returns success.
- [ ] Worker remains responsive after opening/closing several extension pages.
- [ ] No persistent polling/work begins merely by opening Diagnostics.
- [ ] Browser console has no new uncaught errors or promise rejections.

## 5. Performance capture (manual; device-wide metrics)
Capture readings with Chrome Task Manager (Shift+Esc) or another supported browser surface. Do not attribute total browser/device RAM to the extension.
- [ ] Cold new-tab launch latency: ______
- [ ] Warm launch latency (3 samples): ______ / ______ / ______
- [ ] Diagnostics scan duration: ______
- [ ] Idle memory reading (browser/device scope): ______
- [ ] During typical launcher interactions memory reading: ______
- [ ] Responsiveness notes (lag, stutter, freezes): ______
- [ ] After opening/closing 5 apps, note any sustained growth: ______
- [ ] Wait 60 seconds with Diagnostics idle; confirm no obvious recurring activity: ______

## 6. Privacy / safe behavior
- [ ] Quick scan makes no network requests beyond local extension-resource checks.
- [ ] Provider/API credentials are not read, sent, displayed or tested.
- [ ] Storage usage is an estimate; no saved storage values were inspected or modified.
- [ ] Report redaction is treated as defense-in-depth and manually reviewed.
- [ ] Report does not contain page content, prompts, files, browsing URLs or secrets.

## Result
- [ ] Pass
- [ ] Pass with warnings
- [ ] Blocked
- [ ] Fail — requires fix

**Issues / evidence:**  
(Record only sanitized error messages, affected control/page, and reproduction steps. Do not paste keys, user content, or private URLs.)

## Known limitations at this checkpoint
- CI/source contracts do not simulate touch, keyboard focus, modal interaction, iframe behavior, or actual app workflows.
- The Diagnostics page itself has not been run on the target Chromebook by the development agent.
- Live provider checks and credential validation are intentionally excluded.
- Memory/CPU figures are device-wide or unavailable; they are not extension-attributed.
- Not all mini-apps have end-to-end coverage. Use the existing mini-app QA checklist as a separate pass.
