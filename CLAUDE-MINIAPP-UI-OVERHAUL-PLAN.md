# Claude Mini App — Comprehensive UI/UX Overhaul Plan

**Status:** APPROVED SCOPE — all features, design directions, and additional ideas in this plan have been approved by the user for inclusion in the overhaul plan and future implementation.
**Plan owner:** Project maintainer
**Target:** Claude Mini App within ChromeOS Efficiency Updates
**Plan type:** Major redesign and usability/performance initiative
**Implementation status:** Not started; this document records the approved scope and is not evidence that any feature has already been implemented.
**Design priority:** Premium, coherent, highly interactive, accessible, responsive, and lightweight on the target Chromebook.

> This is the master specification for the Claude Mini App redesign. Existing capabilities must be preserved, audited, and integrated. Implementation should be staged, verified, and regression-tested; no feature should be declared complete solely because its UI has been coded.

## Target hardware and constraints

- Acer Chromebook 15 CB3-532, board `banon`
- Intel Celeron N3060, 2 GB RAM, 16 GB eMMC
- 1366×768 display
- ChromeOS 103
- Mobile usage also matters; responsive behavior must be designed, not merely scaled down.
- Avoid heavyweight frameworks/libraries, unnecessary background activity, excessive blur, huge assets, expensive animation loops, and simultaneous loading of every mini-app.
- Respect reduced-motion settings and support a low-performance mode.

## 1. Vision and design principles

Create a cohesive AI work environment that combines conversational AI, coding/file work, research, writing/creative tools, project organization, and knowledge/reference management.

Principles:
- Clean and uncluttered; clear visual hierarchy and readable typography.
- Premium but restrained visual treatment: graphite/neutral surfaces, carefully chosen accent color, consistent elevation and borders.
- Dark-first design, with light mode equally considered if available.
- Interactive, responsive feedback across touch, mouse, and keyboard.
- Context-aware and adaptive; workspace can reflect task type.
- Integrated; specialized areas should not feel like disconnected apps.
- Transparent; status, progress, errors, and completed operations must be truthful.
- Lightweight; sophisticated visuals must not compromise performance.

## 2. App shell and layout

### Workspace zones
1. **Top bar:** app/workspace identity, conversation or project name, rename, model selector, effort selector where supported, provider/connection status, share/export if supported, overflow menu.
2. **Sidebar:** new chat, global search, home, projects, AI Teams, Research, Creative Lab, Reference Lab, files/artifacts, pinned and recent chats, settings.
3. **Main canvas:** conversation, editor, artifact, report, or task results.
4. **Composer:** prompt, attachments, context, tools, model/effort, send/stop.
5. **Context/activity layer:** task state, context sources, background activity, notices.

### Top bar UX
- Model and effort controls are visible and discoverable, not buried in settings.
- Show connection/provider health.
- Keep secondary actions in menus to avoid crowding.
- Use restrained transitions when switching workspace/model.
- Avoid claiming provider health beyond actual connection signals.

## 3. Navigation and sidebar

- Collapsible sidebar and icon-only mode.
- Mobile drawer with accessible dismissal.
- Unified navigation between Chat, Projects, AI Teams, Research, Creative Lab, Reference Lab, Files/Artifacts, Settings.
- Conversation history grouped by time (Today, Yesterday, Previous 7 Days, etc.).
- Conversation search across title and content, where supported.
- Pin, rename inline, delete with confirmation, contextual menus, bulk selection where practical.
- Active conversation is clearly indicated.
- Preserve scroll position and relevant state during navigation.
- Provide loading, empty, and no-results states.
- No unnecessary new tabs; keep navigation within the current app tab.
- Touch interactions must not depend on hover.

## 4. Chat interface

### User messages
- Clear message distinction and subtle containers.
- Readable width and spacing; avoid full-width text lines.
- Expand/collapse long prompts.
- Attachment previews and file metadata.
- Copy, edit, retry/resubmit actions as supported.
- Optional timestamp.
- Preserve prompt contents during edits/retries.

### Assistant messages
- Strong hierarchy for headings, paragraphs, lists, tables, quotes, inline code, code blocks, math, citations, images, tool results, and artifacts.
- Readable long-form responses and sensible content width.
- Response actions: copy, regenerate, continue, revise, export, save to project/files, read aloud if available, report issue as supported.
- Desktop hover actions; touch-friendly compact action menu.
- Avoid turning long responses into visually overwhelming blocks.

