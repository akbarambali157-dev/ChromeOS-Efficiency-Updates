(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var sessions = [], closeAfter = false, tmr;

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
  function save() { chrome.storage.local.set({ sessions: sessions }); }

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
    var urls = s.tabs.map(function (t) { return t.url; });
    if (!urls.length) return;
    chrome.windows.create({ url: urls }).then(function (w) {
      // keep only the first tab loaded; the rest load when you click them
      (w.tabs || []).slice(1).forEach(function (t) {
        chrome.tabs.discard(t.id).catch(function () {});
      });
    });
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
    var name = $('sName').value.trim();
    if (!name) return;
    chrome.tabs.query({ currentWindow: true }).then(function (tabs) {
      var keep = tabs.filter(function (t) { return /^https?:\/\//i.test(t.url || ''); });
      if (!keep.length) { say('No web tabs to save in this window.'); return; }
      sessions.unshift({
        id: Date.now(), name: name, saved: new Date().toISOString(),
        tabs: keep.map(function (t) { return { title: t.title || t.url, url: t.url }; })
      });
      save(); render();
      if (closeAfter) {
        chrome.tabs.remove(keep.map(function (t) { return t.id; }));
        say('Saved \u201C' + name + '\u201D and closed ' + keep.length + ' tabs.');
      } else {
        say('Saved \u201C' + name + '\u201D (' + keep.length + ' tabs).');
      }
    });
  });

  chrome.storage.local.get('sessions', function (d) {
    sessions = Array.isArray(d.sessions) ? d.sessions : [];
    render();
  });
})();
