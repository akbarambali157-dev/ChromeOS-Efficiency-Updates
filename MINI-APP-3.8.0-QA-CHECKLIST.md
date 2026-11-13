# My Launcher 3.7.0 — 40 mini-app manual QA checklist

**Purpose:** clear browser/device issues quickly before calling the 40-app platform complete.  
**Target:** Acer Chromebook 15 CB3-532 · Celeron N3060 · 2 GB RAM · ChromeOS 103.  
**Important:** repository syntax/schema checks are not a substitute for testing in the actual ChromeOS 103 browser.

## A. One-time platform checks

- [ ] Reload the unpacked extension from `chrome://extensions`.
- [ ] Open a new tab and open **Mini-apps**.
- [ ] Confirm the catalogue shows 40 unique apps, with no entry labelled Planned.
- [ ] Search by app name and filter every category; confirm the correct cards remain visible.
- [ ] Confirm each app card opens its detail panel and shows the description, estimated RAM, resource class, data handling and network disclosure.
- [ ] Install one light app and one app above the Conservative 15 MB estimate; confirm the threshold warning/override works.
- [ ] Launch, minimise, restore, maximise and close an app.
- [ ] Change launcher theme, accent, text size, density, contrast and reduced-motion preference while an app is open; confirm the active app updates without reload.
- [ ] Save app data, close the workspace, reopen the app and confirm the data remains.
- [ ] Install two apps, save different data in each, and confirm neither app sees the other's data.
- [ ] Uninstall one app and choose **retain data**; reinstall and confirm the data returns.
- [ ] Uninstall another app and choose **delete data**; reinstall and confirm its old data is gone.
- [ ] Export a launcher backup and restore it; confirm mini-app registrations and bounded app data survive.
- [ ] Disconnect the network and test offline-capable apps. Research Library search and QR image generation are disclosed online features.
- [ ] Open several apps one after another; confirm only one foreground app workspace is active and media/timers stop when the app is closed.
- [ ] Check Chrome Task Manager for actual memory/CPU use. Displayed per-app values are estimates, not live telemetry.

## B. App-by-app checks

### Productivity
- [ ] **Focus Timer:** start, pause, reset, minimise and hide the workspace; verify the timer pauses when hidden/minimised and resumes only after Start.
- [ ] **Quick Notes:** edit title/body, reload, load the launcher quick note, copy back to launcher note and download Markdown.
- [ ] **Mini Kanban:** add a task, move it through all three columns, send it to launcher Tasks, delete it and reopen the board.
- [ ] **Study Planner:** add sessions with valid subject/date/duration, reject invalid durations, remove a session and reload.
- [ ] **Calendar Mini:** add events with and without times, verify date ordering, remove an event and export JSON.
- [ ] **Habit Tracker:** add a habit, mark/unmark today, verify completion count, reload and delete the habit.

### Research and learning
- [ ] **Research Library:** search for a topic online, open a result, then test offline messaging.
- [ ] **Citation Manager:** save a reference, verify required title validation, export JSON and reload.
- [ ] **Flashcard Studio:** add several cards, reveal/hide answers, move to the next card and reload.
- [ ] **Quiz Builder:** add a question with four options, practise with correct and incorrect answers, and remove a question.
- [ ] **Mind Map:** set the main idea, add a root branch and a child branch, export JSON and reload.

### Documents and files
- [ ] **PDF Reader:** select a local PDF, verify it displays inside the reader, try an oversized file, close the app and reopen.
- [ ] **Markdown Editor:** type headings/lists/plain text, confirm preview escapes raw HTML, reload and download Markdown.
- [ ] **Document Studio:** insert each template, edit text, reload and download TXT/Markdown.
- [ ] **Text & CSV Viewer:** open a small TXT and CSV file, inspect the table/text preview, then verify the 2 MB limit message.
- [ ] **File Toolkit:** test trim, blank-line removal, sorting, uppercase, copy and download.

