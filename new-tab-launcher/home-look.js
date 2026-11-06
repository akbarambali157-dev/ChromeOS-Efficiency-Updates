(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var THEMES = [
    { id: 'slate', name: 'Slate', a: '#7fd1b9', b: '#5aa9ff', bg: '#13212b' },
    { id: 'aurora', name: 'Aurora', a: '#7cf2c9', b: '#8a7dff', bg: '#091020' },
    { id: 'sunset', name: 'Sunset', a: '#ff9a76', b: '#ff5d8f', bg: '#1c0f21' },
    { id: 'ocean', name: 'Ocean', a: '#4fd1ff', b: '#3a7bff', bg: '#061620' },
    { id: 'neon', name: 'Neon', a: '#ff5cee', b: '#4df0ff', bg: '#0d0b1a' },
    { id: 'midnight', name: 'Midnight', a: '#9db4ff', b: '#be96ff', bg: '#0f1424' },
    { id: 'forest', name: 'Forest', a: '#9fdc8f', b: '#f0d66e', bg: '#0f1f17' },
    { id: 'plum', name: 'Plum', a: '#e3a6f0', b: '#ff8cb4', bg: '#1c1423' },
    { id: 'ember', name: 'Ember', a: '#f0b36b', b: '#ff785a', bg: '#211812' },
    { id: 'void', name: 'Void', a: '#e6edf5', b: '#93a7bd', bg: '#000000' },
    { id: 'dayblue', name: 'Day Blue', a: '#2f7fe0', b: '#5aa9ff', bg: '#eaf2fb' },
    { id: 'daygold', name: 'Day Gold', a: '#c98a12', b: '#e8b23a', bg: '#fdf6e6' },
    { id: 'dayamber', name: 'Day Amber', a: '#d2691e', b: '#f0913f', bg: '#fdf0e4' },
    { id: 'dayviolet', name: 'Day Violet', a: '#7b5cd6', b: '#a98cf0', bg: '#f2eefb' }
  ];
  var WALLS = [
    ['none', 'None'], ['aurora', 'Aurora'], ['ridges', 'Ridges'], ['dunes', 'Dunes'],
    ['waves', 'Waves'], ['grid', 'Grid'], ['stars', 'Stars'], ['canopy', 'Canopy'],
    ['bloom', 'Bloom'], ['embers', 'Embers'], ['mountains', 'Mountains'], ['void', 'Void']
  ];
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

  // custom photo, shrunk to 1280px wide so it stays light on a 2GB Chromebook
  $('wallPick').addEventListener('change', function (e) {
    var f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    say('Preparing photo\u2026');
    var img = new Image(), url = URL.createObjectURL(f);
    img.onload = function () {
      var w = Math.min(1280, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      var data = cv.toDataURL('image/jpeg', 0.72);
      chrome.storage.local.set({ wallpaper: data }, function () {
        if (chrome.runtime.lastError) { say('That image is too large to save. Try a smaller one.', true); return; }
        window.setCustomWall(data);
        chooseWall('custom');
        say('Photo set as wallpaper.');
      });
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
