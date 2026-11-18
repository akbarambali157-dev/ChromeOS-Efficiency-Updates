# Version 5.0.0 — AI Workspace

## Included in the 5.0 foundation

- **Projects:** create, switch, rename and delete up to 12 local AI workspace projects.
- **Project isolation:** each project maintains its own editor files and conversation history.
- **Project dashboard:** a bounded task list (50 items), completion tracking, and project notes persist with project metadata.
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
- [ ] Send a short request and observe activity transitions.
- [ ] Enable web research and verify the Researching state.
- [ ] Run AI Team sequentially and verify only one role is active.
- [ ] Cancel an AI Team run and verify the UI returns to idle.
- [ ] Check diagnostics and browser console for errors.

Automated validation cannot replace the manual browser/device checks above.
