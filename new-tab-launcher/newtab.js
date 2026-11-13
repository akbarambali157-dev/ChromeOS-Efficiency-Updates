(function () {
  'use strict';

  var DEFAULTS = [
    { name: 'Gmail', url: 'https://mail.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Claude', url: 'https://claude.ai' },
    { name: 'Drive', url: 'https://drive.google.com' }
  ];

  var shortcuts = [];
  var workspaces = [];
  var activeWorkspace = 'Default';
  var editIndex = -1;
  var rendered = false;

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), dlg = $('dlg');
  var railBtn = $('railBtn'), railPanel = $('railPanel'), addBtn = $('addBtn');

  /* ---------- Clock ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var d = new Date(), h = d.getHours();
    $('time').textContent = pad(h) + ':' + pad(d.getMinutes());
    $('date').textContent = d.toLocaleDateString(undefined,
      { weekday: 'long', day: 'numeric', month: 'long' });
    $('greeting').textContent =
      h < 12 ? 'Good morning \u2600\uFE0F' : h < 17 ? 'Good afternoon \uD83C\uDF24\uFE0F' : 'Good evening \uD83C\uDF19';
  }
  tick();
  /* The display shows minutes, so a 60-second cadence is sufficient. */
  setInterval(function () { if (!document.hidden) tick(); }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tick();
  });

  /* ---------- Shortcuts ---------- */
  function normalizeUrl(u) {
    u = u.trim();
    return /^https?:\/\//i.test(u) ? u : 'https://' + u;
  }
  function hostOf(u) {
    try { return new URL(u).hostname; } catch (e) { return ''; }
  }
  function persistWorkspace() {
    var current = workspaces.find(function (w) { return w.name === activeWorkspace; });
    if (current) current.shortcuts = shortcuts.map(function (s) { return { name: s.name, url: s.url }; });
    chrome.storage.local.set({ shortcuts: shortcuts, workspaces: workspaces, activeWorkspace: activeWorkspace });
  }
  function renderWorkspaceControls() {
    var select = $('workspaceSelect');
    select.textContent = '';
    workspaces.forEach(function (w) {
      var option = document.createElement('option');
      option.value = w.name;
      option.textContent = w.name;
      select.appendChild(option);
    });
    select.value = activeWorkspace;
    $('workspaceCount').textContent = workspaces.length + (workspaces.length === 1 ? ' profile' : ' profiles');
    $('workspaceDelete').disabled = workspaces.length <= 1;
  }
  function setWorkspace(name) {
    var target = workspaces.find(function (w) { return w.name === name; });
    if (!target) return;
    activeWorkspace = target.name;
    shortcuts = target.shortcuts.map(function (s) { return { name: s.name, url: s.url }; });
    chrome.storage.local.set({ shortcuts: shortcuts, workspaces: workspaces, activeWorkspace: activeWorkspace });
    renderWorkspaceControls();
    render();
    $('workspaceStatus').textContent = 'Switched to ' + activeWorkspace + '.';
  }
  $('workspaceSelect').addEventListener('change', function () {
    persistWorkspace();
    setWorkspace($('workspaceSelect').value);
  });
  var workspaceDialog = $('dlgW');
  $('workspaceSave').addEventListener('click', function () {
    if (workspaces.length >= 8) { $('workspaceStatus').textContent = 'You can keep up to 8 workspaces.'; return; }
    $('wName').value = '';
    workspaceDialog.showModal();
    $('wName').focus();
  });
  $('wCancel').addEventListener('click', function () { workspaceDialog.close(); });
  $('dlgWForm').addEventListener('submit', function (event) {
    var name = $('wName').value.trim().slice(0, 24);
    if (!name) return;
    if (workspaces.some(function (w) { return w.name.toLowerCase() === name.toLowerCase(); })) {
      event.preventDefault();
      $('workspaceStatus').textContent = 'A workspace with that name already exists. Choose another name.';
      $('wName').focus();
      return;
    }
    if (workspaces.length >= 8) { event.preventDefault(); $('workspaceStatus').textContent = 'You can keep up to 8 workspaces.'; return; }
    workspaces.push({ name: name, shortcuts: shortcuts.map(function (s) { return { name: s.name, url: s.url }; }) });
    activeWorkspace = name;
    chrome.storage.local.set({ workspaces: workspaces, activeWorkspace: activeWorkspace, shortcuts: shortcuts });
    renderWorkspaceControls();
    $('workspaceStatus').textContent = 'Created ' + name + '.';
  });
  $('workspaceDelete').addEventListener('click', function () {
    if (workspaces.length <= 1) return;
    if (!window.confirm('Delete the ' + activeWorkspace + ' workspace? Its shortcut collection will be removed.')) return;
    workspaces = workspaces.filter(function (w) { return w.name !== activeWorkspace; });
    setWorkspace(workspaces[0].name);
  });

  var RAIL_MAX = 4;
  var railBuilt = false;

  function favicon(ico, host) {
    if (!host) return;
    var img = new Image();
    img.alt = '';
    img.onload = function () { ico.textContent = ''; ico.appendChild(img); };
    img.src = 'https://www.google.com/s2/favicons?sz=64&domain=' + host;
  }

  function tileTools(i) {
    var tools = document.createElement('div');
    tools.className = 'tools';
    var ed = document.createElement('button');
    ed.type = 'button'; ed.title = 'Edit'; ed.setAttribute('aria-label', 'Edit ' + shortcuts[i].name); ed.textContent = '\u270E';
    ed.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); openDialog(i);
    });
    var del = document.createElement('button');
    del.type = 'button'; del.className = 'del'; del.title = 'Remove'; del.setAttribute('aria-label', 'Remove ' + shortcuts[i].name); del.textContent = '\u00D7';
    del.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      shortcuts.splice(i, 1); persistWorkspace(); render();
    });
    tools.appendChild(ed); tools.appendChild(del);
    return tools;
  }

  function makeTile(s, i) {
    var a = document.createElement('a');
    a.className = 'tile' + (rendered ? '' : ' enter');
    a.style.setProperty('--i', i);
    a.href = s.url;
    var ico = document.createElement('div');
    ico.className = 'ico';
    ico.textContent = (s.name[0] || '?').toUpperCase();
    var host = hostOf(s.url);
    favicon(ico, host);
    var txt = document.createElement('div');
    txt.className = 'txt';
    var label = document.createElement('div');
    label.className = 'label';
    label.textContent = s.name;
    var desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = host || s.url;
    txt.appendChild(label); txt.appendChild(desc);
    a.appendChild(ico); a.appendChild(txt); a.appendChild(tileTools(i));
    return a;
  }

  function makeRailRow(s, i) {
    var a = document.createElement('a');
    a.className = 'railrow';
    a.href = s.url;
    var ico = document.createElement('div');
    ico.className = 'ico';
    ico.textContent = (s.name[0] || '?').toUpperCase();
    favicon(ico, hostOf(s.url));
    var label = document.createElement('div');
    label.className = 'label';
    label.textContent = s.name;
    a.appendChild(ico); a.appendChild(label); a.appendChild(tileTools(i));
    return a;
  }

  /* Built on first open only, so an idle new tab pays nothing for the shortcuts
     it is not showing. */
  function buildRail() {
    railPanel.textContent = '';
    shortcuts.slice(RAIL_MAX).forEach(function (s, k) {
      railPanel.appendChild(makeRailRow(s, RAIL_MAX + k));
    });
    railBuilt = true;
  }

  function render() {
    grid.textContent = '';
    shortcuts.slice(0, RAIL_MAX).forEach(function (s, i) {
      grid.appendChild(makeTile(s, i));
    });
    if (shortcuts.length > RAIL_MAX) {
      railBtn.hidden = false;
      railBtn.textContent = 'All shortcuts (' + shortcuts.length + ')';
    } else {
      railBtn.hidden = true;
      railPanel.hidden = true;
    }
    if (railBuilt) buildRail();
    rendered = true;
  }

  addBtn.addEventListener('click', function () { openDialog(-1); });
  railBtn.addEventListener('click', function () {
    if (!railBuilt) buildRail();
    railPanel.hidden = !railPanel.hidden;
  });

  function openDialog(i) {
    editIndex = i;
    $('dlgTitle').textContent = i < 0 ? 'Add shortcut' : 'Edit shortcut';
    $('fName').value = i < 0 ? '' : shortcuts[i].name;
    $('fUrl').value = i < 0 ? '' : shortcuts[i].url;
    dlg.showModal();
    $('fName').focus();
  }
  $('cancel').addEventListener('click', function () { dlg.close(); });
  $('dlgForm').addEventListener('submit', function () {
    var item = { name: $('fName').value.trim(), url: normalizeUrl($('fUrl').value) };
    if (!item.name || !$('fUrl').value.trim()) return;
    if (editIndex < 0) shortcuts.push(item); else shortcuts[editIndex] = item;
    persistWorkspace(); render();
  });

  /* ---------- Notes ---------- */
  var noteTimer;
  $('note').addEventListener('input', function () {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      chrome.storage.local.set({ note: $('note').value });
    }, 300);
  });

  /* ---------- Load ---------- */
  store.get(['shortcuts', 'note', 'workspaces', 'activeWorkspace'], function (data) {
    var saved = Array.isArray(data.workspaces) ? data.workspaces : [];
    var usedNames = {};
    workspaces = saved.filter(function (w) {
      if (!w || typeof w.name !== 'string' || !w.name.trim() || !Array.isArray(w.shortcuts)) return false;
      var key = w.name.trim().toLowerCase();
      if (usedNames[key]) return false;
      usedNames[key] = true;
      return true;
    }).slice(0, 8).map(function (w) {
      return {
        name: w.name.trim().slice(0, 24),
        shortcuts: w.shortcuts.filter(function (s) {
          return s && typeof s.name === 'string' && typeof s.url === 'string' && /^https?:\/\//i.test(s.url);
        }).slice(0, 80).map(function (s) { return { name: s.name.slice(0, 24), url: s.url }; })
      };
    });
    if (!workspaces.length) workspaces = [{
      name: 'Default',
      shortcuts: Array.isArray(data.shortcuts) ? data.shortcuts : DEFAULTS.slice()
    }];
    activeWorkspace = typeof data.activeWorkspace === 'string' &&
      workspaces.some(function (w) { return w.name === data.activeWorkspace; })
      ? data.activeWorkspace : workspaces[0].name;
    var current = workspaces.find(function (w) { return w.name === activeWorkspace; });
    shortcuts = current.shortcuts.map(function (s) { return { name: s.name, url: s.url }; });
    $('note').value = data.note || '';
    renderWorkspaceControls();
    chrome.storage.local.set({ shortcuts: shortcuts, workspaces: workspaces, activeWorkspace: activeWorkspace });
    render();
  });
})();
