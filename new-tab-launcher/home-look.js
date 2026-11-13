(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var THEMES = window.LAUNCHER_THEMES;
  var WALL_LABELS = {
    none: 'None', aurora: 'Aurora', ridges: 'Ridges', dunes: 'Dunes', waves: 'Waves',
    grid: 'Grid', stars: 'Stars', canopy: 'Canopy', bloom: 'Bloom', embers: 'Embers',
    mountains: 'Mountains', void: 'Void', felt: 'Felt', fluted: 'Fluted Glass',
    thermal: 'Thermal', ripple: 'Ripples', speckle: 'Speckle', monohue: 'Single Hue',
    blueprint: 'Blueprint', halftone: 'Halftone', grass: 'Grass', dither: 'Dither',
    paper: 'Paper', contour: 'Contour', clouds: 'Cloud Sky'
  };
  var WALLS = window.WALLPAPER_MODES.map(function (id) { return [id, WALL_LABELS[id] || id]; });
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function say(msg, err) { var s = $('lookStatus'); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : ''); }

  /* themes */
  function markTheme() {
    var cur = ls('theme') || 'slate';
    Array.prototype.forEach.call($('swatches').children, function (b) {
      b.className = 'sw' + (b.dataset.id === cur ? ' on' : '');
      b.setAttribute('aria-pressed', b.dataset.id === cur ? 'true' : 'false');
    });
  }
  THEMES.forEach(function (t) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sw'; b.dataset.id = t.id; b.title = t.name;
    b.setAttribute('aria-label', t.name + ' theme');
    b.style.background = 'linear-gradient(135deg,' + t.bg + ' 38%,' + t.a + ' 38% 68%,' + t.b + ' 68%)';
    b.addEventListener('click', function () {
      lset('theme', t.id);
      chrome.storage.local.set({ theme: t.id });
      document.documentElement.setAttribute('data-theme', t.id);
      markTheme();
      /* Each theme brings its own wallpaper. The user can still override it
         afterwards from the wallpaper row below. */
      var w = window.THEME_WALL && window.THEME_WALL[t.id];
      if (w) chooseWall(w);
    });
    $('swatches').appendChild(b);
  });
  markTheme();
  chrome.storage.local.get(['theme', 'wallMode', 'motion'], function (d) {
    if (d.theme && d.theme !== ls('theme')) {
      lset('theme', d.theme);
      document.documentElement.setAttribute('data-theme', d.theme);
      markTheme();
    }
    if (d.motion && d.motion !== ls('motion')) { lset('motion', d.motion); applyMotion(d.motion); $('motionSel').value = d.motion; }
    if (d.wallMode && d.wallMode !== ls('wallMode')) { lset('wallMode', d.wallMode); window.setWall(d.wallMode); markWall(); }
  });

  /* wallpapers */
  function markWall() {
    var cur = ls('wallMode') || 'aurora';
    Array.prototype.forEach.call($('wallModes').children, function (b) {
      if (b.dataset.id) b.className = 'filebtn' + (b.dataset.id === cur ? ' main' : '');
    });
  }
  function chooseWall(id) {
    lset('wallMode', id);
    chrome.storage.local.set({ wallMode: id });
    window.setWall(id);
    markWall();
  }
  WALLS.forEach(function (w) {
    var b = document.createElement('button');
    b.type = 'button'; b.dataset.id = w[0]; b.textContent = w[1];
    b.addEventListener('click', function () { chooseWall(w[0]); });
    $('wallModes').appendChild(b);
  });
  markWall();

  /* Collections contain lightweight built-in wallpaper IDs, never image data. */
  var collections = [], activeCollection = '', rotationOn = false;
  var validWallIds = WALLS.map(function (w) { return w[0]; });
  function collectionSay(msg, err) {
    var el = $('wallCollectionStatus'); el.textContent = msg || '';
    el.className = 'status' + (err ? ' err' : '');
  }
  function saveCollections(callback) {
    chrome.storage.local.set({ wallpaperCollections: collections, activeWallpaperCollection: activeCollection, wallpaperRotation: rotationOn }, function () {
      if (chrome.runtime.lastError) collectionSay('Could not save wallpaper collections.', true);
      else if (callback) callback();
    });
  }
  function selectedCollection() {
    return collections.filter(function (c) { return c.id === activeCollection; })[0] || null;
  }
  function renderCollections() {
    var select = $('wallCollectionSelect'); select.textContent = '';
    collections.forEach(function (c) {
      var option = document.createElement('option'); option.value = c.id;
      option.textContent = c.name + ' (' + c.wallpapers.length + ')'; select.appendChild(option);
    });
    if (!collections.length) {
      var empty = document.createElement('option'); empty.value = ''; empty.textContent = 'No collections yet'; select.appendChild(empty);
    }
    select.value = activeCollection;
    var c = selectedCollection();
    $('wallCollectionAdd').disabled = !c || c.wallpapers.length >= 20;
    $('wallCollectionApply').disabled = !c || !c.wallpapers.length;
    $('wallCollectionDelete').disabled = !c;
    $('wallRotate').disabled = !c || c.wallpapers.length < 2;
    $('wallRotate').checked = !!rotationOn && !!c && c.wallpapers.length > 1;
  }
  function currentBuiltInWall() {
    var id = ls('wallMode') || 'aurora'; return validWallIds.indexOf(id) >= 0 ? id : '';
  }
  function saved(message) { saveCollections(function () { renderCollections(); if (message) collectionSay(message); }); }
  chrome.storage.local.get(['wallpaperCollections', 'activeWallpaperCollection', 'wallpaperRotation'], function (data) {
    var seenNames = {}, seenIds = {};
    collections = Array.isArray(data.wallpaperCollections) ? data.wallpaperCollections.filter(function (c) {
      if (!c || typeof c.name !== 'string' || !c.name.trim() || !Array.isArray(c.wallpapers)) return false;
      var name = c.name.trim().toLowerCase(), id = String(c.id || '');
      if (seenNames[name] || (id && seenIds[id]) || collections.length >= 8) return false;
      seenNames[name] = true; if (id) seenIds[id] = true; return true;
    }).map(function (c, i) {
      return { id: String(c.id || ('wall-' + i)).slice(0, 48), name: c.name.trim().slice(0, 24),
        wallpapers: c.wallpapers.filter(function (id, i, a) { return validWallIds.indexOf(id) >= 0 && a.indexOf(id) === i; }).slice(0, 20) };
    }) : [];
    activeCollection = collections.some(function (c) { return c.id === data.activeWallpaperCollection; })
      ? data.activeWallpaperCollection : (collections[0] ? collections[0].id : '');
    rotationOn = !!data.wallpaperRotation; renderCollections();
  });
  $('wallCollectionSelect').addEventListener('change', function () {
    activeCollection = $('wallCollectionSelect').value; rotationOn = false;
    saved('Collection selected. Automatic rotation is off until enabled.');
  });
  $('wallCollectionCreate').addEventListener('click', function () {
    var name = $('wallCollectionName').value.trim(), wall = currentBuiltInWall();
    if (!name) { collectionSay('Enter a name for the collection.', true); return; }
    if (!wall) { collectionSay('Choose a built-in wallpaper before saving a collection.', true); return; }
    if (collections.length >= 8) { collectionSay('You can save up to 8 collections.', true); return; }
    if (collections.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })) { collectionSay('A collection with that name already exists.', true); return; }
    collections.push({ id: 'wall-' + Date.now().toString(36), name: name.slice(0, 24), wallpapers: [wall] });
    activeCollection = collections[collections.length - 1].id; rotationOn = false; $('wallCollectionName').value = '';
    saved('Collection saved with ' + wall + '.');
  });
  $('wallCollectionAdd').addEventListener('click', function () {
    var c = selectedCollection(), wall = currentBuiltInWall();
    if (!c || !wall) { collectionSay('Choose a built-in wallpaper first.', true); return; }
    if (c.wallpapers.indexOf(wall) >= 0) { collectionSay('That wallpaper is already in this collection.', true); return; }
    if (c.wallpapers.length >= 20) { collectionSay('A collection can contain up to 20 wallpapers.', true); return; }
    c.wallpapers.push(wall); saved('Added ' + wall + ' to ' + c.name + '.');
  });
  function applyCollectionNext() {
    var c = selectedCollection(); if (!c || !c.wallpapers.length) return;
    var index = c.wallpapers.indexOf(ls('wallMode') || '');
    var next = c.wallpapers[(index + 1) % c.wallpapers.length];
    chooseWall(next); collectionSay('Applied ' + next + ' from ' + c.name + '.');
  }
  $('wallCollectionApply').addEventListener('click', applyCollectionNext);
  $('wallCollectionDelete').addEventListener('click', function () {
    var c = selectedCollection(); if (!c || !window.confirm('Delete the wallpaper collection "' + c.name + '"?')) return;
    collections = collections.filter(function (item) { return item.id !== c.id; });
    activeCollection = collections[0] ? collections[0].id : ''; rotationOn = false; saved('Wallpaper collection deleted.');
  });
  $('wallRotate').addEventListener('change', function () {
    var c = selectedCollection(); rotationOn = !!$('wallRotate').checked && !!c && c.wallpapers.length > 1;
    saved(rotationOn ? 'Wallpaper rotates when you open a new tab.' : 'Automatic wallpaper rotation is off.');
  });

  // Custom photos are bounded before saving so large images do not create
  // oversized canvas allocations or storage writes on low-memory Chromebooks.
  $('wallPick').addEventListener('change', function (e) {
    var f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 20 * 1048576) { say('Choose an image smaller than 20 MB.', true); return; }
    say('Preparing photo\u2026');
    var img = new Image(), url = URL.createObjectURL(f);
    img.onload = function () {
      try {
        var sourceW = img.naturalWidth, sourceH = img.naturalHeight;
        if (!sourceW || !sourceH || sourceW * sourceH > 40000000) {
          say('That image has too many pixels. Choose a smaller image.', true);
          return;
        }
        var scale = Math.min(1, 1280 / Math.max(sourceW, sourceH));
        var w = Math.max(1, Math.round(sourceW * scale));
        var h = Math.max(1, Math.round(sourceH * scale));
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        if (!ctx) throw new Error('Canvas is unavailable.');
        ctx.drawImage(img, 0, 0, w, h);
        var data = cv.toDataURL('image/jpeg', 0.72);
        chrome.storage.local.set({ wallpaper: data }, function () {
          if (chrome.runtime.lastError) { say('That image is too large to save. Try a smaller one.', true); return; }
          window.setCustomWall(data);
          chooseWall('custom');
          say('Photo set as wallpaper.');
        });
      } catch (err) {
        say('Could not prepare that image. Try a smaller JPG or PNG.', true);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = function () { URL.revokeObjectURL(url); say('Could not open that image.', true); };
    img.src = url;
  });

  /* motion */
  function applyMotion(v) {
    if (v === 'off') document.documentElement.setAttribute('data-motion', 'off');
    else document.documentElement.removeAttribute('data-motion');
  }
  $('motionSel').value = ls('motion') === 'off' ? 'off' : 'on';
  $('motionSel').addEventListener('change', function () {
    var v = $('motionSel').value === 'off' ? 'off' : 'on';
    lset('motion', v);
    chrome.storage.local.set({ motion: v });
    applyMotion(v);
  });

  /* theme timing: fixed, or day/night by the clock */
  function applyAutoTheme() {
    var at = window.autoTheme();
    lset('theme', at);
    chrome.storage.local.set({ theme: at });
    document.documentElement.setAttribute('data-theme', at);
    markTheme();
    var w = window.THEME_WALL && window.THEME_WALL[at];
    if (w) chooseWall(w);
  }
  var tmSel = $('themeModeSel');
  if (tmSel) {
    tmSel.value = ls('themeMode') === 'auto' ? 'auto' : 'fixed';
    tmSel.addEventListener('change', function () {
      var v = tmSel.value === 'auto' ? 'auto' : 'fixed';
      lset('themeMode', v);
      chrome.storage.local.set({ themeMode: v });
      if (v === 'auto') applyAutoTheme();
    });
  }
})();
