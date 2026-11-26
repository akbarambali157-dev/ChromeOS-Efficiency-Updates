# ChromeOS-Efficiency-Updates

A Chrome new-tab extension built to make an outdated Chromebook easier to live
with, without pretending it is something it is not.

Developed on an **Acer Chromebook 15 CB3-532** (board `banon`): Intel Celeron
N3060, **2 GB RAM**, 16 GB eMMC, 1366×768, **ChromeOS 103 — end of life, no
further updates**. Every decision here is made for that machine: dashboard pages
stop their own polling when hidden, off-screen animation is avoided, and the
optional background auto-suspend alarm exists only when that feature is enabled.

**Version 5.7.1** · Manifest V3 · minimum Chrome 103 · 40 bundled mini-apps (automated validation passed in PR CI; device QA pending)

---


**AI Development Workspace (5.5)** — the shared response layer now automatically continues responses interrupted by provider output-token limits. It detects confirmed truncation, preserves the partial answer, sends a compact continuation context, and resumes from the exact stopping point without repeating the earlier text. Up to two continuation attempts are made per response; if recovery still fails, the accumulated partial output and diagnostics remain available. The chat, AI Team agents and Video Studio Writers’ Room display a dedicated continuation indicator. Structured JSON remains subject to complete-object validation before later stages consume it. The earlier 5.4 response-normalization layer preserves provider completion reasons, usage and request IDs; rejects incomplete outputs; and retains diagnostics. OpenAI Responses and Anthropic relays preserve finish metadata. Video Studio's missing model-test controls and status target are restored, and completed Writers’ Room stages are saved so a later failure does not erase earlier work. Version 5.3 adds visible Context and Review Code controls, automatic project-file context, approved local file-edit proposals with highlighted diffs and guarded undo, and improved provider network/timeout diagnostics. Earlier workspace capabilities include model/provider selection, local project files and conversations, AI Team workflows, independent review, Parallel web research, GitHub repository browsing and reviewed file pushes, and Supabase browsing with read-only SQL. Video Studio remains a lightweight procedural story-to-animatic tool with an AI Writers’ Room, character bible, editable storyboard, preview timeline and silent WebM export; it does not claim to generate full image/video/audio assets.

**Creative Library (5.6.0)** — a lazily loaded reference workspace for local PNG/JPEG/WebP images, MP4/WebM videos, TXT/Markdown text and PDFs. Asset metadata and binary Blobs are stored separately in IndexedDB, so browsing a collection does not load every image or video into memory. Collections, tags, descriptions, notes, reusable style profiles and project associations persist locally. The library previews only the selected item and releases preview object URLs when selection changes. Video previews request metadata only; the app does not decode whole videos locally. Text-reference AI analysis is an explicit, per-action choice and sends at most the first 12,000 characters after a confirmation prompt. Image/video AI analysis and PDF text extraction are not enabled in this release; those assets remain local. No new extension permissions or external dependencies are added.

**Stage C reliability patch (5.7.1)** — project-folder search now enforces its previously inactive 12 MiB scan budget and reports incomplete searches when files are skipped or a limit is reached. Regression tests cover byte-budget, result-count and skipped-file behavior.

**Recreation Lab (5.7.0)** — a lazy-loaded experiment workbench built on the Creative Library. Choose up to five local references and a reusable style profile, define comparison criteria, and ask the configured text model for a structured experiment plan with alternatives, workflow and trade-offs. Every AI run requires explicit confirmation. Only the brief, style guidance and reference metadata (names, types, descriptions, tags and saved text analysis) are sent; original images, videos, PDFs and file contents are not uploaded. Save experiments locally, reload them later, and record results, comparison notes and per-criterion 1–5 scores side by side. This is structured creative planning, not model training or automatic visual replication.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → pick the `new-tab-launcher/` folder
4. After changing files, press the reload arrow on the extension

## What's in it

**Navigation** — a left sidebar with an icon and label for every page: Home,
GitHub, Drive, Brewkeg, Sessions, Memory, Files and the AI Development Workspace. It collapses to
icons alone under 820px wide.

**Workspaces** — save up to eight separate shortcut collections (for example, Study, Personal and Research) and switch between them without losing the others.

**Home page** — clock, weather, a command bar, and exactly four shortcut tiles
in a 2×2 grid. Everything else lives behind *All shortcuts*, a rail that is
built only the first time you open it. Below that: quick note, a persistent task list, sessions,
recently closed tabs, and settings.

**Command bar** — click the search box or press `/`. Search shortcuts, open tabs, bookmarks and history, or type `gh prs`,
`drive new sheet`, a tab name, or a shortcut name.

