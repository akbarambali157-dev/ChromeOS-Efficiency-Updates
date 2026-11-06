(function () {
  'use strict';
  var de = document.documentElement;
  var MODES = ['none', 'aurora', 'mountains', 'stars', 'ridges', 'dunes', 'waves', 'grid', 'canopy', 'bloom', 'embers', 'void', 'custom'];
  /* Each theme owns a wallpaper. Picking a theme picks its wallpaper; the user
     can still override it afterwards. */
  var THEME_WALL = {
    slate: 'ridges', aurora: 'aurora', sunset: 'dunes', ocean: 'waves', neon: 'grid',
    midnight: 'stars', forest: 'canopy', plum: 'bloom', ember: 'embers', void: 'void',
    dayblue: 'waves', daygold: 'dunes', dayamber: 'bloom', dayviolet: 'aurora'
  };
  window.THEME_WALL = THEME_WALL;
  /* 07:00–19:00 counts as day. */
  function autoTheme() {
    var pair = { day: 'dayblue', night: 'slate' };
    try { var s = localStorage.getItem('autoThemes'); if (s) pair = JSON.parse(s); } catch (e) {}
    var h = new Date().getHours();
    return (h >= 7 && h < 19) ? pair.day : pair.night;
  }
  window.autoTheme = autoTheme;
  var custom = '';
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  /* Read motion here, not later in home-look.js: this runs in <head>, so the
     stars are never built at all when motion is off. */
  var MOTION_OFF = ls('motion') === 'off';

  var t = ls('theme'); if (t) de.setAttribute('data-theme', t);
  var m = ls('motion'); if (m === 'off') de.setAttribute('data-motion', 'off');

  var MOUNTAINS =
    '<svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><radialGradient id="wsg"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.85"/>' +
    '<stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></radialGradient>' +
    '<linearGradient id="wsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bg)"/>' +
    '<stop offset="1" style="stop-color:var(--panel)"/></linearGradient></defs>' +
    '<rect width="1440" height="800" fill="url(#wsk)"/>' +
    '<circle class="sun" cx="1040" cy="380" r="200" fill="url(#wsg)"/>' +
    '<path class="m1" d="M-60 560 L100 500 L230 548 L380 470 L520 540 L680 460 L820 538 L980 480 L1130 552 L1280 490 L1500 556 L1500 800 L-60 800Z"/>' +
    '<path class="m2" d="M-60 640 L90 590 L240 640 L420 570 L580 650 L760 585 L930 655 L1100 600 L1260 660 L1500 610 L1500 800 L-60 800Z"/>' +
    '<path class="m3" d="M-60 720 L140 680 L330 730 L520 690 L720 745 L900 700 L1090 750 L1280 705 L1500 745 L1500 800 L-60 800Z"/>' +
    '</svg>';

  /* Angular slate ridges — sharper than the mountains, three parallax layers. */
  var RIDGES =
    '<svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
    '<path class="r1" d="M-60 520 L120 430 L260 500 L400 380 L560 470 L700 360 L860 460 L1010 390 L1170 480 L1320 400 L1500 470 L1500 800 L-60 800Z"/>' +
    '<path class="r2" d="M-60 620 L140 540 L320 610 L500 500 L680 600 L860 520 L1040 620 L1220 540 L1400 610 L1500 560 L1500 800 L-60 800Z"/>' +
    '<path class="r3" d="M-60 720 L160 660 L360 720 L560 670 L760 730 L960 680 L1160 740 L1360 690 L1500 730 L1500 800 L-60 800Z"/>' +
    '</svg>';

  /* Smooth warm dunes. */
  var DUNES =
    '<svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
    '<path class="d1" d="M-60 560 C180 470 360 640 620 560 C880 480 1080 650 1500 540 L1500 800 L-60 800Z"/>' +
    '<path class="d2" d="M-60 650 C220 580 420 720 700 640 C980 560 1200 720 1500 630 L1500 800 L-60 800Z"/>' +
    '<path class="d3" d="M-60 730 C260 680 500 780 780 720 C1060 660 1280 770 1500 720 L1500 800 L-60 800Z"/>' +
    '</svg>';

  /* Four ocean bands, each drifting at its own speed. */
  var WAVES =
    '<svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
    '<path class="w1" d="M-60 470 C160 420 320 520 520 470 C720 420 880 520 1080 470 C1280 420 1400 500 1500 470 L1500 800 L-60 800Z"/>' +
    '<path class="w2" d="M-60 560 C180 510 340 610 560 560 C780 510 940 610 1160 560 C1340 520 1440 590 1500 560 L1500 800 L-60 800Z"/>' +
    '<path class="w3" d="M-60 650 C200 600 380 700 600 650 C820 600 1000 700 1220 650 C1380 615 1460 680 1500 650 L1500 800 L-60 800Z"/>' +
    '<path class="w4" d="M-60 730 C220 690 420 780 660 730 C900 680 1100 780 1340 730 L1500 745 L1500 800 L-60 800Z"/>' +
    '</svg>';

  /* Layered tree silhouettes. */
  var CANOPY =
    '<svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
    '<path class="c1" d="M-60 800 L-60 520 L60 400 L180 520 L300 380 L420 520 L540 420 L660 540 L780 400 L900 530 L1020 410 L1140 540 L1260 430 L1380 540 L1500 450 L1500 800Z"/>' +
    '<path class="c2" d="M-60 800 L-60 620 L80 520 L220 640 L360 500 L500 650 L640 530 L780 660 L920 520 L1060 650 L1200 540 L1340 660 L1500 560 L1500 800Z"/>' +
    '<path class="c3" d="M-60 800 L-60 720 L100 660 L260 740 L420 660 L580 750 L740 670 L900 760 L1060 680 L1220 760 L1380 690 L1500 740 L1500 800Z"/>' +
    '</svg>';

  function setWall(mode) {
    var body = document.body;
    if (!body || body.hasAttribute('data-nowall')) return;
    if (MOTION_OFF) de.setAttribute('data-motion', 'off');
    var w = document.getElementById('wall');
    if (MODES.indexOf(mode) < 0) mode = 'aurora';
    if (mode === 'custom' && !custom) mode = 'aurora';
    if (mode === 'none') {
      if (w) w.remove();
      body.classList.remove('has-wall');
      return;
    }
    if (!w) {
      w = document.createElement('div');
      w.id = 'wall';
      body.insertBefore(w, body.firstChild);
    }
    w.className = mode;
    w.removeAttribute('style');
    w.textContent = '';
    body.classList.add('has-wall');
    if (mode === 'aurora' || mode === 'bloom') {
      w.innerHTML = '<i></i><i></i><i></i>';
    } else if (mode === 'mountains') {
      w.innerHTML = MOUNTAINS;
    } else if (mode === 'ridges') {
      w.innerHTML = RIDGES;
    } else if (mode === 'dunes') {
      w.innerHTML = DUNES;
    } else if (mode === 'waves') {
      w.innerHTML = WAVES;
    } else if (mode === 'canopy') {
      w.innerHTML = CANOPY;
    } else if (mode === 'grid') {
      w.innerHTML = '<i></i>';
    } else if (mode === 'stars' || mode === 'void') {
      /* 28 stars, not 55: each was an infinitely animating layer on a 2 GB
         machine, and every star cost a repaint in every open tab. Void gets a
         few more because it has no colour to carry the scene. */
      var n = mode === 'void' ? 34 : 28;
      for (var i = 0; i < n; i++) {
        var s = document.createElement('i');
        var sz = 1 + Math.random() * 2;
        s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) +
          '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;animation-delay:-' + (Math.random() * 6).toFixed(1) +
          's;animation-duration:' + (3 + Math.random() * 4).toFixed(1) + 's';
        w.appendChild(s);
      }
      w.appendChild(document.createElement('b'));
    } else if (mode === 'embers') {
      for (var j = 0; j < 18; j++) {
        var e = document.createElement('i');
        e.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:-' + (Math.random() * 9).toFixed(1) +
          's;animation-duration:' + (7 + Math.random() * 6).toFixed(1) + 's';
        w.appendChild(e);
      }
    } else if (mode === 'custom') {
      w.style.backgroundImage = 'linear-gradient(rgba(10,16,22,.5),rgba(10,16,22,.5)),url("' + custom + '")';
    }
  }
  window.setWall = setWall;
  window.setCustomWall = function (url) { custom = url || ''; };

  document.addEventListener('DOMContentLoaded', function () {
    /* Day/night is resolved before the wallpaper is chosen so the two agree. */
    if (ls('themeMode') === 'auto') {
      var at = autoTheme();
      de.setAttribute('data-theme', at);
      try { localStorage.setItem('theme', at); } catch (e) {}
    }
    var mode = ls('wallMode');
    chrome.storage.local.get('wallpaper', function (d) {
      custom = d.wallpaper || '';
      if (!mode) {
        mode = custom ? 'custom' : (THEME_WALL[ls('theme')] || 'aurora');
        try { localStorage.setItem('wallMode', mode); } catch (e) {}
      }
      setWall(mode);
    });
  });

  /* Pause every animation while the tab is hidden. With many new tabs open this
     is the difference between an idle tab costing nothing and every one of them
     repainting its wallpaper forever. */
  function syncHidden() {
    if (document.hidden) de.setAttribute('data-hidden', '');
    else de.removeAttribute('data-hidden');
  }
  document.addEventListener('visibilitychange', syncHidden);
  syncHidden();
})();
