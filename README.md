# ChromeOS-Efficiency-Updates

A Chrome new-tab extension built to make an outdated Chromebook easier to live
with, without pretending it is something it is not.

Developed on an **Acer Chromebook 15 CB3-532** (board `banon`): Intel Celeron
N3060, **2 GB RAM**, 16 GB eMMC, 1366×768, **ChromeOS 103 — end of life, no
further updates**. Every decision here is made for that machine: nothing polls
in a hidden tab, nothing animates off screen, and a new tab does only the work a
new tab needs.

**Version 2.3.0** · Manifest V3 · minimum Chrome 103

---

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → pick the `new-tab-launcher/` folder
4. After changing files, press the reload arrow on the extension

## What's in it

**Navigation** — a left sidebar with an icon and label for every page: Home,
GitHub, Drive, Brewkeg, Sessions, Memory, Files and Claude. It collapses to
icons alone under 820px wide.

**Workspaces** — save up to eight separate shortcut collections (for example, Study, Personal and Research) and switch between them without losing the others.

**Home page** — clock, weather, a command bar, and exactly four shortcut tiles
in a 2×2 grid. Everything else lives behind *All shortcuts*, a rail that is
built only the first time you open it. Below that: quick note, a persistent task list, sessions,
recently closed tabs, and settings.

**Command bar** — click the search box or press `/`. Search shortcuts, open tabs, bookmarks and history, or type `gh prs`,
`drive new sheet`, a tab name, or a shortcut name.

**Themes** — 14 themes (10 dark, 4 light) each with a matching wallpaper, plus
**Void**, a true-black night sky with sparse sharp stars. *Day / night* mode
switches between a light and a dark pair at 07:00 and 19:00.

**Wallpapers** — twelve scenes, each drawn from the same six-slot palette (sky,
three depth layers, a light source, a shadow) so they stay readable in both
light and dark themes. Light themes flip to dark silhouettes against a bright
sky, which is what gives the mountains a lit face and a shadowed one instead of
washing out. Waves roll sideways, embers rise, stars twinkle and drift, the
aurora blooms move, and the neon floor scrolls. Animations can be turned off
entirely for a lighter page.

**Dark mode for websites** — on by default, and it leaves already-dark sites
alone. Photos, video, SVG and iframes are re-inverted so they keep true colour.
Skip a site from the toolbar button or from Settings.

**Assistant** — the round orb at the bottom right opens a small panel with a
short conversation log; the Assistant tab keeps the full log. Weather, tabs,
memory and codespaces commands work without a key. General questions need a
[brewkeg](https://brewkeg.dev) key.

**Claude Code** — a VS Code style shell with a file list, editor, chat and a
GitHub push button. It uses its own brewkeg key, kept apart from the assistant's
and never included in a backup export. Pushing shows you the diff before
anything is written.

**Mini apps** — GitHub, Drive, Brewkeg, Sessions, Memory and Files, each its own
page so a new tab never parses markup it does not need.

**Tab tools** — close duplicate tabs, suspend background tabs to free memory,
and a memory monitor that shows which sites are using the most.

**Backup and restore** — export shortcuts, workspace profiles, notes, tasks, sessions and supported settings as JSON, then import a validated backup. API credentials and GitHub tokens are excluded.

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

## Project layout

```
new-tab-launcher/
  manifest.json        MV3 manifest, commands, permissions
  newtab.html/.js/.css home page
  nav.js               left sidebar nav: registry of id -> page, with icons
  store.js             read-through cache over chrome.storage.local
  theme.js             themes, wallpapers, day/night
  background.js        service worker: dark mode, tab tools, chat relay
  dark-*.js/.css       dark mode injection and detection
  assistant-*.js       shared assistant core, intents, full page
  orb.js               floating assistant panel
  claude-app.*         Claude Code editor, chat and GitHub push
  github/drive/brewkeg/sessions/memory/files  mini app pages
  popup.*              toolbar popup
```

## Notes

- Backup export covers shortcuts, notes, tasks, sessions, settings, and Claude Code
  files and conversations. **GitHub tokens and brewkeg keys are never included.**
- `new-tab-launcher (2).zip` in the repo root is the original upload and
  duplicates the source folder.