**Customisation** — hide or show Tools, Sessions, Quick note and Tasks independently; changes do not delete their saved data. Choose custom primary and secondary accent colours, adjust text size and dashboard spacing, or enable higher contrast. These preferences are included in validated backups. The interface also has consistent keyboard focus indicators, a skip-to-content link, clearer shortcut edit/remove labels for assistive technology, and larger touch targets on touch devices.

**Themes** — 14 themes (10 dark, 4 light) each with a matching wallpaper, plus
**Void**, a true-black night sky with sparse sharp stars. *Day / night* mode
switches between a light and a dark pair at 07:00 and 19:00.

**Wallpapers** — built-in scenes and procedural textures, each drawn from the same six-slot palette (sky,
three depth layers, a light source, a shadow) so they stay readable in both
light and dark themes. Light themes flip to dark silhouettes against a bright
sky, which is what gives the mountains a lit face and a shadowed one instead of
washing out. Waves roll sideways, embers rise, stars twinkle and drift, the
aurora blooms move, and the neon floor scrolls. Animations can be turned off
entirely for a lighter page. Save up to eight named collections of up to 20 built-in
wallpapers each, then apply them manually or enable rotation on each new-tab
opening. Rotation uses no timer or background polling.

**Dark mode for websites** — on by default, and it leaves already-dark sites
alone. Photos, video, SVG and iframes are re-inverted so they keep true colour.
Skip a site from the toolbar button or from Settings.

