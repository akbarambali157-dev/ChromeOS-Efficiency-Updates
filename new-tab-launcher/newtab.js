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
  setInterval(tick, 15000);

  /* ---------- Shortcuts ---------- */
  function normalizeUrl(u) {
    u = u.trim();
    return /^https?:\/\//i.test(u) ? u : 'https://' + u;
  }
  function hostOf(u) {
    try { return new URL(u).hostname; } catch (e) { return ''; }
  }
  function save() { chrome.storage.local.set({ shortcuts: shortcuts }); }

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
    ed.type = 'button'; ed.title = 'Edit'; ed.textContent = '\u270E';
    ed.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); openDialog(i);
    });
    var del = document.createElement('button');
    del.type = 'button'; del.className = 'del'; del.title = 'Remove'; del.textContent = '\u00D7';
    del.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      shortcuts.splice(i, 1); save(); render();
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
    save(); render();
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
  store.get(['shortcuts', 'note'], function (data) {
    shortcuts = Array.isArray(data.shortcuts) ? data.shortcuts : DEFAULTS.slice();
    if (!Array.isArray(data.shortcuts)) save();
    $('note').value = data.note || '';
    render();
  });
})();