### Conversation continuity
- Draft preservation.
- Continue interrupted/limited outputs.
- Resume work when supported.
- Save important responses, pin/bookmark messages.
- Conversation checkpoints and branching/new related conversation from a message, if architecture supports it.
- Maintain context when switching workspaces.

## 5. Composer overhaul

- Expandable multiline input; handle large prompts without artificial UI character limits.
- Autosave drafts and preserve cursor position.
- Undo/redo where browser/editor supports it.
- Clear focus state, scroll only when necessary.
- Enter-to-send / Shift+Enter newline, configurable.
- Attach files, images, project context, references; drag-and-drop and clipboard paste where supported.
- Attachment preview, progress, ready/error states, remove controls.
- Distinguish selected files from successfully uploaded/available context.
- Model, effort, tools, research toggle (only if supported), send and stop controls.
- Preserve draft when switching conversations; warn only when genuinely discarding unsent content.
- Send becomes Stop during generation; stopping must not erase the draft.
- Context usage/status indicator where available.
- Composer modes/shortcuts: Chat, Code, Research, Creative. These are contextual presets, not separate AI engines or hard barriers; user can override them.
- Modes should select useful tools/context presentation but avoid silently changing model behavior.

## 6. Ida — signature activity/loading experience (approved)

Preserve and develop the previously proposed **Ida** animated waiting/activity centerpiece. Do not replace it with a generic spinner.

### Visual
- Luminous core, subtle orbit/rings, restrained particles, flowing light, breathing glow, gentle state transitions.
- Avoid running every visual effect simultaneously.
- GPU-friendly CSS/limited rendering; no heavy video or costly loops.
- Adapt color/motion modestly to actual activity states.
- Reduced-motion and low-performance alternatives.
- Suspend/pause animation when hidden or no longer relevant.

### States
- Idle (quiet motion)
- Thinking/generating
- Researching (only while research activity is actually underway)
- Building/writing files (only while actual file operations are underway)
- Finalizing, if a real finalization stage exists
- Completed, failed, canceled

### Activity information
- Task description.
- Current actual activity.
- Elapsed time.
- Completed steps and current stage, when observable.
- Stop/cancel.
- Expand details.
- Minimize/background activity where supported.
- Smooth transition from activity state to final response.

### Truthfulness rules
- Never invent progress percentages, stages, tool activity, or completed milestones.
- Use verified events/statuses only.
- Do not expose private chain-of-thought. Show observable operations and concise status summaries instead.
- Stop animation and transition appropriately when task ends.

## 7. Coding and writing-directly-to-files workspace (major priority)

Upgrade file-writing from a buried chat tool into a first-class workspace, integrated with the existing selected-folder/project file foundation. Do not create a competing file system.

### Workspace structure
- Left: project/file tree.
- Center: editor, preview, or diff.
- Optional right: AI activity/task panel.
- Resizable panels and collapsible right-side activity.
- On mobile: file tree and activity become drawers/sheets; editor uses full width; no cramped three-column layout.

### File explorer
- Expand/collapse folders, readable indentation.
- Extension-aware file icons and folder icons.
- Active-file highlighting, modified markers.
- Create file/folder, rename, delete with confirmation, copy path, open/reveal, refresh.
- Search and file-type filtering.
- Resizeable tree panel.
- Context menus; avoid action-button clutter.
- Touch-friendly targets and no hover-only controls.
- Loading, empty, inaccessible-folder, and error states.

### AI file task workflow
1. User describes change/create/fix/refactor task.
2. AI inspects relevant files and project structure.
3. For large/risky tasks, show a change plan.
4. AI edits/writes project files through the existing approved file capability.
5. Show per-file operation status and summary.
6. Review changes in a diff.
7. Run relevant validation, report exact outcomes.

### Live file activity
Show actual operations, such as reading files, creating files, writing, checking imports, running tests. Each operation has truthful state: queued, in progress, completed, failed, skipped, awaiting approval. Clicking opens relevant file/details. No fabricated progress.

