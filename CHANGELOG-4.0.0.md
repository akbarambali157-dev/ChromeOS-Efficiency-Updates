# 4.0.0 — AI Development Workspace

## Added
- Provider abstraction for Brewkeg-compatible, OpenAI and Anthropic model requests.
- Provider/model configuration and direct API key fields.
- AI Team workspace with debate, parallel analysis, independent audits and a fast-worker role.
- Shared editor context and bounded text-file/folder import.
- User-confirmed insertion of assistant code blocks into the editor.
- Web Research workspace with source links and opt-in context attachment.
- GitHub repository/branch browsing, code search, remote-file import, branch creation, PR creation, and branch-aware reviewed single-file pushes.
- Supabase Data API table browsing, Management API project discovery/details, and conservative read-only SQL.
- Opt-in research/Supabase results for AI Team context.
- Video Studio for Roblox-style production kits and historical stickman storyboards, editable scenes, local project persistence, Canvas previews and silent WebM animatics.
- 4.0 workspace validation contracts and JavaScript syntax checks.

## Safety and compatibility
- Fixed provider endpoints; no user-supplied API URL.
- Read-only Supabase SQL route only; no service-role key support.
- Explicit confirmation for editor code insertion and reviewed GitHub pushes.
- Local text imports have per-file and aggregate limits.
- No frameworks or runtime dependencies added.

## Known limitations
- Agents are coordinated API calls, not persistent autonomous workers.
- Cancellation cannot interrupt an in-flight provider request.
- GitHub editor push is single-file per reviewed commit.
- Video exports are silent animatics; no generated voice/audio or Roblox gameplay capture.
- Provider/API integrations and ChromeOS 103 behavior require device testing.
