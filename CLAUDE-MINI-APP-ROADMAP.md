# Claude mini-app — file access and upgrade roadmap

**Current baseline:** My Launcher 3.5.0  
**Target device:** Acer Chromebook 15 CB3-532, 2 GB RAM, ChromeOS 103  
**Runtime constraints:** Manifest V3, classic JavaScript, no build step, no new dependency or permission without a demonstrated need.

## 1. Current implementation audit

The Claude mini-app is currently a lightweight coding workspace, not the full Claude Desktop or Claude Code runtime.

Existing capabilities:
- Text editor with up to 40 locally stored scratch files.
- Per-file attach/detach controls. Attached editor files are included in chat context.
- Up to 10 saved conversations, with bounded history sent to the model.
- Brewkeg-backed model requests and optional Parallel web search.
- Model selection in Settings.
- GitHub create/update flow with a visible diff review; the reviewed file snapshot and destination are revalidated before push.
- Separate Claude/Brewkeg and Parallel credentials, excluded from backups.

Current limitations:
- Files are created or stored in the mini-app; there is no proper Open File workflow for files already on the Chromebook.
- The separate Files page can scan a user-selected folder, but Claude does not currently consume its file handles or file contents.
- There is no project tree, directory import, PDF text extraction, patch-apply workflow, plugin manager, or MCP client.
- The current banner correctly says that VS Code extensions, Claude Code plugins and a terminal cannot be installed here. That statement must remain until a compatible, secure capability is actually implemented.

## 2. Product direction

Evolve Claude into a **lightweight, file-aware coding workspace** first, then add carefully scoped integrations. Do not attempt to recreate the full desktop Claude Code environment on a 2 GB Chromebook.

Design principles:
1. Local files are only read after an explicit user action and browser permission.
2. The user chooses exactly which files are attached to a prompt. Never silently upload a whole folder.
3. Display each attachment's name, type, size and inclusion state before sending.
4. Keep file reads bounded; never load an unbounded directory or binary file into memory.
5. Use read-only access by default. Any future write-back requires a separate review and explicit confirmation.
6. Keep credentials out of prompts, file context, logs, exports and error messages.
7. Remote tools and plugin-like integrations must use a narrow, validated broker. Never execute arbitrary JavaScript fetched from a GitHub repository.
8. Preserve Chrome 103 compatibility, offline editor functionality and the existing GitHub push review.

## 3. Release schedule

The mini-app platform is the active priority. Claude upgrades are deliberately scheduled **after all 40 mini-apps are implemented and the marketplace has passed its release QA**. Version numbers are milestones, not calendar promises. A count changes only after implementation and acceptance tests pass.

### 3.5.1 — Complete the existing 12 and deliver apps 13–20

**Primary goal:** stabilise the twelve existing apps before expanding the catalogue.

- Audit all twelve current apps for broken controls, data persistence, keyboard/touch usability, empty states, export/import and theme integration.
- Fix the existing workspace/runtime issues before adding more surface area.
- Implement the eight additions: Calendar Mini, Quiz Builder, Mind Map, Document Studio, Text & CSV Viewer, File Toolkit, Code Playground and Regex Tester. 

**Correction:** the eight additions in this milestone are Calendar Mini, Quiz Builder, Mind Map, Document Studio, Text & CSV Viewer, File Toolkit, Code Playground and Regex Tester. Habit Tracker remains in the 3.7.0 wave with the final personal-organisation group so the published catalogue count remains consistent.

**Acceptance:** 20 apps appear in the catalogue; all 20 are bundled, installable, launchable offline where declared, theme-aware, data-isolated and individually tested. No planned app is labelled installable.

### 3.6.0 — Apps 21–30

Implement: CSV Data Studio, Diff Checker, System Monitor, Storage Dashboard, Unit Converter, QR Studio, Image Studio, Drawing Pad, Diagram Maker and SVG Icon Studio.

**Acceptance:** 30 working apps, with documented input limits, local data handling, export paths, resource estimates and any unavoidable browser/network requirements.

### 3.7.0 — Apps 31–40

Implement: Habit Tracker, Expense Tracker, Reading Tracker, Bookmark Library, Daily Journal, Audio Player, Video Library, Image Viewer, Text-to-Speech and Accessibility Checker.

**Acceptance:** all 40 catalogue entries are implemented, bundled and installable. Media apps release object URLs and playback resources when closed; accessibility and speech features disclose browser support limitations.

### 3.8.0 — Marketplace-wide hardening and final 40-app QA

- Audit every app against its advertised feature list; no placeholder-only or misleading controls.
- Verify all 40 app IDs, metadata, bundled registry entries and install/open/close/uninstall flows.
- Verify theme, accent, text size, density, contrast and reduced-motion preferences in every app.
- Verify app-scoped storage, backup/restore bounds, retained/deleted data choices and offline behavior.
- Run syntax, HTML/CSS, JSON, CSP/sandbox, message-bridge and regression checks.
- Profile representative light, medium and heavier apps on the target Chromebook; retain estimates unless actual measurements are recorded.
- Publish a concise manual test checklist for the user and resolve issues found in that pass.

### 3.9.0 — Claude File Reader (only after 40-app QA)

Add user-initiated local text/code file selection, preview, bounded multi-file context and explicit attach/detach. Keep binary files unsupported unless a safe format-specific reader is added. Preserve read-only-by-default behavior and the existing reviewed GitHub write flow.

### 4.0.0 — Claude project workspace and safe integrations

Only after 3.9.0 acceptance: lazy folder browsing, reviewed patch application, curated declarative skills and carefully scoped compatible tool connections. This remains a lightweight browser workspace, not the official Claude Code CLI or unrestricted plugin runtime.

## 4. Resource and compatibility budget

These are engineering targets, not measured guarantees:
- One active Claude workspace.
- File picker import: 8 files / 1 MiB each / 4 MiB combined text by default in 3.5.1.
- Project browsing is lazy; never read all file contents on folder selection.
- Keep file buffers and context construction bounded; release temporary buffers after request completion.
- No new extension permission for the basic file-picker release unless testing proves one is essential.
- No framework, package manager or build step.
- Preserve Manifest V3 and minimum Chrome 103.

## 5. Release gates

Every release must:
- Read ARCHITECTURE.md and preserve the documented page/module and storage boundaries.
- Keep existing scratch files, conversations, model settings and GitHub review behaviour compatible.
- Validate imported data and bound all file and request sizes.
- Run JavaScript syntax checks and targeted automated tests.
- Check HTML script references and manifest validity.
- Test theme behaviour, keyboard/touch interaction and narrow layouts.
- Test on the actual Chrome 103 Chromebook before declaring device QA complete.
- Update README, architecture notes and the changelog.
- Distinguish implemented features from planned features in the UI and documentation.

## 6. Explicit product boundary

The Claude mini-app is a lightweight Brewkeg-powered coding workspace. It is not the official Claude Desktop app, Claude Code CLI, a terminal, or a full VS Code environment. Anthropic Claude Code plugins may include commands, agents, hooks and MCP servers that require runtimes unavailable in a browser extension. The mini-app will support only integrations that have been adapted to its security, permission and resource model.
