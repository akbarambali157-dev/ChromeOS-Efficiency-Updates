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

Versions are milestones, not calendar promises. A feature is marked complete only after implementation, syntax checks, regression tests and target-Chromebook QA.

### 3.5.1 — Claude File Reader

**Primary goal:** let the user open files already on the Chromebook and ask Claude to explain or work with them.

Implementation:
- Add an **Open file** control to the Claude file sidebar.
- Use a user-initiated file picker; use the Chrome 103-compatible fallback where needed.
- First support text/code formats: TXT, MD, HTML, CSS, JS, JSON, CSV, XML, YAML, Python and common source files.
- Show a preview and metadata before adding a file to the workspace.
- Add imported files to the existing editor file list with clear source labels.
- Reuse the existing per-file attach/detach control so nothing is sent without being attached.
- Support multiple selected files with a combined context budget.
- Handle unsupported binary formats honestly; do not send raw binary bytes as text.
- Add explicit limits: maximum 8 files per import action, 1 MiB per text file, 4 MiB combined imported text by default, with safe truncation warnings and a way to inspect what was omitted.
- Keep the existing 40-file workspace cap; prevent duplicate imports from creating confusing copies.
- Preserve imported content in the existing bounded editor storage and backups only after verifying backup size behaviour.
- Update the banner and help text to say that user-selected local text files can be opened; do not claim full filesystem access.

Acceptance tests:
- Open one file, several files, an empty file, a large file, an unsupported binary file and a file with Unicode text.
- Cancel the picker without changing the workspace.
- Verify no file content is sent until its attachment toggle is enabled and the user sends a message.
- Verify limits, truncation notices, storage errors and reload persistence.
- Verify credentials never appear in the attachment context.
- Verify the app still works offline for editing and viewing imported files.

### 3.6.0 — Project Workspace and Folder Reader

**Primary goal:** browse a project folder and attach selected files without turning Claude into an unrestricted file scanner.

Implementation:
- Add an explicit **Open project folder** action using the File System Access API where supported.
- Request read-only access; request write permission only in a later, separately reviewed feature.
- Build a lazy, collapsible file tree. Do not recursively read every file on folder selection.
- Let the user select individual files or a small group for import.
- Exclude common heavy/noisy folders by default (for example node_modules, .git, build output and caches), with visible explanations.
- Enforce depth, file-count, per-file and combined-context budgets.
- Remember the directory handle only where browser support permits, and show a Reconnect action when permission expires.
- Add a context panel showing included files and the estimated characters sent.
- Keep one project workspace active at a time to protect memory on the target Chromebook.

Acceptance tests:
- Permission granted, denied, revoked and re-granted.
- Large project with thousands of files; lazy listing and limits must remain responsive.
- Hidden and excluded folders; unusual filenames; nested folders.
- File changed or removed after listing; show a clear refresh/error message.
- No background scan or polling after the workspace closes.

### 3.6.1 — Safe Code Changes

**Primary goal:** move beyond advice while keeping every change reviewable.

Implementation:
- Let Claude propose a structured patch for the currently open file.
- Show additions, removals and unchanged context before applying.
- Apply only after explicit user confirmation.
- Keep undo/restore for the previous editor buffer.
- Support Save As/download first; do not silently overwrite the source file.
- Reuse the GitHub snapshot-bound review flow for repository pushes.
- Reject malformed, oversized or mismatched patches.

Acceptance tests:
- Add, remove, replace, empty-file and multi-hunk changes.
- Stale patch after editor changes must be rejected.
- Cancel leaves the original buffer untouched.
- Save/export and GitHub push operate on the exact reviewed snapshot.

### 3.7.0 — Curated Skills and Tool Connections

**Primary goal:** add useful integrations without pretending arbitrary Claude plugins can run inside this mini-app.

Implementation:
- Introduce a small, versioned capability catalogue with publisher, description, permissions, data sent, network requirements and compatibility status.
- Start with built-in prompt skills and user-invoked commands that are declarative data, not executable remote code.
- Add a narrow GitHub read integration: inspect repository files and metadata with user-selected repository scope; preserve the existing reviewed write path.
- Add optional, user-configured remote tool connections only where a compatible server and secure authentication flow exist.
- Require per-tool confirmation before a tool reads or changes user data.
- Show tool activity and results in the conversation.

Not included:
- Running arbitrary plugin JavaScript from GitHub.
- Installing VS Code extensions or terminal binaries.
- Running local plugin hooks or shell commands in the extension.
- Exposing Chrome extension APIs or stored credentials to a plugin.

Acceptance tests:
- Unknown or malformed capability definitions are rejected.
- A tool cannot exceed its declared scope.
- Tool calls require user invocation/confirmation.
- Credentials are never exposed to model-visible plugin metadata or logs.
- Disconnecting a tool removes its access.

### 3.8.0 — Compatible Plugin and MCP Catalogue

**Primary goal:** support a carefully selected subset of the wider Claude plugin ecosystem.

Implementation:
- Define a compatibility profile for this mini-app; do not label every Claude Code plugin as supported.
- Support curated skill/command packages after manifest and content validation.
- Investigate remote MCP connections through a trusted broker. Do not assume a browser extension can safely host arbitrary local MCP processes.
- Add install, enable, disable, update, remove and permission-review screens.
- Pin package versions and require review before updates.
- Keep a local allowlist and cached metadata for offline browsing; network-dependent tools clearly show offline state.
- Publish a security review checklist and a supported/unsupported integration list.

Acceptance tests:
- Malicious or malformed manifests, oversized packages, untrusted publishers and version changes.
- Permission changes require renewed consent.
- Disabled or removed integrations cannot be invoked.
- Offline catalogue fallback works without executing stale remote code.

### 3.9.0 — Workflow and Reliability Pass

**Primary goal:** make longer coding sessions manageable without increasing idle resource use.

Implementation:
- Optional task/checklist panel for multi-step coding work.
- Context manager showing included files, history size and estimated request size.
- Clear conversation export/import with schema and size validation.
- Better request cancellation, retry and recoverable error states.
- Performance pass on the 2 GB Chromebook; no background agent loops.

Acceptance tests:
- Long conversations, interrupted requests, offline/online transitions and storage quota errors.
- No credential leakage in exports.
- No idle timers or background polling.

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
