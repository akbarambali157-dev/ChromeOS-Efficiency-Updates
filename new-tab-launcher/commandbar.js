(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var input = $('q'), box = $('sugg'), form = $('searchForm');
  var shortcuts = [], sel = 0, items = [], openTabs = [];

  var normalizeUrl = window.LauncherUtils.normalizeUrl;
  function looksLikeUrl(v) { return /^https?:\/\/\S+$/i.test(v) || /^[^\s\/]+\.[a-z]{2,}(\/\S*)?$/i.test(v); }
  function go(url) { location.href = url; }

  var C = [];
  function add(label, hint, keys, run) { C.push({ label: label, hint: hint, keys: keys, run: run }); }
  function link(label, hint, keys, url) { add(label, hint, keys, function () { go(url); }); }

  link('GitHub dashboard', 'page', 'gh github git dashboard codespaces', 'github.html');
  link('Open github.com', 'site', 'gh github site home', 'https://github.com');
  link('GitHub pull requests', 'site', 'gh github prs pulls pull requests', 'https://github.com/pulls');
  link('GitHub issues', 'site', 'gh github issues', 'https://github.com/issues');
  link('GitHub repositories', 'site', 'gh github repos repositories', 'https://github.com?tab=repositories');
  link('GitHub notifications', 'site', 'gh github notifications inbox', 'https://github.com/notifications');
  link('GitHub codespaces', 'site', 'gh github codespaces codespace', 'https://github.com/codespaces');
  link('GitHub new repository', 'site', 'gh github new create repo repository', 'https://github.com/new');

  link('Brewkeg page', 'page', 'brewkeg usage tokens', 'brewkeg.html');
  link('Brewkeg requests', 'site', 'brewkeg requests usage dashboard', 'https://brewkeg.dev/dashboard/requests');
  link('Claude Code sessions', 'page', 'claude code sessions tokens usage', 'sessions.html');
  link('Files and clean-up', 'page', 'files folder cleanup clean duplicates storage', 'files.html');
  link('Assistant', 'page', 'assistant ai voice talk ask nova jarvis', 'assistant.html');
  link('Memory monitor', 'page', 'memory ram tabs usage monitor', 'memory.html');
  link('Drive page', 'page', 'drive google files dashboard', 'drive.html');
  link('Open Google Drive', 'site', 'drive google files home', 'https://drive.google.com');
  link('Drive recent files', 'site', 'drive recent', 'https://drive.google.com/drive/recent');
  link('Drive shared with me', 'site', 'drive shared', 'https://drive.google.com/drive/shared-with-me');
  link('Drive starred', 'site', 'drive starred', 'https://drive.google.com/drive/starred');
  link('New Google Doc', 'create', 'drive new create doc document docs', 'https://docs.google.com/document/create');
  link('New Google Sheet', 'create', 'drive new create sheet spreadsheet sheets', 'https://docs.google.com/spreadsheets/create');
  link('New Google Slides', 'create', 'drive new create slides presentation', 'https://docs.google.com/presentation/create');
  link('New Google Form', 'create', 'drive new create form forms', 'https://docs.google.com/forms/create');

  add('Close duplicate tabs', 'tool', 'tools dupes duplicate tabs close', function () { $('tDupes').click(); });
  add('Save open tabs as a session', 'tool', 'session sessions save tabs', function () { $('sSave').click(); });
  add('Save tabs and close them', 'tool', 'session sessions save close tabs', function () { $('sSaveClose').click(); });
  add('Export launcher backup', 'tool', 'backup export save settings', function () { $('bkExport').click(); });
  add('Free up memory', 'tool', 'tools memory free suspend ram tabs', function () { $('tMem').click(); });
  add('Add a task', 'tool', 'task tasks todo to-do list', function () { var el = $('taskTitle'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); } });

  function tokens(s) { return s.toLowerCase().split(/\s+/).filter(Boolean); }
  function matches(hay, toks) {
    hay = hay.toLowerCase();
    return toks.every(function (t) { return hay.indexOf(t) !== -1; });
  }
  function startsWithAny(keys, t) {
    return keys.split(' ').some(function (k) { return k.indexOf(t) === 0; });
  }

  function build(q) {
    var out = [];
    var toks = tokens(q);
    if (!toks.length) return out;
    if (looksLikeUrl(q.trim())) {
      out.push({ t: 'Go to ' + q.trim(), k: 'address', run: function () { go(normalizeUrl(q)); } });
    }
    // commands: every word must match a key word beginning or the label
    C.forEach(function (c) {
      var ok = toks.every(function (t) {
        return startsWithAny(c.keys, t) || c.label.toLowerCase().indexOf(t) !== -1;
      });
      if (ok && out.length < 6) out.push({ t: c.label, k: c.hint, run: c.run });
    });
    // your shortcuts
    shortcuts.forEach(function (s) {
      if (out.length < 8 && matches(s.name, toks)) out.push({ t: s.name, k: 'shortcut', url: s.url, run: function () { go(s.url); } });
    });
    // open tabs
    var n = 0;
    openTabs.forEach(function (t) {
      if (n < 3 && toks[0].length >= 2 && matches((t.title || '') + ' ' + (t.url || ''), toks)) {
        n++;
        out.push({
          t: t.title || t.url, k: 'open tab', url: t.url,
          run: function () {
            chrome.tabs.update(t.id, { active: true });
            chrome.windows.update(t.windowId, { focused: true });
          }
        });
      }
    });
    out.push({
      t: 'Search Google for \u201C' + q.trim() + '\u201D', k: 'search',
      run: function () { go('https://www.google.com/search?q=' + encodeURIComponent(q.trim())); }
    });
    return out;
  }

  function paint() {
    box.textContent = '';
    items.forEach(function (it, i) {
      var li = document.createElement('li');
      if (i === sel) li.className = 'sel';
      var t = document.createElement('span'); t.className = 't'; t.textContent = it.t;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = it.k;
      li.appendChild(t); li.appendChild(k);
      li.addEventListener('mousedown', function (e) { e.preventDefault(); it.run(); });
      box.appendChild(li);
    });
    box.hidden = !items.length;
  }

  var augTimer;
  function augment(q) {
    Promise.all([
      chrome.bookmarks.search(q),
      chrome.history.search({ text: q, maxResults: 25, startTime: 0 })
    ]).then(function (r) {
      if (input.value.trim() !== q || !items.length) return;
      var have = {};
      items.forEach(function (it) { if (it.url) have[it.url] = 1; });
      var extra = [];
      function take(list, kind, max) {
        var n = 0;
        list.forEach(function (x) {
          if (n >= max || !x.url || !/^https?:\/\//i.test(x.url) || have[x.url]) return;
          have[x.url] = 1; n++;
          extra.push({ t: x.title || x.url, k: kind, url: x.url, run: function () { go(x.url); } });
        });
      }
      take(r[0], 'bookmark', 3);
      take(r[1], 'history', 3);
      if (!extra.length) return;
      var last = items.length - 1, wasLast = sel === last;
      items = items.slice(0, last).concat(extra, items.slice(last));
      sel = wasLast ? items.length - 1 : sel;
      paint();
    }).catch(function () {});
  }

  function update() {
    items = build(input.value);
    sel = 0;
    paint();
    clearTimeout(augTimer);
    var q = input.value.trim();
    if (q.length >= 2) augTimer = setTimeout(function () { augment(q); }, 150);
  }

  input.addEventListener('input', update);
  /* Tab suggestions are fetched lazily and once: a full chrome.tabs.query on
     every new tab was the main cause of slowdown with many tabs open. */
  var tabsAsked = false, tabsTimer;
  function askForTabs() {
    if (tabsAsked) return;
    tabsAsked = true;
    clearTimeout(tabsTimer);
    tabsTimer = setTimeout(function () {
      try {
        chrome.runtime.sendMessage({ type: 'getTabs' }, function (list) {
          if (chrome.runtime.lastError || !Array.isArray(list)) return;
          openTabs = list;
        });
      } catch (e) {}
    }, 250);
  }
  input.addEventListener('focus', askForTabs);
  input.addEventListener('blur', function () { box.hidden = true; });
  input.addEventListener('keydown', function (e) {
    if (box.hidden || !items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % items.length; paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; paint(); }
    else if (e.key === 'Escape') { box.hidden = true; }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!items.length) update();
    if (items[sel]) items[sel].run();
  });

  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); input.focus(); }
  });

  chrome.storage.local.get('shortcuts', function (d) {
    shortcuts = Array.isArray(d.shortcuts) ? d.shortcuts : [];
  });
})();
