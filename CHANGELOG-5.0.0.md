# Version 5.0.0 — AI Workspace

## Included in the 5.0 foundation

- **Projects:** create, switch, rename and delete up to 12 local AI workspace projects.
- **Project isolation:** each project maintains its own editor files and conversation history.
- **Project dashboard:** a bounded task list (50 items), completion tracking, and project notes persist with project metadata.
- **Storage safety:** project data is capped at 4.3 MiB across projects; failed saves are surfaced, and migration keeps legacy data if the cap prevents copying.
- **Context manager:** inspect project metadata and included files, toggle file inclusion, and see the context size.
- **Plan mode:** request a numbered implementation plan with scope, risks and verification; it explicitly waits for user approval and persists the preference.
- **Code review:** assistant code blocks open in an editable review dialog; the user can insert at the cursor or explicitly replace selected text.
- **Legacy migration:** existing scratch files and conversations are copied into the default General project on first load.
- **Activity UI:** replaces generic loading with Thinking, Reasoning, Taking a little longer, and Still working states. Labels are elapsed-time based; the app does not claim to expose hidden model reasoning.
- **Delegation:** AI Team roles execute sequentially. Only one delegated model request is active at a time, and the activity display names the current role and task.
- **Compatibility:** stays on Manifest V3 and Chrome 103; no new runtime dependencies.

## Manual QA checklist

- [ ] Reload unpacked extension on ChromeOS 103.
- [ ] Existing files and conversations appear in General.
- [ ] Create a project; confirm files and chats are isolated.
- [ ] Switch projects repeatedly; confirm the correct editor file, chat, notes and task list return.
- [ ] Edit project instructions, notes and tasks; confirm they persist and are included in AI context.
- [ ] Rename a project.
- [ ] Delete a project and verify another project remains.
- [ ] Open Context manager; verify project instructions, notes, tasks and file inclusion.
- [ ] Toggle a file off/on and verify the context indicator changes.
- [ ] Enable Plan mode and verify the model returns a plan without implementation code.
- [ ] Review an assistant code block, edit it, insert at cursor, and test selection replacement.
- [ ] Send a short request and observe activity transitions.
- [ ] Enable web research and verify the Researching state.
- [ ] Run AI Team sequentially and verify only one role is active.
- [ ] Cancel an AI Team run and verify the UI returns to idle.
- [ ] Check diagnostics and browser console for errors.

Automated validation cannot replace the manual browser/device checks above.
