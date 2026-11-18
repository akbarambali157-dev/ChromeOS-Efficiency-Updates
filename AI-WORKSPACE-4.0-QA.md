# 4.0.0 AI Workspace QA Checklist

## Static checks
- [ ] Manifest is valid JSON and version is 4.0.0.
- [ ] Workspace scripts load in provider → workspaces → app order.
- [ ] All workspace control IDs exist.
- [ ] All workspace JavaScript parses.
- [ ] Repository mini-app validator passes.
- [ ] No new runtime dependencies.
- [ ] No weakened sandbox CSP or extension permissions.

## Provider configuration
- [ ] Brewkeg request works with a valid key/model.
- [ ] OpenAI direct request works with a valid key/model.
- [ ] Anthropic direct request works with a valid key/model.
- [ ] Provider errors are shown without exposing keys.
- [ ] Provider selection and model settings persist.
- [ ] Conversation history remains usable after provider switching.

## Editor/context
- [ ] Active file is included when attached.
- [ ] Detached files are excluded.
- [ ] Unsaved editor changes are included.
- [ ] Local text-file import works.
- [ ] Folder import respects file-count, per-file and aggregate limits.
- [ ] Remote GitHub file import creates a local copy.
- [ ] Assistant code insertion respects cursor/selection and confirmation.

## AI Team/research
- [ ] Debate mode completes lead → critique → synthesis.
- [ ] Parallel mode runs three independent requests and displays each result.
- [ ] Audit mode runs two independent analyses.
- [ ] Missing provider keys produce clear errors.
- [ ] Stop workflow prevents subsequent calls (in-flight calls may finish).
- [ ] Research results show source links.
- [ ] Context attachment is opt-in and bounded.

## GitHub
- [ ] Repository tree loads with a valid token.
- [ ] Code search works where token permissions allow.
- [ ] Branch creation works and validates names.
- [ ] Remote file import is read-only.
- [ ] Reviewed push targets the selected branch.
- [ ] Review is invalidated when file/repo/path/branch changes.
- [ ] Pull request creation works with a write-enabled token.

## Supabase
- [ ] Table browse uses publishable/anon key and respects RLS.
- [ ] Management PAT can list projects and read project details.
- [ ] Edge Function listing works with scoped read permission.
- [ ] Storage bucket listing works with public client key and applicable permissions.
- [ ] Log query accepts a range ≤24 hours.
- [ ] Read-only SQL endpoint rejects mutating statements.
- [ ] Results are attached to AI context only when checked.
- [ ] PAT/public key are never placed in model prompts.

## Video Studio
- [ ] Storyboard generation returns valid scenes.
- [ ] Scenes/captions/narration can be edited and reordered.
- [ ] Save/load works across app reopen.
- [ ] Preview renders both modes.
- [ ] WebM export records scene timing and cancels without downloading.
- [ ] Export is capped to 45 seconds and remains responsive.
- [ ] Browser without MediaRecorder reports a clear error.

## Device/browser QA
- [ ] ChromeOS 103 Chromebook (2 GB RAM) — workspace switching.
- [ ] ChromeOS 103 — local file import.
- [ ] ChromeOS 103 — provider request.
- [ ] ChromeOS 103 — WebM export.
- [ ] Mobile viewport — no horizontal overflow.
- [ ] Existing mini-apps and launcher functionality remain intact.

**Merge gate:** Do not merge if static validation fails. External tests and device tests must be recorded; unavailable checks must be clearly listed as unverified.
