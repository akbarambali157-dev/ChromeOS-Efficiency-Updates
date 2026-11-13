(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  /* The theme engine owns the allow-lists; backup validation reuses them. */
  var WALL_IDS = window.WALLPAPER_MODES;
  var THEMES = window.LAUNCHER_THEME_IDS;

  /* ---------- Memory gauge ---------- */
  var gauge = makeGauge($('memGauge'));
  var gb = window.LauncherUtils.formatGiB;
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
    var minutes = parseInt($('asMin').value, 10);
    if ([10, 20, 30, 60].indexOf(minutes) < 0) minutes = 20;
    $('asMin').value = String(minutes);
    chrome.storage.local.set({ autoSuspend: { on: $('asOn').checked, minutes: minutes } }, function () {
      chrome.runtime.sendMessage({ type: 'autoSuspendConfigChanged' }, function () {
        void chrome.runtime.lastError;
      });
    });
  }
  chrome.storage.local.get('autoSuspend', function (d) {
    var c = d.autoSuspend || { on: false, minutes: 20 };
    var minutes = Number(c.minutes);
    if ([10, 20, 30, 60].indexOf(minutes) < 0) minutes = 20;
    $('asOn').checked = !!c.on;
    $('asMin').value = String(minutes);
  });
  $('asOn').addEventListener('change', saveAS);
  $('asMin').addEventListener('change', saveAS);

  /* ---------- Backup ---------- */
  var KEYS = ['layoutPrefs', 'accessibilityPrefs', 'customPalette', 'wallpaperCollections', 'activeWallpaperCollection', 'wallpaperRotation', 'wallpaperRotationIndex', 'shortcuts', 'workspaces', 'activeWorkspace', 'note', 'tasks', 'sessions', 'ccSessions', 'darkMode', 'darkSkip', 'autoSuspend', 'theme', 'themeMode', 'weather', 'wallMode', 'motion', 'assistant', 'ccFiles', 'ccLogs', 'launcherMarketplaceInstalled', 'launcherMarketplaceFavourites', 'launcherMarketplaceProfile'];
  var MINI_APP_VERSIONS = {
    'research-library':'1.0.0','pdf-reader':'1.0.0','citation-manager':'1.0.0',
    'focus-timer':'1.0.0','markdown-editor':'1.0.0','json-studio':'1.0.0',
    'quick-notes':'1.0.0','mini-kanban':'1.0.0','study-planner':'1.0.0',
    'flashcard-studio':'1.0.0','advanced-calculator':'1.0.0','colour-studio':'1.0.0'
  };
  var MINI_APP_LIMITS = {
    'research-library':262144,'pdf-reader':65536,'citation-manager':262144,
    'focus-timer':65536,'markdown-editor':262144,'json-studio':65536,
    'quick-notes':262144,'mini-kanban':131072,'study-planner':131072,
    'flashcard-studio':262144,'advanced-calculator':16384,'colour-studio':16384
  };
  function openMiniAppDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open('my-launcher-miniapps', 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains('apps')) req.result.createObjectStore('apps', { keyPath: 'appId' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || Error('Mini-app data database unavailable.')); };
    });
  }
  function readMiniAppData() {
    return openMiniAppDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        if (!db.objectStoreNames.contains('apps')) { db.close(); resolve([]); return; }
        var tx = db.transaction('apps', 'readonly'), req = tx.objectStore('apps').getAll();
        req.onsuccess = function () { db.close(); resolve(Array.isArray(req.result) ? req.result : []); };
        req.onerror = function () { db.close(); reject(req.error || Error('Could not read mini-app data.')); };
      });
    }).catch(function (e) {
      if (e && e.name === 'NotFoundError') return [];
      throw e;
    });
  }
  function cleanMiniAppData(raw) {
    if (!Array.isArray(raw) || raw.length > 12) throw Error('Mini-app backup contains an invalid number of app records.');
    var seen = {}, out = [], total = 0;
    raw.forEach(function (record) {
      if (!record || typeof record.appId !== 'string' || !Object.prototype.hasOwnProperty.call(MINI_APP_LIMITS, record.appId) ||
          seen[record.appId] || !record.value || typeof record.value !== 'object' || Array.isArray(record.value)) {
        throw Error('Mini-app backup contains an invalid or duplicate app record.');
      }
      var json;
      try { json = JSON.stringify(record.value); } catch (e) { throw Error('Mini-app backup data is not valid JSON.'); }
      var bytes = new Blob([json]).size;
      if (bytes > MINI_APP_LIMITS[record.appId]) throw Error('Mini-app data for ' + record.appId + ' exceeds its size limit.');
      total += bytes;
      if (total > 1572864) throw Error('Mini-app backup data exceeds the 1.5 MB total limit.');
      seen[record.appId] = true;
      out.push({ appId: record.appId, value: record.value, updatedAt: isFinite(+record.updatedAt) ? +record.updatedAt : Date.now() });
    });
    return out;
  }
  function replaceMiniAppData(records) {
    return openMiniAppDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('apps', 'readwrite'), store = tx.objectStore('apps');
        store.clear();
        records.forEach(function (record) { store.put(record); });
        tx.oncomplete = function () { db.close(); resolve(); };
        tx.onerror = function () { db.close(); reject(tx.error || Error('Could not restore mini-app data.')); };
        tx.onabort = function () { db.close(); reject(tx.error || Error('Mini-app data restore was cancelled.')); };
      });
    });
  }
  function say(msg, err) { var s = $('bkStatus'); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : ''); }
  function isWeb(u) { return typeof u === 'string' && /^https?:\/\//i.test(u); }
  function isDateKey(v) {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var p = v.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
    return d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2];
  }

  $('bkExport').addEventListener('click', function () {
    chrome.storage.local.get(KEYS, function (data) {
      readMiniAppData().then(function (records) {
        data.miniAppData = cleanMiniAppData(records);
        var blob = new Blob([JSON.stringify({ app: 'my-launcher', v: 1, data: data }, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'launcher-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        say('Backup downloaded, including installed mini-apps and their local data. Credentials are excluded.');
      }).catch(function () { say('Could not read mini-app data, so no incomplete backup was created.', true); });
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
    /* Claude usage imports are untrusted JSON too. Keep the shape small and
       numeric fields finite so malformed backups cannot poison the Sessions
       page or inflate local storage unexpectedly. */
    if (d.ccSessions && typeof d.ccSessions === 'object' && !Array.isArray(d.ccSessions)) {
      var usage = {}, sessionKeys = Object.keys(d.ccSessions).slice(0, 500);
      function count(v) {
        var n = Number(v);
        return isFinite(n) && n >= 0 ? Math.min(Math.floor(n), 1000000000000) : 0;
      }
      sessionKeys.forEach(function (key) {
        var s = d.ccSessions[key];
        if (!s || typeof s !== 'object' || Array.isArray(s)) return;
        var models = {};
        if (s.models && typeof s.models === 'object' && !Array.isArray(s.models)) {
          Object.keys(s.models).slice(0, 20).forEach(function (model) {
            if (typeof model === 'string') models[model.slice(0, 80)] = count(s.models[model]);
          });
        }
        var id = String(s.id || key).slice(0, 160);
        usage[id] = {
          id: id,
          project: typeof s.project === 'string' ? s.project.slice(0, 120) : '',
          first: typeof s.first === 'string' ? s.first.slice(0, 40) : null,
          last: typeof s.last === 'string' ? s.last.slice(0, 40) : null,
          input: count(s.input), output: count(s.output),
          cacheW: count(s.cacheW), cacheR: count(s.cacheR),
          turns: count(s.turns), models: models
        };
      });
      out.ccSessions = usage;
    }
    if (Array.isArray(d.ccFiles)) {
      out.ccFiles = d.ccFiles.filter(function (f) { return f && typeof f.name === 'string' && typeof f.content === 'string'; })
        .slice(0, 40).map(function (f) {
          return { id: String(f.id || ''), name: f.name.slice(0, 60), content: f.content.slice(0, 200000), attached: f.attached !== false };
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
      var mins = Number(d.autoSuspend.minutes);
      if ([10, 20, 30, 60].indexOf(mins) < 0) mins = 20;
      out.autoSuspend = { on: !!d.autoSuspend.on, minutes: mins };
    }
    if (typeof d.theme === 'string' && THEMES.indexOf(d.theme) >= 0) out.theme = d.theme;
    if (d.themeMode === 'auto' || d.themeMode === 'fixed') out.themeMode = d.themeMode;
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
    if (d.launcherMarketplaceInstalled && typeof d.launcherMarketplaceInstalled === 'object' && !Array.isArray(d.launcherMarketplaceInstalled)) {
      var installed = {};
      Object.keys(d.launcherMarketplaceInstalled).slice(0, 12).forEach(function (id) {
        var r = d.launcherMarketplaceInstalled[id];
        if (Object.prototype.hasOwnProperty.call(MINI_APP_VERSIONS, id) && r && r.version === MINI_APP_VERSIONS[id] &&
            r.runtime === 'bundled' && isFinite(+r.installedAt)) {
          installed[id] = { version: r.version, runtime: 'bundled', installedAt: +r.installedAt };
        }
      });
      out.launcherMarketplaceInstalled = installed;
    }
    if (Array.isArray(d.launcherMarketplaceFavourites)) {
      out.launcherMarketplaceFavourites = d.launcherMarketplaceFavourites.filter(function (id, i, a) {
        return Object.prototype.hasOwnProperty.call(MINI_APP_VERSIONS, id) && a.indexOf(id) === i;
      }).slice(0, 12);
    }
    if (['conservative', 'balanced', 'unrestricted'].indexOf(d.launcherMarketplaceProfile) >= 0) {
      out.launcherMarketplaceProfile = d.launcherMarketplaceProfile;
    }
    if (Object.prototype.hasOwnProperty.call(d, 'miniAppData')) out.miniAppData = cleanMiniAppData(d.miniAppData);
    return out;
  }

  $('bkImport').addEventListener('change', function (e) {
    var f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    /* Current exports can contain editor files and chat history, but should
       remain bounded. Reject oversized input before reading it into memory. */
    if (f.size > 20 * 1024 * 1024) { say('That backup is too large to import (20 MB maximum).', true); return; }
    f.text().then(function (txt) {
      var obj;
      try { obj = JSON.parse(txt); } catch (err) { say('That file is not a valid backup.', true); return; }
      if (!obj || obj.app !== 'my-launcher' || !obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data) ||
          (obj.v != null && obj.v !== 1)) {
        say('That file is not a supported launcher backup.', true); return;
      }
      var data;
      try { data = clean(obj.data); } catch (err) { say('Backup validation failed: ' + err.message, true); return; }
      var appData = Object.prototype.hasOwnProperty.call(data, 'miniAppData') ? data.miniAppData : null;
      delete data.miniAppData;
      if (!window.confirm('This replaces your current launcher settings and app registrations. ' +
          (appData ? 'It also replaces local data for the bundled mini-apps. ' : '') + 'Continue?')) return;
      /* Validate first, write extension settings, then replace IndexedDB app
         records in one transaction. Older backups without miniAppData preserve
         current app data rather than silently erasing it. */
      chrome.storage.local.set(data, function () {
        if (chrome.runtime.lastError) { say('Could not restore the backup: ' + chrome.runtime.lastError.message, true); return; }
        function finishRestore() {
          try {
            ['theme', 'themeMode', 'wallMode', 'motion'].forEach(function (k) {
              if (data[k]) localStorage.setItem(k, data[k]); else localStorage.removeItem(k);
            });
          } catch (e) {}
          var remove = KEYS.filter(function (k) { return !Object.prototype.hasOwnProperty.call(data, k); });
          chrome.storage.local.remove(remove, function () {
            if (chrome.runtime.lastError) { say('Backup data was restored, but some old settings could not be cleared.', true); return; }
            chrome.runtime.sendMessage({ type: 'reregister' }, function () {
              void chrome.runtime.lastError;
              location.reload();
            });
          });
        }
        if (appData) {
          replaceMiniAppData(appData).then(finishRestore).catch(function (err) {
            say('Launcher settings were restored, but mini-app data could not be restored: ' + err.message, true);
          });
        } else finishRestore();
      });
    }).catch(function () { say('Could not read that file.', true); });
  });
})();