### Diff/change review
- Before/after comparison.
- Added, removed, modified lines.
- Side-by-side and inline modes.
- File-level summaries and line numbers.
- Jump to changed sections.
- Revert a file or a change when safe.
- Restore prior snapshot.
- Copy or download updated file.
- Clearly distinguish staged/accepted/current state where applicable.

### Editor enhancements (only after feasibility/performance audit)
- Syntax highlighting.
- Line numbers.
- Search/find and replace.
- Copy/select all.
- Undo/redo.
- Indentation.
- Bracket matching.
- Tabs.
- Dirty-file markers.
- Read-only mode for protected files.
- Word wrap.
- Fullscreen.
- Language detection.
- Safe handling of large files.
- Do not add a heavyweight editor without testing Chromebook memory/performance and bundle impact.

### File operation safety
- Explicit policy for overwrite and destructive changes.
- Conflict detection when files change since AI read them.
- Snapshots/backups for risky operations.
- Path safety: prevent unintended access outside selected project.
- Preserve encoding and line endings where feasible.
- Report partial successes accurately.
- Show exact files successfully written.
- Never claim save/write succeeded before confirmation.
- Recover from interruption and partial failure.
- Warn and confirm destructive actions.
- Recovery options after failure.

## 8. Projects and context

### Project workspace
- Project name, description, instructions.
- Files, conversations, references, artifacts, tasks, activity, settings.
- Dashboard with shortcuts to conversations/files/knowledge/activity.
- Persistent project instructions and context sources.
- Project-specific conversations and artifacts.

### Context management
- Clearly distinguish project context from conversation context.
- Context Inspector shows sources: conversation, project instructions, project files, attached documents, Reference Lab items, research sources, tool results, relevant saved context.
- Context cards show source, type, availability/status, preview/open, remove from current context (not delete original).
- Context health: ready, partially loaded, unavailable, unsupported, approaching limit, truncated, too large.
- Context size/priority awareness where possible.
- Do not imply that a source was used by the model if it was merely selected or displayed.

### Checkpoints/continuity
- Checkpoint captures goal, completed work, decisions, files changed, remaining tasks, and resume context.
- Resume interrupted tasks/conversations where supported.
- Preserve project context and drafts.
- Avoid requiring users to repeatedly explain project state.

## 9. AI Teams

- Team dashboard with identity, purpose, members, roles, models/providers, task assignments, shared context, configuration, history.
- Agent/member cards show role, model, assigned task, status, time if available, concise output preview.
- Execution timeline: task received, plan/decomposition, assignments, work, collection, review, synthesis.
- Accurately distinguish parallel and sequential execution.
- Team result comparison: agreements, disagreements, missing information, unique contributions, reviewer findings, final synthesis.
- Controls: pause, resume, cancel, retry failed member, rerun stage if supported, edit assignments before run, export report.
- Show concise conclusion/evidence summaries, not private reasoning.

## 10. Research workspace

- Research question, status, real search activity, sources, findings, report, follow-ups.
- Source cards: title, domain, link, type, publication date when available, access status, relevance only if actually calculated, extracted information.
- Source actions: open, preview, copy URL, save to Reference Lab, remove.
- Optional visualizations when useful: topic maps, timelines, comparison tables, evidence matrices, source relationships.
- Report view: executive summary, key findings, detailed analysis, evidence, contradictions, limitations, sources, conclusion.
- Toggle Chat View/Report View without losing conversation.
- Never fake source verification or progress.

## 11. Creative Lab

- Landing shortcuts: start writing, brainstorm, story, improve existing writing, characters, worldbuilding, concepts, outline, tone/style rewrite, project.
- Ongoing project workspace: overview, characters, notes, outline, chapters, world information, timeline, saved prompts, drafts, history.
- Writing mode: spacious editor, distraction-free mode, AI suggestions, selection-based editing, expand/shorten/rewrite/improve, tone adjustments, outline, version history, compare revisions, save/export.
- Selection toolbar: improve, expand, simplify, explain, rewrite, continue, ask AI.
- Preserve project context and drafts.

## 12. Reference Lab / knowledge library

- Collections, documents, saved research, links, notes, files, tags, recently accessed, favorites.
- Reference cards: title, type, preview, description, tags, date, collection, source, actions.
- Search and organize.
- Attach references to chats/projects; select collections as context; inspect references used; remove from current context without deleting library item.
- Save answers/generated artifacts as references.
- Avoid reuploading same reusable documents where supported.

