(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var sessions = [], closeAfter = false, tmr;
  var MAX_SESSIONS = 100, MAX_TABS = 200;

  function say(msg) {
    var el = $('sStatus');
    el.textContent = msg || '';
    clearTimeout(tmr);
    if (msg) tmr = setTimeout(function () { el.textContent = ''; }, 4000);
  }
  function ago(iso) {
    var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if (h < 48) return h + ' h ago';
    return Math.round(h / 24) + ' days ago';
  }
  function save(callback) {
    chrome.storage.local.set({ sessions: sessions }, function () {
      var ok = !chrome.runtime.lastError;
      if (callback) callback(ok);
    });
  }

  function render() {
    var list = $('sessList');
    list.textContent = '';
    sessions.forEach(function (s, i) {
      var row = document.createElement('div');
      row.className = 'cs row-item';
      var left = document.createElement('div');
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = s.name;
      var meta = document.createElement('div'); meta.className = 'meta';
      meta.textContent = s.tabs.length + (s.tabs.length === 1 ? ' tab' : ' tabs') + ' \u2022 saved ' + ago(s.saved);
      left.appendChild(nm); left.appendChild(meta);

      var btns = document.createElement('div'); btns.className = 'rowbtns';
      var open = document.createElement('button');
      open.type = 'button'; open.className = 'go'; open.textContent = 'Open';
      open.addEventListener('click', function () { openSession(s); });
      var del = document.createElement('button');
      del.type = 'button'; del.className = 'x'; del.title = 'Delete session'; del.textContent = '\u00D7';
      del.addEventListener('click', function () { sessions.splice(i, 1); save(); render(); });
      btns.appendChild(open); btns.appendChild(del);

      row.appendChild(left); row.appendChild(btns);
      list.appendChild(row);
    });
  }

  function openSession(s) {
    var tabs = Array.isArray(s.tabs) ? s.tabs.filter(function (t) {
      return t && typeof t.url === 'string' && /^https?:\/\//i.test(t.url);
    }) : [];
    if (tabs.length > MAX_TABS) { say('This session has more than ' + MAX_TABS + ' web tabs. Split it before restoring.'); return; }
    var urls = tabs.map(function (t) { return t.url; });
    if (!urls.length) { say('This session has no restorable web tabs.'); return; }
    chrome.windows.create({ url: urls }).then(function (w) {
      // Keep the restored background tabs discarded where Chrome permits it.
      (w.tabs || []).slice(1).forEach(function (t) {
        chrome.tabs.discard(t.id).catch(function () {});
      });
    }).catch(function () { say('Chrome could not restore that session.'); });
  }

  function startSave(close) {
    closeAfter = close;
    $('sName').value = '';
    $('dlgS').showModal();
    $('sName').focus();
  }
  $('sSave').addEventListener('click', function () { startSave(false); });
  $('sSaveClose').addEventListener('click', function () { startSave(true); });
  $('sCancel').addEventListener('click', function () { $('dlgS').close(); });

  $('dlgSForm').addEventListener('submit', function () {
    var name = $('sName').value.trim().slice(0, 40);
    if (!name) return;
    if (sessions.length >= MAX_SESSIONS) { say('Session limit reached (' + MAX_SESSIONS + '). Delete an old session first.'); return; }
    chrome.tabs.query({ currentWindow: true }).then(function (tabs) {
      var keep = tabs.filter(function (t) { return /^https?:\/\//i.test(t.url || ''); });
      if (!keep.length) { say('No web tabs to save in this window.'); return; }
      if (keep.length > MAX_TABS) { say('This window has more than ' + MAX_TABS + ' web tabs. Close or split some tabs before saving.'); return; }
      var entry = {
        id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        name: name, saved: new Date().toISOString(),
        tabs: keep.map(function (t) { return { title: String(t.title || t.url).slice(0, 300), url: t.url }; })
      };
      sessions.unshift(entry);
      save(function (ok) {
        if (!ok) {
          sessions = sessions.filter(function (item) { return item.id !== entry.id; });
          render(); say('Could not save this session. Your tabs have been left open.'); return;
        }
        render();
        if (closeAfter) {
          chrome.tabs.remove(keep.map(function (t) { return t.id; })).then(function () {
            say('Saved \u201C' + name + '\u201D and closed ' + keep.length + ' tabs.');
          }).catch(function () { say('Session saved, but Chrome could not close every tab.'); });
        } else {
          say('Saved \u201C' + name + '\u201D (' + keep.length + ' tabs).');
        }
      });
    }).catch(function () { say('Could not read the tabs in this window.'); });
  });

  chrome.storage.local.get('sessions', function (d) {
    sessions = Array.isArray(d.sessions) ? d.sessions.filter(function (s) {
      return s && typeof s.name === 'string' && Array.isArray(s.tabs);
    }).map(function (s, i) {
      return {
        id: String(s.id || ('session-' + i)), name: s.name.trim().slice(0, 40),
        saved: typeof s.saved === 'string' ? s.saved : new Date(0).toISOString(),
        tabs: s.tabs.filter(function (t) { return t && typeof t.url === 'string' && /^https?:\/\//i.test(t.url); })
          .map(function (t) { return { title: String(t.title || t.url).slice(0, 300), url: t.url }; })
      };
    }) : [];
    render();
  });
})();
