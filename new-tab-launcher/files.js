(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var root = null, files = [], groups = null, MAX_FILES = 4000;
  var DAY = 86400000;

  var TYPES = {
    Images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'svg'],
    Video: ['mp4', 'mkv', 'mov', 'avi', 'webm', '3gp'],
    Audio: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'opus'],
    Documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'md'],
    Archives: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz'],
    Installers: ['apk', 'exe', 'msi', 'dmg', 'pkg', 'deb', 'iso'],
    Code: ['js', 'ts', 'py', 'html', 'css', 'json', 'java', 'c', 'cpp', 'go', 'rs', 'sh']
  };
  var JUNK_NAMES = /^(\.ds_store|thumbs\.db|desktop\.ini)$/i;
  var JUNK_EXT = ['tmp', 'crdownload', 'part', 'partial', 'temp', 'download'];

  function say(m, err) { var s = $('fStatus'); s.textContent = m || ''; s.className = 'status' + (err ? ' err' : ''); }
  function ext(n) { var i = n.lastIndexOf('.'); return i > 0 ? n.slice(i + 1).toLowerCase() : ''; }
  function fmt(b) {
    if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
    if (b >= 1048576) return Math.round(b / 1048576) + ' MB';
    if (b >= 1024) return Math.round(b / 1024) + ' KB';
    return b + ' B';
  }
  function age(ms) {
    var d = Math.floor((Date.now() - ms) / DAY);
    if (d < 1) return 'today';
    if (d < 60) return d + ' days old';
    if (d < 700) return Math.round(d / 30) + ' months old';
    return Math.round(d / 365) + ' years old';
  }
  var el = window.LauncherUtils.el;

  /* ---- remember the chosen folder ---- */
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('launcher', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function kvGet(k) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var q = db.transaction('kv').objectStore('kv').get(k);
        q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); };
      });
    });
  }
  function kvSet(k, v) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k);
        tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  function refreshPerm() {
    return root.queryPermission({ mode: 'readwrite' }).then(function (p) {
      var ok = p === 'granted';
      $('reconnect').hidden = ok; $('scanBtn').hidden = !ok;
      say(ok ? 'Folder: ' + root.name + '. Press Scan.' : 'Folder: ' + root.name + '. Press Reconnect to allow access again.');
    });
  }
  $('pick').addEventListener('click', function () {
    window.showDirectoryPicker({ id: 'launcher-files', mode: 'readwrite' }).then(function (h) {
      root = h;
      return kvSet('dir', h).then(refreshPerm);
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return;
      say("Chrome wouldn't open that folder. If it's your main Downloads folder, pick a folder inside it instead.", true);
    });
  });
  $('reconnect').addEventListener('click', function () {
    root.requestPermission({ mode: 'readwrite' }).then(refreshPerm);
  });

  /* ---- scan ---- */
  async function scan() {
    files = [];
    var stack = [{ h: root, p: '' }], truncated = false, n = 0;
    while (stack.length) {
      var cur = stack.pop();
      for await (var entry of cur.h.entries()) {
        var name = entry[0], h = entry[1];
        if (cur.p === '' && name === '_Review') continue;
        if (h.kind === 'directory') {
          if (cur.p.split('/').length < 5 && !/^(node_modules|\.git)$/.test(name)) stack.push({ h: h, p: cur.p + name + '/' });
        } else {
          if (n >= MAX_FILES) { truncated = true; continue; }
          var f = await h.getFile();
          files.push({ path: cur.p + name, name: name, size: f.size, mod: f.lastModified, handle: h, parent: cur.h });
          n++;
          if (n % 100 === 0) say('Scanning\u2026 ' + n + ' files');
        }
      }
    }
    return truncated;
  }

  async function partialHash(f) {
    var file = await f.handle.getFile();
    var buf = await file.slice(0, 65536).arrayBuffer();
    var d = await crypto.subtle.digest('SHA-1', buf);
    return Array.prototype.map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  async function analyze() {
    var g = {
      junk: { title: 'Junk and leftovers', why: 'Temporary downloads, empty files and system leftovers.', items: [], pre: true },
      installers: { title: 'Old installers', why: 'Installer files older than 30 days. You can download them again if needed.', items: [], pre: true },
      dupes: { title: 'Likely duplicates', why: 'Same size and same start of the file. I keep the oldest copy of each.', items: [], pre: true },
      bigOld: { title: 'Big and old', why: 'Over 50 MB and not changed in 6 months. Look these over yourself.', items: [], pre: false }
    };
    var taken = {};
    files.forEach(function (f, i) {
      var e = ext(f.name);
      if (JUNK_NAMES.test(f.name) || JUNK_EXT.indexOf(e) >= 0 || f.name.indexOf('~$') === 0 || f.size === 0) { g.junk.items.push(f); taken[i] = 1; }
      else if (TYPES.Installers.indexOf(e) >= 0 && Date.now() - f.mod > 30 * DAY) { g.installers.items.push(f); taken[i] = 1; }
    });
    // duplicates: group by size, then confirm with a hash of the first 64 KB
    var bySize = {};
    files.forEach(function (f, i) { if (!taken[i] && f.size >= 1024) (bySize[f.size] = bySize[f.size] || []).push(i); });
    var sizes = Object.keys(bySize).filter(function (s) { return bySize[s].length > 1; });
    for (var s = 0; s < sizes.length; s++) {
      var byHash = {};
      var idxs = bySize[sizes[s]];
      for (var k = 0; k < idxs.length; k++) {
        try { var hsh = await partialHash(files[idxs[k]]); (byHash[hsh] = byHash[hsh] || []).push(idxs[k]); } catch (e) {}
      }
      Object.keys(byHash).forEach(function (hk) {
        var grp = byHash[hk];
        if (grp.length < 2) return;
        grp.sort(function (a, b) { return files[a].mod - files[b].mod; });
        grp.slice(1).forEach(function (i) { g.dupes.items.push(files[i]); taken[i] = 1; });
      });
    }
    files.forEach(function (f, i) {
      if (!taken[i] && f.size > 50 * 1048576 && Date.now() - f.mod > 180 * DAY) g.bigOld.items.push(f);
    });
    Object.keys(g).forEach(function (k) { g[k].items.sort(function (a, b) { return b.size - a.size; }); });
    return g;
  }

  /* ---- show results ---- */
  function sumBytes(list) { return list.reduce(function (a, f) { return a + f.size; }, 0); }

  function render(truncated) {
    var total = sumBytes(files);
    var clean = sumBytes(groups.junk.items) + sumBytes(groups.installers.items) + sumBytes(groups.dupes.items);
    $('stFiles').textContent = files.length + (truncated ? '+' : '');
    $('stSize').textContent = fmt(total);
    $('stClean').textContent = fmt(clean);

    var byType = {};
    Object.keys(TYPES).forEach(function (t) { byType[t] = { n: 0, b: 0 }; });
    byType.Other = { n: 0, b: 0 };
    files.forEach(function (f) {
      var e = ext(f.name), t = 'Other';
      Object.keys(TYPES).forEach(function (k) { if (TYPES[k].indexOf(e) >= 0) t = k; });
      byType[t].n++; byType[t].b += f.size;
    });
    var tBox = $('types'); tBox.textContent = '';
    var maxB = 1;
    Object.keys(byType).forEach(function (k) { if (byType[k].b > maxB) maxB = byType[k].b; });
    Object.keys(byType).filter(function (k) { return byType[k].n; })
      .sort(function (a, b) { return byType[b].b - byType[a].b; }).forEach(function (k) {
        var row = el('div', 'mrow');
        var mid = el('div', 'mid');
        mid.appendChild(el('div', 'nm', k));
        mid.appendChild(el('div', 'meta', byType[k].n + (byType[k].n === 1 ? ' file' : ' files')));
        var bar = el('div', 'mbar'), fill = el('i'); bar.appendChild(fill); mid.appendChild(bar);
        setTimeout(function () { fill.style.width = Math.max(3, byType[k].b / maxB * 100) + '%'; }, 30);
        row.appendChild(mid); row.appendChild(el('div', 'mval', fmt(byType[k].b)));
        tBox.appendChild(row);
      });

    var gBox = $('groups'); gBox.textContent = '';
    Object.keys(groups).forEach(function (key) {
      var grp = groups[key];
      if (!grp.items.length) return;
      var card = el('div', 'fgroup');
      var head = el('header');
      head.appendChild(el('h4', '', grp.title + ' (' + grp.items.length + ')'));
      head.appendChild(el('span', 'tot', fmt(sumBytes(grp.items))));
      card.appendChild(head);
      card.appendChild(el('div', 'why', grp.why));
      var boxes = [];
      var all = el('label', 'selall');
      var allCb = document.createElement('input'); allCb.type = 'checkbox'; allCb.checked = grp.pre;
      all.appendChild(allCb); all.appendChild(document.createTextNode('Select all'));
      card.appendChild(all);
      grp.items.slice(0, 40).forEach(function (f) {
        var row = el('label', 'frow');
        var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = grp.pre;
        cb.addEventListener('change', updateSel);
        f.cb = cb; boxes.push(cb);
        var fn = el('div', 'fn'); fn.appendChild(el('b', '', f.name)); fn.appendChild(el('small', '', f.path + ' \u2022 ' + age(f.mod)));
        row.appendChild(cb); row.appendChild(fn); row.appendChild(el('div', 'fs', fmt(f.size)));
        card.appendChild(row);
      });
      grp.items.slice(40).forEach(function (f) { f.cb = null; });
      if (grp.items.length > 40) card.appendChild(el('div', 'more', 'Showing the 40 biggest of ' + grp.items.length + '. Only the ones shown can be moved.'));
      allCb.addEventListener('change', function () { boxes.forEach(function (b) { b.checked = allCb.checked; }); updateSel(); });
      gBox.appendChild(card);
    });
    if (!gBox.children.length) gBox.appendChild(el('p', 'hint', 'Nothing obvious to clean up here. Nice and tidy.'));
    $('results').hidden = false;
    updateSel();
  }

  function selected() {
    var out = [];
    Object.keys(groups).forEach(function (k) { groups[k].items.forEach(function (f) { if (f.cb && f.cb.checked) out.push(f); }); });
    return out;
  }
  function updateSel() {
    var s = selected();
    $('selInfo').textContent = s.length ? s.length + ' selected, ' + fmt(sumBytes(s)) : 'Nothing selected.';
    $('moveBtn').disabled = !s.length;
  }

  function saveSummary(truncated) {
    var types = {};
    files.forEach(function (f) {
      var e = ext(f.name), t = 'Other';
      Object.keys(TYPES).forEach(function (k) { if (TYPES[k].indexOf(e) >= 0) t = k; });
      types[t] = types[t] || { n: 0, b: 0 }; types[t].n++; types[t].b += f.size;
    });
    var gs = {};
    Object.keys(groups).forEach(function (k) {
      gs[k] = { title: groups[k].title, n: groups[k].items.length, b: sumBytes(groups[k].items),
        ex: groups[k].items.slice(0, 3).map(function (f) { return f.name; }) };
    });
    chrome.storage.local.set({ fileScan: {
      t: Date.now(), folder: root.name, files: files.length, truncated: truncated, bytes: sumBytes(files), types: types, groups: gs,
      clean: sumBytes(groups.junk.items) + sumBytes(groups.installers.items) + sumBytes(groups.dupes.items)
    } });
  }

  $('scanBtn').addEventListener('click', function () {
    $('scanBtn').disabled = true; $('results').hidden = true;
    say('Scanning\u2026');
    var truncated = false;
    scan().then(function (t) { truncated = t; say('Checking for duplicates\u2026'); return analyze(); }).then(function (g) {
      groups = g; render(truncated); saveSummary(truncated);
      say('Scanned ' + files.length + ' files' + (truncated ? ' (stopped at ' + MAX_FILES + ')' : '') + '.');
    }).catch(function () { say('Something went wrong while scanning. Try Reconnect, then Scan again.', true); })
      .then(function () { $('scanBtn').disabled = false; });
  });

  /* ---- move to _Review (copy, check size, then remove the original) ---- */
  async function moveOne(f, review) {
    var destName = f.path.replace(/\//g, ' - ');
    try { await review.getFileHandle(destName); destName = Date.now() + ' ' + destName; } catch (e) {}
    var dest = await review.getFileHandle(destName, { create: true });
    var src = await f.handle.getFile();
    try {
      var w = await dest.createWritable();
      await src.stream().pipeTo(w);
      var out = await dest.getFile();
      if (out.size !== src.size) throw new Error('size');
    } catch (e) {
      try { await review.removeEntry(destName); } catch (x) {}
      throw e;
    }
    await f.parent.removeEntry(f.name);
  }

  $('moveBtn').addEventListener('click', async function () {
    var s = selected();
    if (!s.length) return;
    if (!window.confirm('Move ' + s.length + ' files (' + fmt(sumBytes(s)) + ') into a folder called _Review inside "' + root.name + '"? Nothing is permanently deleted.')) return;
    $('moveBtn').disabled = true;
    var review, ok = 0, failed = 0;
    try { review = await root.getDirectoryHandle('_Review', { create: true }); }
    catch (e) { say('I could not create the _Review folder. Try Reconnect.', true); $('moveBtn').disabled = false; return; }
    for (var i = 0; i < s.length; i++) {
      say('Moving ' + (i + 1) + ' of ' + s.length + '\u2026');
      try { await moveOne(s[i], review); ok++; } catch (e) { failed++; }
    }
    say('Moved ' + ok + ' files to _Review' + (failed ? '. ' + failed + ' could not be moved.' : '.') + ' Press Scan to refresh.', failed > 0);
    $('results').hidden = true;
    $('moveBtn').disabled = false;
  });

  /* ---- start ---- */
  kvGet('dir').then(function (h) {
    if (h) { root = h; return refreshPerm(); }
    say('Choose a folder to begin.');
  }).catch(function () { say('Choose a folder to begin.'); });
})();