## 13. Artifacts and generated outputs

- Dedicated workspace for substantial documents/code/HTML/Markdown/tables/data/reports/plans/images.
- Artifact title/type, preview, edit, copy, download, save, version, related conversation.
- Document: readable preview; code: editor; HTML: preview/source; Markdown: rendered/source; table: interactive table; report: structured report; plan: step/task view; image: preview/controls.
- Artifact versioning: draft/revised/final labels, compare versions, restore previous version, trace origin conversation.
- Avoid forcing long artifacts into a chat scroll.

## 14. Settings redesign

Categories:
- General: language, default landing, startup, shortcuts, notifications.
- Appearance: dark/light/system, accent, density, font size, animation intensity, reduced motion.
- AI & models: provider/model defaults, effort, generation preferences, availability, provider health.
- Chat: enter/send, response formatting, draft, history.
- Files & workspace: selected directory, file behavior, autosave, editor, preview, safety.
- Research: research/source/citation preferences.
- Projects & context: project behavior, references, context controls.
- Privacy & data: data controls, conversations, storage.
- Advanced: diagnostics, performance, debug, reset.

Settings UX: search, category navigation, descriptions, immediate feedback, reset setting/category, confirmations for destructive actions, progressive disclosure of advanced options.

## 15. Errors, diagnostics and recovery

Classify errors and make recovery actionable:
- Provider unavailable/configuration error.
- Timeout/network disconnect.
- Empty or incomplete response.
- Output token limit/truncation.
- Research failure.
- File write/operation failure.
- Parsing failure.
- Tool failure.
- Rate limiting.
- Partial completion.

Error detail drawer may show category, provider/model, stage, timestamp, safe technical details, retry status, diagnostic ID. Keep stack traces out of primary UI but provide technical detail for troubleshooting.

Recovery actions (only if supported): retry, continue, resume, switch model, edit prompt, copy partial output, diagnostics, report issue. Preserve partial results and work. Don't claim entire task succeeded if only part succeeded.

## 16. Contextual notifications and activity

- Toasts for minor events: upload, save, rename, copy, export, setting changes.
- Persistent notices for ongoing/attention tasks: background work, interrupted writes, failed operations, disconnected provider, unsaved work, recoverable state.
- Avoid notification stacking, interrupting active writing, or dismissing critical errors too soon.
- Use action buttons where appropriate.

## 17. Micro-interactions and motion system

Consistent interaction states:
- Hover, focus, pressed, disabled.
- Subtle card elevation.
- Sidebar transitions.
- Direction-aware menus.
- Dialog entry/exit.
- Tab indicator.
- Loading skeletons only when appropriate.
- Copy success feedback.
- Safe optimistic UI only for reversible operations.
- Drag/drop feedback.
- Panel transitions.
- Stable chat scroll.

Motion mapping:
- Button: subtle press.
- Hover: restrained surface/elevation.
- Sidebar: smooth width.
- Modal: fade plus short scale/slide.
- Tab: indicator transition.
- New message: gentle entry.
- Ida: signature animation.
- File change: brief highlight.
- Panel: short slide/fade.
- Success: understated confirmation.

Animations should be short, restrained, consistent, and reduced-motion aware.

## 18. Responsive design

### Chromebook/desktop
- Full sidebar, wide chat, optional context panel, resizable file workspace, keyboard shortcuts, comfortable text width, accessible composer, avoid nested scroll traps.

### Tablet
- Collapsible sidebar, context drawer, simplified toolbars, larger touch targets, panels switch rather than squeeze.

### Mobile
- Full-screen chat, nav drawer, fixed composer, context sheet, file explorer as separate drawer/panel, horizontal tabs, action menus, attachment previews, safe-area support.
- Reflow the interaction model; don't just shrink desktop columns.

## 19. Accessibility

- Full keyboard navigation.
- Clear focus indicators and logical tab order.
- Escape closes appropriate layer without trapping focus.
- Accessible names and labels.
- Adequate contrast and font sizes.
- Status not conveyed by color alone.
- Reduced motion.
- High contrast.
- Touch targets.
- No hover dependency.
- Screen-reader-friendly activity/status announcements where practical.

## 20. Performance and lightweight architecture

