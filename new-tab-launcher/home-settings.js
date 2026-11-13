(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  /* Every wallpaper the engine can draw. Kept in sync with theme.js MODES; a
     backup that carries an unknown mode falls back rather than restoring a
     blank wall. */
  var WALL_IDS = [
    'none', 'aurora', 'mountains', 'stars', 'ridges', 'dunes', 'waves', 'grid',
    'canopy', 'bloom', 'embers', 'void', 'felt', 'fluted', 'thermal', 'ripple',
    'speckle', 'monohue', 'blueprint', 'halftone', 'grass', 'dither', 'paper',
    'contour', 'clouds'
  ];

  /* ---------- Memory gauge ---------- */
  var gauge = makeGauge($('memGauge'));
  function gb(n) { return (n / 1073741824).toFixed(1); }
  function mem() {
    chrome.system.memory.getInfo(function (i) {
      if (!i) return;
      var pct = (i.capacity - i.availableCapacity) / i.capacity * 100;
      gauge.set(pct, 'Memory ' + Math.round(pct) + '% used');
      $('memSub').textContent = gb(i.availableCapacity) + ' GB free of ' + gb(i.capacity) + ' GB';
    });
  }
  /* Poll only while the tab is actually visible. Every background new tab used
     to call chrome.system.memory.getInfo and repaint an SVG every 5 seconds. */
  var memTimer = null;
  function startMem() {
    if (memTimer !== null) return;
    mem();
    memTimer = setInterval(mem, 15000);
  }
  function stopMem() {
    if (memTimer === null) return;
    clearInterval(memTimer);
    memTimer = null;
  }
  function syncMem() {
    if (document.visibilityState === 'visible') startMem(); else stopMem();
  }
  setTimeout(syncMem, 400);
  document.addEventListener('visibilitychange', syncMem);

  /* ---------- Auto-suspend settings ---------- */
  function saveAS() {
    chrome.storage.local.set({ autoSuspend: { on: $('asOn').checked, minutes: parseInt($('asMin').value, 10) } });
  }
  chrome.storage.local.get('autoSuspend', function (d) {
    var c = d.autoSuspend || { on: false, minutes: 20 };
    $('asOn').checked = !!c.on;
    $('asMin').value = String(c.minutes || 20);
  });
  $('asOn').addEventListener('change', saveAS);
  $('asMin').addEventListener('change', saveAS);

  /* ---------- Backup ---------- */
  var KEYS = ['layoutPrefs', 'accessibilityPrefs', 'customPalette', 'wallpaperCollections', 'activeWallpaperCollection', 'wallpaperRotation', 'wallpaperRotationIndex', 'shortcuts', 'workspaces', 'activeWorkspace', 'note', 'tasks', 'sessions', 'ccSessions', 'darkMode', 'darkSkip', 'autoSuspend', 'theme', 'weather', 'wallMode', 'motion', 'assistant', 'ccFiles', 'ccLogs'];
  /* All fourteen themes, day pair included: a backup used to silently drop a
     day theme because only the nine night ones were listed here. */
  var THEMES = [
    'slate', 'aurora', 'sunset', 'ocean', 'neon', 'midnight', 'forest', 'plum', 'ember',
    'void', 'dayblue', 'daygold', 'dayamber', 'dayviolet'
  ];
  function say(msg, err) { var s = $('bkStatus'); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : ''); }
  function isWeb(u) { return typeof u === 'string' && /^https?:\/\//i.test(u); }
  function isDateKey(v) {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var p = v.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
    return d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2];
  }

  $('bkExport').addEventListener('click', function () {
    chrome.storage.local.get(KEYS, function (data) {
      var blob = new Blob([JSON.stringify({ app: 'my-launcher', v: 1, data: data }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'launcher-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      say('Backup downloaded. Your GitHub token and Claude Code key are not included.');
    });
  });

  function clean(d) {
    var out = {};
    if (Array.isArray(d.shortcuts)) {
      out.shortcuts = d.shortcuts.filter(function (s) { return s && typeof s.name === 'string' && isWeb(s.url); })
        .map(function (s) { return { name: s.name.slice(0, 24), url: s.url }; });
    }
    if (Array.isArray(d.workspaces)) {
      var seenWorkspaceNames = {};
      out.workspaces = d.workspaces.filter(function (w) {
        if (!w || typeof w.name !== 'string' || !w.name.trim() || !Array.isArray(w.shortcuts)) return false;
        var key = w.name.trim().toLowerCase();
        if (seenWorkspaceNames[key]) return false;
        seenWorkspaceNames[key] = true;
        return true;
      }).slice(0, 8).map(function (w) {
        return {
          name: w.name.trim().slice(0, 24),
          shortcuts: w.shortcuts.filter(function (s) {
            return s && typeof s.name === 'string' && s.name.trim() && isWeb(s.url);
          }).slice(0, 80).map(function (s) { return { name: s.name.trim().slice(0, 24), url: s.url }; })
        };
      });
      if (typeof d.activeWorkspace === 'string' &&
          out.workspaces.some(function (w) { return w.name === d.activeWorkspace; })) {
        out.activeWorkspace = d.activeWorkspace;
        var active = out.workspaces.find(function (w) { return w.name === d.activeWorkspace; });
        out.shortcuts = active.shortcuts;
      } else if (out.workspaces.length) {
        out.activeWorkspace = out.workspaces[0].name;
        out.shortcuts = out.workspaces[0].shortcuts;
      }
    }
    if (d.layoutPrefs && typeof d.layoutPrefs === 'object' && Array.isArray(d.layoutPrefs.hidden)) {
      var allowedHidden = ['layout-tools', 'layout-sessions', 'layout-notes', 'layout-tasks'];
      out.layoutPrefs = { hidden: d.layoutPrefs.hidden.filter(function (id, i, a) {
        return allowedHidden.indexOf(id) >= 0 && a.indexOf(id) === i;
      }) };
    }
    if (d.accessibilityPrefs && typeof d.accessibilityPrefs === 'object') {
      var ap = d.accessibilityPrefs;
      out.accessibilityPrefs = {
        textSize: ['small', 'normal', 'large'].indexOf(ap.textSize) >= 0 ? ap.textSize : 'normal',
        density: ap.density === 'compact' ? 'compact' : 'comfortable',
        highContrast: !!ap.highContrast
      };
    }
    if (d.customPalette && typeof d.customPalette === 'object') {
      var cp = d.customPalette, hex = /^#[0-9a-f]{6}$/i;
      out.customPalette = {};
      if (hex.test(cp.accent || '')) out.customPalette.accent = cp.accent;
      if (hex.test(cp.accent2 || '')) out.customPalette.accent2 = cp.accent2;
      if (!Object.keys(out.customPalette).length) delete out.customPalette;
    }
    if (typeof d.note === 'string') out.note = d.note;
    if (Array.isArray(d.tasks)) {
      out.tasks = d.tasks.filter(function (t) {
        return t && typeof t.title === 'string' && t.title.trim() && t.title.length <= 160;
      }).slice(0, 100).map(function (t, i) {
        var due = isDateKey(t.due) ? t.due : '';
        return {
          id: String(t.id || ('restored-' + i)).slice(0, 80),
          title: t.title.trim().slice(0, 160),
          due: due,
          done: !!t.done,
          created: isFinite(+t.created) ? +t.created : Date.now()
        };
      });
    }
    if (Array.isArray(d.sessions)) {
      out.sessions = d.sessions.filter(function (s) { return s && typeof s.name === 'string' && Array.isArray(s.tabs); })
        .map(function (s) {
          return {
            id: s.id, name: s.name.slice(0, 40), saved: s.saved,
            tabs: s.tabs.filter(function (t) { return t && isWeb(t.url); })
              .map(function (t) { return { title: String(t.title || t.url), url: t.url }; })
          };
        });
    }
    if (d.ccSessions && typeof d.ccSessions === 'object' && !Array.isArray(d.ccSessions)) out.ccSessions = d.ccSessions;
    if (Array.isArray(d.ccFiles)) {
      out.ccFiles = d.ccFiles.filter(function (f) { return f && typeof f.name === 'string' && typeof f.content === 'string'; })
        .slice(0, 40).map(function (f) {
          return { id: String(f.id || ''), name: f.name.slice(0, 60), content: f.content.slice(0, 200000) };
        });
    }
    if (Array.isArray(d.ccLogs)) {
      out.ccLogs = d.ccLogs.filter(function (l) { return l && Array.isArray(l.messages); })
        .slice(0, 10).map(function (l) {
          return {
            id: String(l.id || ''), title: String(l.title || 'Untitled').slice(0, 60), when: +l.when || Date.now(),
            messages: l.messages.filter(function (m) { return m && typeof m.content === 'string'; })
              .slice(-40).map(function (m) {
                return { role: m.role === 'user' ? 'user' : 'assistant', content: m.content.slice(0, 20000) };
              })
          };
        });
    }
    if (d.darkMode && typeof d.darkMode === 'object') out.darkMode = { on: d.darkMode.on !== false };
    if (Array.isArray(d.darkSkip)) {
      out.darkSkip = d.darkSkip.filter(function (h) { return typeof h === 'string' && /^[a-z0-9.-]+$/i.test(h); });
    }
    if (Array.isArray(d.wallpaperCollections)) {
      var seenWallNames = {}, seenWallIds = {};
      out.wallpaperCollections = d.wallpaperCollections.filter(function (c) {
        if (!c || typeof c.name !== 'string' || !c.name.trim() || !Array.isArray(c.wallpapers)) return false;
        var name = c.name.trim().toLowerCase(), id = String(c.id || '');
        if (seenWallNames[name] || (id && seenWallIds[id])) return false;
        seenWallNames[name] = true; if (id) seenWallIds[id] = true; return true;
      }).slice(0, 8).map(function (c, i) {
        var seenModes = {};
        return { id: String(c.id || ('wall-' + i)).slice(0, 48), name: c.name.trim().slice(0, 24),
          wallpapers: c.wallpapers.filter(function (id) { if (WALL_IDS.indexOf(id) < 0 || seenModes[id]) return false; seenModes[id] = true; return true; }).slice(0, 20) };
      });
    }
    if (typeof d.activeWallpaperCollection === 'string' && Array.isArray(out.wallpaperCollections) &&
        out.wallpaperCollections.some(function (c) { return c.id === d.activeWallpaperCollection; })) out.activeWallpaperCollection = d.activeWallpaperCollection;
    out.wallpaperRotation = !!d.wallpaperRotation && !!out.activeWallpaperCollection;
    if (isFinite(+d.wallpaperRotationIndex) && +d.wallpaperRotationIndex >= 0) out.wallpaperRotationIndex = Math.floor(+d.wallpaperRotationIndex) % 20;
    if (WALL_IDS.indexOf(d.wallMode) >= 0) out.wallMode = d.wallMode;
    else if (d.wallMode === 'custom') out.wallMode = 'aurora';
    if (d.motion === 'on' || d.motion === 'off') out.motion = d.motion;
    if (d.assistant && typeof d.assistant === 'object') {
      var a = d.assistant;
      out.assistant = {
        name: String(a.name || 'Nova').slice(0, 20),
        model: /^[\w.:\/-]+$/.test(String(a.model || '')) ? String(a.model).slice(0, 60) : 'claude-haiku-4-5',
        speak: a.speak !== false,
        wake: !!a.wake,
        contextEnabled: !!a.contextEnabled
      };
    }
    if (d.autoSuspend && typeof d.autoSuspend === 'object') {
      out.autoSuspend = { on: !!d.autoSuspend.on, minutes: parseInt(d.autoSuspend.minutes, 10) || 20 };
    }
    if (typeof d.theme === 'string' && THEMES.indexOf(d.theme) >= 0) out.theme = d.theme;
    if (d.weather && typeof d.weather === 'object') {
      var w = d.weather, ok = {};
      ok.unit = w.unit === 'f' ? 'f' : 'c';
      var ci = w.city;
      ok.city = (ci && typeof ci.name === 'string' && isFinite(ci.lat) && isFinite(ci.lon) && typeof ci.tz === 'string')
        ? { name: ci.name.slice(0, 80), lat: +ci.lat, lon: +ci.lon, tz: ci.tz.slice(0, 60) } : null;
      var c2 = w.city2;
      ok.city2 = (c2 && typeof c2.name === 'string' && typeof c2.tz === 'string')
        ? { name: c2.name.slice(0, 80), tz: c2.tz.slice(0, 60) } : null;
      out.weather = ok;
    }
    return out;
  }

  $('bkImport').addEventListener('change', function (e) {
    var f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    f.text().then(function (txt) {
      var obj;
      try { obj = JSON.parse(txt); } catch (err) { say('That file is not a valid backup.', true); return; }
      if (!obj || obj.app !== 'my-launcher' || !obj.data) { say('That file is not a launcher backup.', true); return; }
      if (!window.confirm('This replaces your current shortcuts, notes, sessions and settings with the backup. Continue?')) return;
      var data = clean(obj.data);
      try {
        ['theme', 'wallMode', 'motion'].forEach(function (k) {
          if (data[k]) localStorage.setItem(k, data[k]); else localStorage.removeItem(k);
        });
      } catch (e) {}
      chrome.storage.local.remove(KEYS, function () {
        chrome.storage.local.set(data, function () {
          chrome.runtime.sendMessage({ type: 'reregister' }, function () {
            void chrome.runtime.lastError;
            location.reload();
          });
        });
      });
    }).catch(function () { say('Could not read that file.', true); });
  });
})();