**Assistant** — the round orb at the bottom right opens a small panel with a
short conversation log; the Assistant tab keeps the full log. Weather, tabs,
memory and codespaces commands work without a key. General questions need a
[brewkeg](https://brewkeg.dev) key. An optional, off-by-default context switch
can share the active workspace name, shortcut labels, task titles and aggregate
file-scan totals with general AI questions. It never shares file contents, notes
or credentials.

**Claude Code** — a VS Code style shell with a file list, editor, chat and a
GitHub push button. It uses its own brewkeg key, kept apart from the assistant's
and never included in a backup export. Pushing shows you the diff before anything is written, and the push is bound
to the exact file contents and destination reviewed.

**Release testing** — automated syntax and mini-app contract validation runs in GitHub Actions. Browser interaction, provider-key setup, animation preview, project persistence and WebM recording still require manual ChromeOS testing. The extension is designed around the Chrome 103 baseline and uses a lightweight Canvas renderer.

**Mini-app Store** — a remote Vercel storefront and cached metadata catalogue with 40 first-party apps bundled in the extension. All 40 entries are registered, locally installable and open in the restricted launcher workspace. Apps share the theme bridge and use app-specific IndexedDB storage; user data remains local and can be included in bounded launcher backups. Apps are designed offline-first; Research Library search and QR image generation are disclosed online features. The Code Playground provides sandboxed HTML/CSS preview and a JavaScript scratchpad without executing user scripts. System Monitor displays browser-reported capabilities, not live CPU/RAM telemetry; Accessibility Checker provides basic static heuristics, not a WCAG certification. Resource figures remain estimates until measured on the Chromebook. Run the automated checks with `node scripts/validate-miniapps.mjs`, then use the [40-app manual QA checklist](MINI-APP-3.8.0-QA-CHECKLIST.md) for the device test pass. See [the 40-app catalogue and release gates](MINI-APP-CATALOGUE-40.md), [the 3.5.0 audit](MINI-APP-3.5.0-AUDIT.md) and [marketplace architecture](MARKETPLACE.md).

**Tab tools** — close duplicate tabs, suspend background tabs to free memory,
and a memory monitor that shows which sites are using the most.

**Files** — duplicate candidates are confirmed with a full-file SHA-256 digest for files up to 16 MB, and are not selected automatically. The Files page only copies selected files into `_Review`, verifies the copied bytes and leaves originals untouched. Source-code projects and extension folders are skipped.

**Backup and restore** — export shortcuts, workspace profiles, notes, tasks, sessions, supported settings, mini-app install registrations, favourites and bounded app-scoped data as JSON. Import validates each app ID and per-app size limit before restoring IndexedDB. Older backups without mini-app data preserve existing app data. Theme timing and editor attachment preferences are preserved. API credentials and GitHub tokens are excluded.

## Credential handling

GitHub, Brewkeg and Parallel credentials are stored in Chrome extension local storage so their features can work. They are excluded from backup exports, but this storage is **not an encrypted password vault**. Keep your Chrome profile private, use the narrowest token permissions the provider supports, and revoke a credential if you think it has been exposed. Do not paste credentials into assistant conversations or project files.

## Performance measurement

Use the [performance baseline guide](PERFORMANCE-BASELINE.md) to record Chrome Task Manager memory and CPU readings. The project does not claim a memory or CPU target until readings have been collected on the actual Chromebook.

## Keyboard shortcuts

Change these at `chrome://extensions/shortcuts`.

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+X` | Close duplicate tabs in this window |
| `Alt+Shift+F` | Suspend background tabs to free memory |
| `Alt+Shift+D` | Toggle dark mode for the site you are on |

## Cloudflare verification

If a "verify you are human" box never passes, this is the honest answer: **the
browser is the problem, not the extension.**

- Turnstile has a dedicated error code for it — **110500, "Unsupported browser"**.
- Cloudflare supports Chrome at *"current version and two previous major
  versions"*. Chrome 103 is years outside that.
- Cloudflare classes anything *"more than five years old or that has not
  received security updates in over two years"* as limited support. ChromeOS 103
  is end of life, so it sits in that bucket.
- In practice an outdated browser often gets a "your browser is outdated" wall
  and no challenge is rendered at all, so there is nothing to solve.

The extension does the one thing that is actually supported: it never injects
CSS or JS into `challenges.cloudflare.com`, `github.dev` or Codespaces. It does
**not** attempt User-Agent spoofing or Canvas/WebGL patching — Cloudflare
refuses altered fingerprints, and an inconsistent user-agent is itself an error
(110510).

The toolbar popup has a **"Cloudflare check not passing?"** diagnostic that
shows your Chrome version, tells you whether dark mode is still on for the site,
and links to Cloudflare's own compatibility checker.


## Modernization plan and release testing

The project is moving toward a staged modernization process: complete audit first, then a dedicated Diagnostics & Performance QA build, reliability/regression fixes, unified UX, project/workspace foundations, AI Team workflow improvements, research and creative integration, performance work, and a later design phase for secure mobile approvals. Major milestones are delivered as test checkpoints; user-device testing is expected before the next milestone is treated as validated.

- [Project Atlas roadmap](PROJECT-ATLAS-ROADMAP.md) — staged major/minor/patch releases, priorities, release gates, deferred ideas and project-wide audit scope.
- [Diagnostics & testing system specification](TESTING-SYSTEM-SPEC.md) — proposed whole-project health checks, performance measurement, app/selector wiring verification, storage checks, background activity visibility, safe test modes and report privacy.
- [UI redesign specification](UI-REDESIGN-SPEC.md) — screen-by-screen visual audit, competitive benchmarking, shared design system, UX journeys, responsive design, staged implementation and validation.
- [Audit Phase A progress](AUDIT-PHASE-A-PROGRESS.md) — initial source-level observations, verified foundations, suspected risks and remaining audit scope (in progress).
- [Audit Phase A completion report](AUDIT-PHASE-A-COMPLETED.md) — source inventory, CI evidence, prioritized findings, limitations and next-stage recommendations.
- [Stage B diagnostics implementation](STAGE-B-DIAGNOSTICS-IMPLEMENTATION.md) — current testing foundation checkpoint, checks, CI results and remaining work.\n- [Stage B manual Chromebook QA checklist](PROJECT-ATLAS-STAGE-B-MANUAL-QA.md) — device/browser verification, performance readings and privacy review.

These documents are planning specifications. Their proposed diagnostics, integrations and future milestones are **not implemented just because they appear here**. Release readiness will report automated checks, manual/device checks, unavailable measurements and known issues separately.

## Project layout

```
new-tab-launcher/
  manifest.json        MV3 manifest, commands, permissions
  newtab.html/.js/.css home page
  nav.js               left sidebar nav: registry of id -> page, with icons
  common.js            identical page helpers shared without a framework
  theme.js             theme and wallpaper engine + shared identifier catalog
  customization.js     dashboard layout, colour and accessibility preferences
  background.js        service worker: dark mode, tab tools, chat relay
  dark-*.js/.css       dark mode injection and detection
  assistant-*.js       shared assistant core, intents, full page
  orb.js               floating assistant panel
  claude-app.*         Claude Code editor, chat and GitHub push
  claude-app-creative-library.js  lazy local reference library (IndexedDB)
  github-api.js         shared GitHub REST request and error handling
  github/drive/brewkeg/sessions/memory/files  mini app pages
  popup.*              toolbar popup
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for page/module boundaries, storage ownership, background message contracts, and the rules used to keep shared logic genuinely shared without adding unnecessary global dependencies.

## Notes

- Backup export covers shortcuts, notes, tasks, sessions, settings, and Claude Code
  files and conversations. **GitHub tokens and brewkeg keys are never included.**

### Version 5.0 completion pass

The AI Team workflow now displays a per-stage progress list and preserves completed output when cancelled. Reviewed code application adds a guarded undo action that restores the exact prior editor contents only if no subsequent edit has changed the file. This is intentionally not a general history/rollback system.