Proposed targets (not yet measured):
- Fast first paint and responsive local navigation.
- Smooth chat under normal conversation loads.
- Efficient long histories and file trees.
- Adaptive animations.
- Low unnecessary memory.
- Mobile responsive without layout jank.

Strategies:
- Lazy-load nonessential views.
- Avoid repeated rendering of huge histories.
- Virtualize long lists if needed.
- Debounce search.
- Cache lightweight metadata.
- Avoid redundant reads.
- Don't initialize all mini-apps simultaneously.
- Avoid expensive blur/backdrop effects.
- Prefer efficient CSS animations.
- Suspend Ida when hidden.
- Compress assets.
- Provide low-performance mode (reduce particles/motion/previews/concurrency).
- Measure before adding large dependencies.

## 21. Home/landing screen

- Adaptive greeting and project context.
- Central composer.
- Quick actions: research, project, write, analyze files, build, ask.
- Recent conversations, active projects, recent files, continue-work shortcuts.
- New-user onboarding when appropriate.
- Landing content should adapt to user history/context but remain dismissible and nonintrusive.

## 22. Global search and command palette

Search supported content across conversations/messages, projects, files, references, artifacts, research, and team outputs.
- Keyboard shortcut, instant results, filters, recent searches, exact phrase, previews, jump to source.
- Command palette: new chat, open project, switch model, open Research/Creative/Reference, files, toggle sidebar, appearance, start team task.
- Search and commands should reduce navigation effort and be lightweight.

## 23. Onboarding

- Short welcome and capability overview.
- Provider setup if needed.
- Optional workspace setup.
- Model selection.
- Brief composer demo.
- Skip immediately.
- Contextual, dismissible feature hints at first use (attachments, Research, projects, file writing).
- Avoid lengthy mandatory tours.

## 24. Productivity and additional approved ideas

All additions below are approved as part of the plan:

### Adaptive workspace
Workspace adjusts to Chat, Code, Research, Creative, AI Teams, file analysis, or complex tasks. Keep presets/contextually useful panels, avoid automatic silent changes to AI settings.

### Task Center
Central view of active, paused, completed, failed, needs-attention, and background tasks. See task status without visiting each chat.

### Observable work timeline
Task audit timeline of request, context loaded, tool used, file created/modified, validation, errors, completion. This is an observable activity log, not chain-of-thought.

### Smart workspace suggestions
Contextual suggestions (e.g., use project folder, open writing view, attach references, organize multi-part task). Dismissible, useful, never nagging.

### Interactive task plans
For complex requests, task checklist/plan, show real completion, allow plan adjustments where supported, make progress transparent.

### Intelligent output layouts
Present plans as tasks, comparisons as tables, code as code viewer, reports as documents, schedules as timelines, file sets as workspace, research as source/report view, datasets as tables/charts, brainstorms as idea cards. Chat remains available.

### Quality/review panel
For substantial work, show actual completeness, validation evidence, issues, missing/unverified items, failed checks, improvements. Never present arbitrary quality scores as facts.

### Focus mode
Hide sidebar/secondary panels, maximize chat/document, reduce animation, preserve composer, easy exit.

### Workspace presets
Default Chat, Coding, Research, Writing, Project Management. Save layout/panel choices; model/tool behavior remains separately controlled.

### File previews
Text/code/Markdown/image/PDF (where supported) preview, file metadata, context availability, size/type/status. Inspect before use.

## 25. Design system

- Neutral graphite surfaces and restrained accent; final palette requires contrast/accessibility testing.
- Consistent typography, heading hierarchy, body line height, metadata, monospace code.
- Spacing tokens: compact, normal, comfortable, spacious.
- Shared components: buttons, icon buttons, menus, dropdowns, tabs, dialogs, drawers, cards, inputs, tooltips, badges, status indicators, file/message/context cards, toast, skeleton, empty state.
- Ensure all mini-app areas share the system instead of creating visual drift.

## 26. Implementation roadmap (approved)

### Phase 1 — Foundation & visual system
Design tokens, shell, navigation, themes, responsive foundations, shared components.

### Phase 2 — Chat & composer
Messages, response presentation, composer, drafts, attachments, context, model/effort controls.

### Phase 3 — Ida & task activity
Animation, actual task-state tracking, activity, stop/resume, history, completion transitions.

