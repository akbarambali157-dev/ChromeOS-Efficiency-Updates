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
  var KEYS = ['shortcuts', 'note', 'sessions', 'ccSessions', 'darkMode', 'darkSkip', 'autoSuspend', 'theme', 'weather', 'wallMode', 'motion', 'assistant', 'ccFiles', 'ccLogs'];
  /* All fourteen themes, day pair included: a backup used to silently drop a
     day theme because only the nine night ones were listed here. */
  var THEMES = [
    'slate', 'aurora', 'sunset', 'ocean', 'neon', 'midnight', 'forest', 'plum', 'ember',
    'void', 'dayblue', 'daygold', 'dayamber', 'dayviolet'
  ];
  function say(msg, err) { var s = $('bkStatus'); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : ''); }
  function isWeb(u) { return typeof u === 'string' && /^https?:\/\//i.test(u); }

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
    if (typeof d.note === 'string') out.note = d.note;
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
    if (WALL_IDS.indexOf(d.wallMode) >= 0) out.wallMode = d.wallMode;
    else if (d.wallMode === 'custom') out.wallMode = 'aurora';
    if (d.motion === 'on' || d.motion === 'off') out.motion = d.motion;
    if (d.assistant && typeof d.assistant === 'object') {
      var a = d.assistant;
      out.assistant = {
        name: String(a.name || 'Nova').slice(0, 20),
        model: /^[\w.:\/-]+$/.test(String(a.model || '')) ? String(a.model).slice(0, 60) : 'claude-haiku-4-5',
        speak: a.speak !== false,
        wake: !!a.wake
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
