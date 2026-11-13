(function () {
  'use strict';
  var de = document.documentElement;
  var MODES = [
    'none', 'aurora', 'mountains', 'stars', 'ridges', 'dunes', 'waves', 'grid',
    'canopy', 'bloom', 'embers', 'void',
    /* texture wallpapers — all drawn from CSS gradients, one SVG or one small
       canvas, so the extension still ships no image assets */
    'felt', 'fluted', 'thermal', 'ripple', 'speckle', 'monohue', 'blueprint',
    'halftone', 'grass', 'dither', 'paper', 'contour', 'clouds',
    'custom'
  ];
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

  /* Every scene is built from the same five palette slots, which each theme
     defines in newtab.css. Light themes point them at dark slates so the
     silhouettes stay readable against a bright sky. */
  function sky(id) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" style="stop-color:var(--w-sky)"/>' +
      '<stop offset="1" style="stop-color:var(--w-far)"/></linearGradient>';
  }
  /* Lit on the left, shadowed on the right — this is what gives the ridges and
     mountains a light source instead of a flat fill. */
  function lit(id, base, hi, lo) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" style="stop-color:var(--w-light);stop-opacity:' + hi + '"/>' +
      '<stop offset=".45" style="stop-color:var(--w-' + base + ')"/>' +
      '<stop offset="1" style="stop-color:var(--w-shadow);stop-opacity:' + lo + '"/></linearGradient>';
  }
  function glow(id, op) {
    return '<radialGradient id="' + id + '">' +
      '<stop offset="0" style="stop-color:var(--w-light);stop-opacity:' + op + '"/>' +
      '<stop offset=".55" style="stop-color:var(--w-light);stop-opacity:' + (op * 0.3).toFixed(2) + '"/>' +
      '<stop offset="1" style="stop-color:var(--w-light);stop-opacity:0"/></radialGradient>';
  }
  function svg(defs, body) {
    return '<svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' + defs + '</defs>' + body + '</svg>';
  }

  /* Mountains — layered, irregular peaks with distant haze and restrained snow light. */
  var MOUNTAINS = svg(
    sky('mtnSky') + glow('mtnSun', '.82') +
    lit('mtnFar', 'far', '.48', '.78') + lit('mtnMid', 'mid', '.36', '.88') +
    lit('mtnNear', 'near', '.24', '.94'),
    '<rect width="1440" height="800" fill="url(#mtnSky)"/>' +
    '<circle class="sun" cx="330" cy="300" r="250" fill="url(#mtnSun)"/>' +
    '<path class="m1" fill="url(#mtnFar)" d="M-60 800 L40 590 L145 430 L230 545 L365 330 L470 505 L590 395 L720 565 L855 345 L970 520 L1095 385 L1220 555 L1350 410 L1500 590 L1500 800Z"/>' +
    '<path fill="var(--w-light)" opacity=".20" d="M145 430 L365 330 L470 505 L365 405 L285 472 L230 545 L205 480Z M855 345 L970 520 L910 440 L855 410 L815 470Z M1095 385 L1220 555 L1140 468 L1095 445 L1055 500Z"/>' +
    '<path class="m2" fill="url(#mtnMid)" d="M-60 800 L75 665 L220 575 L340 665 L505 500 L645 680 L790 555 L930 690 L1085 535 L1235 685 L1385 565 L1500 665 L1500 800Z"/>' +
    '<path class="m3" fill="url(#mtnNear)" d="M-60 800 L110 720 L270 650 L420 745 L600 645 L760 760 L930 655 L1100 765 L1270 665 L1420 750 L1500 710 L1500 800Z"/>'
  );

  /* Ridges — sharp slate teeth, no sun, cooler and busier than the mountains. */
  var RIDGES = svg(
    sky('rdgSky') + lit('rdg1', 'far', '.5', '.8') + lit('rdg2', 'mid', '.34', '.9') + lit('rdg3', 'near', '.2', '.95'),
    '<rect width="1440" height="800" fill="url(#rdgSky)"/>' +
    '<path class="r1" fill="url(#rdg1)" d="M-60 800 L40 500 L120 590 L200 420 L280 560 L360 380 L440 540 L520 400 L610 570 L690 410 L780 550 L870 390 L960 560 L1050 420 L1140 580 L1230 440 L1320 570 L1410 470 L1500 560 L1500 800Z"/>' +
    '<path class="r2" fill="url(#rdg2)" d="M-60 800 L60 640 L150 700 L240 580 L330 690 L420 560 L510 700 L600 590 L700 710 L790 570 L880 700 L970 600 L1060 720 L1150 610 L1240 710 L1330 620 L1420 720 L1500 660 L1500 800Z"/>' +
    '<path class="r3" fill="url(#rdg3)" d="M-60 800 L100 740 L220 780 L340 720 L460 790 L580 730 L700 790 L820 740 L940 800 L1060 750 L1180 800 L1300 760 L1420 800 L1500 780 L1500 800Z"/>'
  );

  /* Dunes — substantial overlapping sand formations, fine wind-carved ridges,
     and one fixed dead acacia silhouette so the scene never rearranges itself. */
  var DUNES = svg(
    sky('dnSky') + glow('dnSun', '.78') +
    lit('dn1', 'far', '.48', '.76') + lit('dn2', 'mid', '.36', '.88') +
    lit('dn3', 'near', '.24', '.94'),
    '<rect width="1440" height="800" fill="url(#dnSky)"/>' +
    '<circle class="sun" cx="1080" cy="365" r="260" fill="url(#dnSun)"/>' +
    '<path class="d1" fill="url(#dn1)" d="M-60 800 C90 585 280 410 520 475 C760 535 880 640 1110 520 C1280 430 1390 470 1500 430 L1500 800Z"/>' +
    '<path class="d2" fill="url(#dn2)" d="M-60 800 C130 660 285 585 470 610 C700 640 760 735 1010 650 C1200 585 1350 600 1500 555 L1500 800Z"/>' +
    '<path class="d3" fill="url(#dn3)" d="M-60 800 C170 735 330 680 540 710 C760 740 875 790 1080 725 C1260 670 1390 700 1500 670 L1500 800Z"/>' +
    '<path d="M95 626 C230 520 340 490 470 510" fill="none" stroke="var(--w-light)" stroke-opacity=".22" stroke-width="3"/>' +
    '<path d="M780 658 C920 585 1050 568 1195 585" fill="none" stroke="var(--w-light)" stroke-opacity=".18" stroke-width="2"/>' +
    '<g class="dead-bush" fill="var(--w-shadow)" opacity=".78">' +
      '<path d="M286 674 l-5 -34 -19 -24 4 -4 18 21 -3 -31 5 -2 5 34 19 -23 5 3 -21 27 2 31Z"/>' +
      '<path d="M284 654 l-24 -12 -13 -18 4 -3 14 17 19 8Z M291 645 l17 -20 2 -16 5 0 -2 19 -18 22Z"/>' +
      '<path d="M282 675 l-12 -2 -9 -8 3 -4 9 7 10 1Z"/>' +
    '</g>'
  );

  /* Waves — four crests that actually roll. Each band is drawn twice as wide as
     the viewBox and slides by half its own width, so the loop is seamless. */
  function wavePath(y, amp) {
    var d = 'M0 ' + y + ' q90 -' + amp + ' 180 0';
    for (var i = 0; i < 15; i++) d += ' t180 0';
    return d + ' V800 H0 Z';
  }
  var WAVES = svg(
    sky('wvSky') + glow('wvSun', '.55') +
    lit('wv1', 'far', '.6', '.7') + lit('wv2', 'far', '.45', '.8') +
    lit('wv3', 'mid', '.3', '.9') + lit('wv4', 'near', '.18', '.95'),
    '<rect width="1440" height="800" fill="url(#wvSky)"/>' +
    '<circle class="sun" cx="1120" cy="250" r="200" fill="url(#wvSun)"/>' +
    '<g class="w1g"><path class="w1" fill="url(#wv1)" d="' + wavePath(430, 34) + '"/></g>' +
    '<g class="w2g"><path class="w2" fill="url(#wv2)" d="' + wavePath(520, 42) + '"/></g>' +
    '<g class="w3g"><path class="w3" fill="url(#wv3)" d="' + wavePath(620, 50) + '"/></g>' +
    '<g class="w4g"><path class="w4" fill="url(#wv4)" d="' + wavePath(720, 58) + '"/></g>'
  );

  /* Canopy — layered tree lines under a moon. */
  var CANOPY = svg(
    sky('cpSky') + glow('cpMoon', '.85') +
    lit('cp1', 'far', '.4', '.8') + lit('cp2', 'mid', '.28', '.9') + lit('cp3', 'near', '.16', '.95'),
    '<rect width="1440" height="800" fill="url(#cpSky)"/>' +
    '<circle class="moon" cx="1120" cy="210" r="110" fill="url(#cpMoon)"/>' +
    '<path class="c1" fill="url(#cp1)" d="M-60 800 L-60 520 L60 400 L180 520 L300 380 L420 520 L540 420 L660 540 L780 400 L900 530 L1020 410 L1140 540 L1260 430 L1380 540 L1500 450 L1500 800Z"/>' +
    '<path class="c2" fill="url(#cp2)" d="M-60 800 L-60 620 L80 520 L220 640 L360 500 L500 650 L640 530 L780 660 L920 520 L1060 650 L1200 540 L1340 660 L1500 560 L1500 800Z"/>' +
    '<path class="c3" fill="url(#cp3)" d="M-60 800 L-60 720 L100 660 L260 740 L420 660 L580 750 L740 670 L900 760 L1060 680 L1220 760 L1380 690 L1500 740 L1500 800Z"/>'
  );

  /* Monohue — a whole landscape in one hue. Every layer is the same accent
     colour at a different opacity over the theme's sky, so it reads as depth
     without ever introducing a second colour. */
  function monoLayer(d, op) {
    return '<path style="fill:var(--accent);fill-opacity:' + op + '" d="' + d + '"/>';
  }
  var MONOHUE = '<svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="1440" height="800" style="fill:var(--w-sky)"/>' +
    '<circle class="sun" cx="1030" cy="270" r="132" style="fill:var(--accent);fill-opacity:.45"/>' +
    monoLayer('M-60 800 C200 500 420 690 700 560 C980 430 1180 690 1500 520 L1500 800Z', '.10') +
    monoLayer('M-60 800 C240 620 470 750 760 640 C1050 530 1240 720 1500 610 L1500 800Z', '.18') +
    monoLayer('M-60 800 C280 710 540 790 830 720 C1120 650 1320 770 1500 710 L1500 800Z', '.32') +
    monoLayer('M-60 800 C120 760 300 800 520 780 C760 758 900 800 1500 772 L1500 800Z', '.50') +
    '</svg>';

  /* Ordered dithering needs per-pixel maths, so this one is a small canvas
     painted at 240×150 and scaled up with image-rendering:pixelated. That keeps
     the chunky look and costs one paint instead of a filter on every frame. */
  function rgbOf(v) {
    var m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(String(v || ''));
    if (m) return [+m[1], +m[2], +m[3]];
    var h = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v || '').trim());
    if (!h) return null;
    var s = h[1];
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function buildDither(w) {
    var cv = document.createElement('canvas');
    var W = 240, H = 150, levels = 5;
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var cs = getComputedStyle(de);
    var A = rgbOf(cs.getPropertyValue('--accent-rgb')) || [127, 209, 185];
    var B = rgbOf(cs.getPropertyValue('--accent2-rgb')) || [90, 169, 255];
    var BASE = rgbOf(cs.getPropertyValue('--w-sky')) || [11, 22, 32];
    var img = ctx.createImageData(W, H);
    var p = img.data, i = 0;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        /* off-centre radial falloff so the dither reads as an image, not a
           flat wash: bright core, dark corners */
        var dx = x / W - 0.42, dy = y / H - 0.55;
        var v = 1 - Math.sqrt(dx * dx * 1.05 + dy * dy * 1.55);
        v = v * 1.45 + 0.06;
        if (v < 0) v = 0; if (v > 1) v = 1;
        var q = v * (levels - 1) + (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47);
        var qi = Math.round(q);
        if (qi < 0) qi = 0; if (qi > levels - 1) qi = levels - 1;
        var t = qi / (levels - 1);
        var c = t <= 0.5 ? mix(BASE, A, t * 2) : mix(A, B, (t - 0.5) * 2);
        p[i++] = c[0]; p[i++] = c[1]; p[i++] = c[2]; p[i++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    try {
      w.style.backgroundImage = 'url("' + cv.toDataURL('image/png') + '")';
      w.style.backgroundSize = 'cover';
      w.style.backgroundPosition = 'center';
      w.style.imageRendering = 'pixelated';
    } catch (e) {}
  }

  /* Cloud sky — soft puffs painted as a mask over a solid light layer. The
     palette slot for "light" is a solid colour with no alpha, so masking is how
     it gets softness. Each mask is generated twice across a 200%-wide element,
     so translating by -50% loops seamlessly. */
  function cloudMask() {
    var out = [], stops = ',#000 0,#000 40%,rgba(0,0,0,.55) 62%,transparent 78%';
    for (var i = 0; i < 14; i++) {
      var x = +(Math.random() * 50).toFixed(1);
      var y = +(12 + Math.random() * 56).toFixed(1);
      var rx = +(9 + Math.random() * 11).toFixed(1);
      var ry = +(3 + Math.random() * 4.5).toFixed(1);
      out.push('radial-gradient(ellipse ' + rx + 'vmax ' + ry + 'vmax at ' + x + '% ' + y + '%' + stops + ')');
      out.push('radial-gradient(ellipse ' + rx + 'vmax ' + ry + 'vmax at ' + (x + 50) + '% ' + y + '%' + stops + ')');
    }
    return out.join(',');
  }
  function buildClouds(w) {
    var opac = ['.10', '.15', '.21'], speed = [280, 190, 130], delay = [40, 110, 10];
    for (var i = 0; i < 3; i++) {
      var layer = document.createElement('i');
      var mask = cloudMask();
      layer.style.cssText = 'position:absolute;left:0;top:0;width:200%;height:100%;' +
        'background:var(--w-light);opacity:' + opac[i] + ';' +
        '-webkit-mask-image:' + mask + ';mask-image:' + mask + ';' +
        '-webkit-mask-size:100% 100%;mask-size:100% 100%;' +
        '-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;' +
        'animation:cloudDrift ' + speed[i] + 's linear infinite;' +
        'animation-delay:-' + delay[i] + 's;';
      w.appendChild(layer);
    }
  }

  var wallTransition = 0;
  function setWall(mode) {
    var transitionId = ++wallTransition;
    var body = document.body;
    if (!body || body.hasAttribute('data-nowall')) return;
    if (MOTION_OFF) de.setAttribute('data-motion', 'off');
    var w = document.getElementById('wall');
    if (MODES.indexOf(mode) < 0) mode = 'aurora';
    if (mode === 'custom' && !custom) mode = 'aurora';
    if (mode === 'none') {
      body.classList.remove('has-wall');
      if (w) {
        w.style.opacity = '0';
        setTimeout(function () {
          if (transitionId === wallTransition && w.parentNode) w.remove();
        }, 340);
      }
      return;
    }
    if (!w) {
      w = document.createElement('div');
      w.id = 'wall';
      body.insertBefore(w, body.firstChild);
    }
    var crossfade = !!w.className && w.className !== mode;
    if (crossfade) { w.style.opacity = '0'; void w.offsetWidth; }
    w.className = mode;
    w.removeAttribute('style');
    w.textContent = '';
    body.classList.add('has-wall');

    if (mode === 'aurora') {
      w.innerHTML = '<i></i><i></i><i></i><i></i>';
    } else if (mode === 'bloom') {
      /* Bokeh: many small soft discs rather than three huge blooms. */
      for (var b = 0; b < 14; b++) {
        var o = document.createElement('i');
        var sz = 6 + Math.random() * 16;
        o.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) +
          '%;width:' + sz.toFixed(1) + 'vmax;height:' + sz.toFixed(1) + 'vmax;' +
          'animation-delay:-' + (Math.random() * 24).toFixed(1) + 's;animation-duration:' + (18 + Math.random() * 16).toFixed(1) + 's';
        w.appendChild(o);
      }
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
      w.innerHTML = '<i></i><b></b>';
    } else if (mode === 'stars' || mode === 'void') {
      /* Stars live in a wrapper so the whole field can drift as one animation
         instead of one per star. Void gets fewer, sharper points and no
         shooting star, so it reads as deep space rather than a copy of stars. */
      var field = document.createElement('div');
      field.className = 'sky';
      var n = mode === 'void' ? 46 : 34;
      for (var i = 0; i < n; i++) {
        var s = document.createElement('i');
        var sz = mode === 'void' ? 1 + Math.random() * 1.4 : 1 + Math.random() * 2;
        s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) +
          '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;animation-delay:-' + (Math.random() * 6).toFixed(1) +
          's;animation-duration:' + (3 + Math.random() * 4).toFixed(1) + 's';
        field.appendChild(s);
      }
      w.appendChild(field);
      if (mode === 'stars') w.appendChild(document.createElement('b'));
    } else if (mode === 'embers') {
      for (var j = 0; j < 26; j++) {
        var e = document.createElement('i');
        var es = 2 + Math.random() * 3;
        e.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;width:' + es.toFixed(1) + 'px;height:' + es.toFixed(1) +
          'px;animation-delay:-' + (Math.random() * 9).toFixed(1) + 's;animation-duration:' + (7 + Math.random() * 6).toFixed(1) + 's';
        w.appendChild(e);
      }
    } else if (mode === 'monohue') {
      w.innerHTML = MONOHUE;
    } else if (mode === 'ripple') {
      w.innerHTML = '<i></i><i></i><i></i>';
    } else if (mode === 'clouds') {
      buildClouds(w);
    } else if (mode === 'dither') {
      buildDither(w);
    } else if (mode === 'custom') {
      w.style.backgroundImage = 'linear-gradient(rgba(10,16,22,.5),rgba(10,16,22,.5)),url("' + custom + '")';
    }
    /* felt, fluted, thermal, speckle, blueprint, halftone, grass, paper and
       contour are pure CSS: the class name is all they need. */
    if (crossfade) {
      w.style.opacity = '0';
      requestAnimationFrame(function () {
        if (transitionId === wallTransition && document.getElementById('wall') === w) w.style.opacity = '1';
      });
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
    chrome.storage.local.get(['wallpaper', 'wallpaperCollections', 'activeWallpaperCollection', 'wallpaperRotation', 'wallpaperRotationIndex'], function (d) {
      custom = d.wallpaper || '';
      if (!mode) mode = custom ? 'custom' : (THEME_WALL[ls('theme')] || 'aurora');
      /* One rotation step per new-tab startup; no timers or background worker. */
      if (d.wallpaperRotation && Array.isArray(d.wallpaperCollections)) {
        var active = d.wallpaperCollections.filter(function (c) { return c && c.id === d.activeWallpaperCollection; })[0];
        var ids = active && Array.isArray(active.wallpapers) ? active.wallpapers.filter(function (id, i, a) {
          return MODES.indexOf(id) >= 0 && id !== 'custom' && a.indexOf(id) === i;
        }).slice(0, 20) : [];
        if (ids.length > 1) {
          var previous = parseInt(d.wallpaperRotationIndex, 10);
          var nextIndex = isFinite(previous) ? (previous + 1) % ids.length : 0;
          mode = ids[nextIndex];
          chrome.storage.local.set({ wallpaperRotationIndex: nextIndex, wallMode: mode });
        }
      }
      try { localStorage.setItem('wallMode', mode); } catch (e) {}
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