### Phase 4 — Coding & file workspace
File explorer, editor, live activity, diffs, validation, recovery, safety.

### Phase 5 — Projects & Context Inspector
Project dashboard, context transparency, continuity, checkpoints, task organization.

### Phase 6 — AI Teams, Research & Creative
Specialized workspaces and integrated outputs, status, context.

### Phase 7 — Reference Lab, artifacts & productivity
Knowledge library, artifact/versioning, unified search, task center, focus, adaptive workspace, presets.

### Phase 8 — QA, performance & release
Regression, bug fixing, accessibility, Chromebook optimization, responsive QA, integration verification, versioning and release.

The overhaul may be executed as coordinated major stages, but each stage must have a reviewable scope, working implementation, integration, and verification. Avoid one unreviewable giant code change.

## 27. Master feature checklist

- [ ] Foundation and design system
- [ ] App shell and navigation
- [ ] Chat experience
- [ ] Composer
- [ ] Ida activity experience
- [ ] Coding/file workspace
- [ ] Projects and context
- [ ] AI Teams
- [ ] Research
- [ ] Creative Lab
- [ ] Reference Lab
- [ ] Artifacts
- [ ] Settings
- [ ] Errors and recovery
- [ ] Notifications and activity
- [ ] Micro-interactions
- [ ] Accessibility
- [ ] Performance and responsive design
- [ ] Home/landing screen
- [ ] Unified search/command palette
- [ ] Onboarding
- [ ] Continuity/checkpoints
- [ ] Adaptive workspace
- [ ] Task center
- [ ] Observable work timeline
- [ ] Smart suggestions
- [ ] Interactive plans
- [ ] Intelligent output layouts
- [ ] Quality/review panel
- [ ] Focus mode
- [ ] Workspace presets
- [ ] File previews
- [ ] Regression and release QA

## 28. Success criteria

The overhaul is complete only when:
- Existing features have been inventoried and preserved or explicitly accounted for.
- Shared design system is applied consistently.
- Chat/composer usability is materially improved.
- File operations are reviewable and safer, with truthful statuses and recovery.
- Ida reflects actual task activity, has a low-resource mode, and respects reduced motion.
- Research, Teams, Creative, Reference, Projects, and Artifacts are integrated and visually coherent.
- Context usage is inspectable and not misleading.
- Responsive behavior is checked at desktop, tablet, and mobile widths.
- Accessibility and keyboard/touch usability are checked.
- Performance on constrained hardware is evaluated; no unmeasured claims.
- Automated tests and regression checks pass.
- Failures, unverified items, and device limitations are reported honestly.
- Version/changelog/docs are updated and merge/release process followed.

## 29. Priority summary

1. **Chat and composer** — daily core experience.
2. **Coding/file writing** — project workspace, activity, diffs, safety, validation.
3. **Ida** — signature waiting/task activity experience.
4. **Projects/context/continuity** — sustained work.
5. **Research and AI Teams** — complex tasks made transparent.
6. **Responsive design and performance** — essential across target devices.
7. **Creative, Reference, Artifacts, settings, search and productivity features** — complete ecosystem.

## 30. Expected finished experience

The app should open into a clean, organized workspace. Users can resume projects, search, start a chat, attach files, set context, and select model/effort without navigating through clutter.

For substantial tasks, Ida becomes a distinctive, restrained activity centerpiece with honest live status and controls. Coding tasks use a real file workspace with file tree, editor, live operation status, diff review, recovery, and validation. Research has organized sources and a report view. Creative work has a writing workspace. AI Teams show roles, actual execution, outputs, and synthesis. Reference Lab provides reusable knowledge. Projects preserve useful context and checkpoints. Errors explain what happened and what can be recovered.

The result should be visually ambitious but technically disciplined, fast on low-end hardware, accessible, mobile-aware, and consistent throughout.

---

## Approval record

**User approval:** The user explicitly approved all proposed additions and ideas from the comprehensive overhaul discussion, and asked that this complete plan be recorded in the repository.

**Scope status:** Approved to be included in the master plan. Feature implementation still requires staged execution and verification.

**Special reservation:** Ida is retained as the signature loading/activity visualization. The file-writing workspace is designated a major centerpiece of the overhaul.

**No implementation claim:** This document only records the plan. It does not imply the listed UI features are already implemented.
