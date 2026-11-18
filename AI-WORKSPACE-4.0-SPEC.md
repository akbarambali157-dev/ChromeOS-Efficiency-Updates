# AI Development Workspace 4.0 — Implementation and Safety Specification

## Scope

The Claude mini app is evolving into a multi-model AI development workspace. It remains a lightweight Manifest V3 extension page using plain JavaScript and browser APIs, with Chrome 103 as the compatibility floor.

## Implemented workspace modules

- **Provider abstraction:** Brewkeg-compatible chat relay, OpenAI Responses API relay, and Anthropic Messages API relay. Provider/model IDs are configurable. Direct provider keys are kept in extension-local storage and sent only to the fixed background relay endpoint.
- **Editor context:** scratch files, attached-file context, active editor contents, bounded local text-file import, and bounded folder import. Imported files are local copies; originals are not modified.
- **AI Team:** lead, independent reviewer, and fast worker workflows. Debate mode performs a lead proposal, independent critique, and lead synthesis. Parallel mode runs independent analysis and a fast worker concurrently. Audit mode runs two independent analyses. These are coordinated model requests, not persistent autonomous agents.
- **Code insertion:** a user-confirmed action inserts the latest assistant fenced code block at the cursor or replaces selected text. Review before saving or pushing.
- **Research:** Parallel Search workspace and chat web-search toggle. Results can be explicitly attached to AI Team context.
- **GitHub:** repository/branch tree browsing, code search, remote-file import into the editor, branch creation, PR creation, and the existing single-file diff review/push workflow with a selected branch.
- **Supabase:** read-only table browsing through the Data API with the supplied publishable/anon key (RLS applies); Management API project listing and project details with a scoped PAT; conservative read-only SQL through the official read-only endpoint. Results attach to AI Team context only when the user opts in.
- **Video Studio:** AI storyboard generation for historical stickman and Roblox-style stories, editable scenes/captions/narration text, local project save/load, Canvas animatic preview and silent WebM export.

## Explicit limitations

- AI Team workflows are multiple coordinated API calls; there is no durable background scheduler or autonomous agent runtime.
- The fast worker is a model role, not a separate operating-system process. Cancellation stops subsequent workflow steps; it cannot abort an in-flight provider request.
- Repository browsing is read-only. Remote files are imported into the local editor. The reviewed push workflow handles one file per commit; repeat it for additional files. Branch and PR operations require a GitHub token with repository write permission.
- Supabase SQL is restricted to a conservative read-only filter and the official read-only endpoint. Read-only database mode does not prevent every side-effecting function, so the UI warns against calling such functions. No service-role or secret API key is supported.
- Supabase management access requires a user-supplied scoped PAT; token storage is local to the extension.
- Video export is a silent Canvas animatic. It does not capture Roblox gameplay, generate images, or synthesize voice/audio. Roblox mode produces a block-style story animatic and production notes.
- External APIs require the user’s own credentials and may be unavailable, rate-limited, or reject model IDs. Browser/device testing is required for ChromeOS 103.

## Security and data handling

- Provider endpoints are fixed in the service worker; user input cannot select an arbitrary relay URL.
- Direct provider keys, GitHub tokens and Supabase PATs are stored in extension-local storage. They are not inserted into model prompts by the provider abstraction. Do not paste secret/service-role keys into the UI.
- GitHub remote writes are user-triggered and reviewed. Supabase management writes are not enabled.
- Local file import is text-only, bounded to 1 MiB per file, 4 MiB per import and 8 selected files per import, and bounded by the mini app's file-count limit.
- Research and database context are opt-in.
- Video projects are local and bounded to six saved projects.

## Verification

The dependency-free validator checks the 4.0 workspace contracts and compiles the workspace JavaScript source with Node's parser. It does not replace integration tests, API credential tests, browser testing or ChromeOS device testing.
