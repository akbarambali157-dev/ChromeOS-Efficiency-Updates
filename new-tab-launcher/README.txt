My Launcher 2.6.0
Install: chrome://extensions -> Developer mode -> Load unpacked -> pick this folder.
After updating files, press the reload arrow on the extension.

Built for an Acer Chromebook 15 CB3-532 (2 GB RAM, ChromeOS 103). Everything here
is written to stay light on that machine: no polling in hidden tabs, no animation
that is not on screen, and no work on a new tab that the new tab does not need.

Command bar: click the search box (or press /) and type "gh prs", "drive new sheet",
a tab name, or a shortcut name.

Shortcuts (change at chrome://extensions/shortcuts):
  Alt+Shift+X  close duplicate tabs in this window
  Alt+Shift+F  suspend background tabs to free memory
  Alt+Shift+D  turn dark mode on or off for the site you are on

Automatic tab suspension
  Its one-minute alarm runs only while the setting is enabled. Idle time is measured
  from the last tab activation; supported intervals are 10, 20, 30 or 60 minutes.

Home page
  Four shortcut tiles, 2x2. Everything else is behind "All shortcuts", which is
  built only the first time you open it.
  Workspace profiles for separate shortcut collections; quick note, persistent tasks, sessions, recently closed tabs, and settings.

Customisation
  Hide or show Tools, Sessions, Quick note and Tasks without deleting their data.
  Set your own primary and secondary accent colours, choose small/default/large text,
  use compact or comfortable spacing, and enable higher contrast.
  These settings are saved locally and included in validated backups.

Themes
  Nine themes plus Void, a true-black night sky with white stars. Each theme has a
  matching wallpaper; picking a theme picks its wallpaper, and you can override it
  with your own photo.
  Theme timing: Fixed, or Day / night, which switches between a light and a dark
  pair at 07:00 and 19:00.
  Animations can be turned off entirely for a lighter page.

Wallpapers
  Scenes: Aurora, Ridges, Dunes, Waves, Grid, Stars, Canopy, Bloom, Embers,
  Mountains, Void.
  Textures, all drawn from gradients rather than image files, so they cost nothing
  to ship: Felt, Fluted Glass, Thermal, Ripples, Speckle, Single Hue, Blueprint,
  Halftone, Grass, Dither, Paper, Contour and Cloud Sky.
  Only Ripples and Cloud Sky move, and both animate on the compositor, so a
  wallpaper stays cheap even with several new tabs open.
  Save up to 8 named collections of 20 built-in wallpapers. Apply them manually,
  or enable rotation once per new-tab opening. No timers or background polling.

Dark mode for websites
  On for all websites by default. Sites that are already dark are left alone.
  If a site looks wrong, add it to the skip list in Settings, or use the toolbar
  button. Photos, video, SVG and iframes are re-inverted so they keep true colour.

Assistant
  The round button at the bottom right of the home page opens a small panel with a
  short conversation log. The Assistant tab is still there for the full log.
  Tap the mic or type. For general questions add your brewkeg key under Assistant
  settings. Commands like weather, tabs, memory and codespaces work without a key.

Claude Code
  A separate tab with a VS Code style shell: file list, editor, chat and a GitHub
  push button. It uses its own brewkeg key, kept apart from the assistant's key and
  never included in a backup export. Default model is claude-sonnet-5-5.
  The chat sees the files in the app: every file marked ◉ travels with each
  message (the open file first), up to a shared budget, and ○ keeps one private.
  Drag the bar above the chat to resize it, double-click it or press the arrow
  button to give the chat the whole column, so long answers are readable.
  Web search: paste a Parallel API key in Settings and switch on "Web". Each
  message is searched on api.parallel.ai before the reply is written, and the
  model is told to cite the URLs it used. The search runs from the background
  worker, so it is not blocked by CORS.
  Push writes the file in the editor to a repo you name, after showing you the
  change. It needs the GitHub token from the GitHub tab.
  Honest limits: VS Code extensions and Claude Code plugins cannot be installed
  here. This is an editor, a chat and a push button, not a Codespace. The banner
  in the app links to a real Codespace when you need one.

Files: open the Files tab, choose a folder, press Scan. Then ask the assistant
'what files do I have'.
Email: ask the assistant 'check my email'. It reads your signed-in Gmail unread
list (read only).

Credentials (GitHub, Brewkeg and Parallel) are stored in Chrome extension local storage,
not an encrypted password vault. They are excluded from backups. Keep your Chrome
profile private and use narrowly scoped tokens.

Performance: see PERFORMANCE-BASELINE.md for a repeatable Chrome Task Manager
memory and CPU measurement process.

Backup: Settings -> Export backup saves shortcuts, workspaces, notes, tasks, sessions, settings and
Claude Code files and conversations. Your GitHub token and brewkeg keys are never
included.

Cloudflare verification (Turnstile / challenge pages)
  If a "verify you are human" box never passes, press "Cloudflare check not
  passing?" in the toolbar popup. It tells you whether dark mode is still on for
  that site, shows your Chrome version, and can turn off all injection there in
  one click. It also links to Cloudflare's own compatibility checker.

  The honest answer for this machine: the browser is the problem, not the
  extension. Cloudflare's documentation says so directly.

    - Turnstile has a dedicated error code for it: 110500, "Unsupported browser".
      The documented remedy is to tell the visitor to upgrade their browser.
    - Cloudflare's supported-browsers page lists Chrome as "current version and
      two previous major versions". Chrome 103 is years outside that.
    - The same page classes anything "more than five years old or that has not
      received security updates in over two years" as limited support, which
      "may experience issues". ChromeOS 103 is end of life and gets no security
      updates, so it sits in that bucket.
    - In practice an outdated browser often gets a "your browser is outdated"
      wall and no challenge is rendered at all, so there is nothing to solve.
      Turning off Browser Integrity Check does not change that.

  What this extension does about it: it never injects CSS or JS into
  challenges.cloudflare.com, github.dev or Codespaces. Cloudflare's docs say
  extensions that inject into challenge pages cause unpassable loops, so that is
  the one fix that is actually supported, and it is already in place.

  What it cannot do: spoofing the User-Agent or patching Canvas and WebGL does
  not work. Cloudflare explicitly refuses browsers whose fingerprint has been
  altered, and an inconsistent user-agent is itself an error (110510). That
  approach was never going to pass, so it is not attempted.

  What you can actually do:
    - Use a device or browser that still gets updates for anything behind a
      Cloudflare check.
    - Confirm the cause: open the same page in a fresh profile with all
      extensions disabled. If it still fails there, the extension is not it.
    - Run Cloudflare's compatibility check:
      https://browser-compat.turnstile.workers.dev/