### Developer and data tools
- [ ] **JSON Studio:** format, minify, validate valid JSON, reject malformed JSON and copy output.
- [ ] **Code Playground:** update HTML/CSS preview, save/reload, confirm JavaScript is only a scratchpad and pasted scripts do not execute.
- [ ] **Regex Tester:** test a valid pattern with flags, test no matches, and verify malformed patterns show a useful error.
- [ ] **CSV Data Studio:** import a CSV under 1 MB, filter rows, inspect the table and export filtered CSV.
- [ ] **Diff Checker:** compare identical text, changed lines, inserted lines and removed lines; note that it is a simple line-position comparison, not a full Git diff.

### System and utilities
- [ ] **Advanced Calculator:** test arithmetic, powers, trigonometry, logarithms, square root and divide-by-zero handling.
- [ ] **System Monitor:** refresh device/browser information; confirm it does not claim to measure live CPU load or total RAM.
- [ ] **Storage Dashboard:** inspect app-data size, browser quota information if supported, and export JSON.
- [ ] **Unit Converter:** test length, mass, temperature, volume and time conversions, including Celsius/Fahrenheit/Kelvin.
- [ ] **QR Studio:** save a payload offline, then generate a QR image online; do not use private information because the payload is sent to the QR service.

### Creative studio
- [ ] **Colour Studio:** generate a palette, change the base HEX value and copy each colour.
- [ ] **Image Studio:** open an image under 8 MB, adjust brightness/contrast, export PNG and close the app.
- [ ] **Drawing Pad:** draw with mouse/touch, change pen colour/size, clear and export PNG.
- [ ] **Diagram Maker:** render several connected steps, export SVG and test empty input.
- [ ] **SVG Icon Studio:** create each shape, change colour/size and export SVG.

### Personal organisation
- [ ] **Expense Tracker:** add multiple expenses, verify total, remove an item and export CSV.
- [ ] **Reading Tracker:** add a book, change its status, remove it and reload.
- [ ] **Bookmark Library:** save a valid HTTPS link, open it, reject HTTP/invalid URLs and remove a bookmark.
- [ ] **Daily Journal:** save an entry, reopen it, edit the same date, save another date and download an entry.

### Media and accessibility
- [ ] **Audio Player:** select local audio, play/pause, minimise and close; verify playback stops and object URLs are released on close.
- [ ] **Video Library:** select a local video under 50 MB, play/pause, test the size limit and close.
- [ ] **Image Viewer:** select several local images, inspect the gallery, test the per-image size limit and close.
- [ ] **Text-to-Speech:** enter text, speak, pause/resume and stop; note whether ChromeOS 103 exposes a usable speech voice.
- [ ] **Accessibility Checker:** paste sample HTML with missing alt text, empty button, missing title/heading and missing landmarks; confirm it reports heuristic findings and does not claim WCAG certification.

## C. Fast issue report format

When something fails, send only:

1. **App name**
2. **Action just taken**
3. **What you expected**
4. **What happened instead** (exact error text if shown)
5. **Whether it happens again after closing and reopening**

If possible, include one screenshot of the failed app state. Test one failure at a time so it is easy to isolate.

## D. Known scope boundaries

- RAM/CPU values in the marketplace are estimates. Chrome does not expose reliable per-mini-app process telemetry here.
- QR image generation uses an optional online QR service; the payload editor and saved payload are local.
- Code Playground previews HTML/CSS in a nested sandbox. JavaScript is retained as source text and is not executed.
- Diff Checker compares line positions; it is not a full Git diff algorithm.
- System Monitor shows browser-reported capabilities, not real-time system load.
- Accessibility Checker is a basic static heuristic, not an automated WCAG audit.
- Text-to-Speech depends on speech synthesis support and voices supplied by ChromeOS/browser.
- Local media files are not uploaded and are not included in app-data backups.
