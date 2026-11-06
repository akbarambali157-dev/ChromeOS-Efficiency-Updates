/* Isolated content script: leaves sites that are already dark alone. */
(function () {
  'use strict';
  var de = document.documentElement;
  if (window.__darkInit) { window.__darkRevive(); return; }
  window.__darkInit = true;
  var host = location.hostname;

  function parse(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function lum(c) { return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255; }
  /* Background colour is the primary signal; when nothing opaque is found, text
     colour is the next best one (light text almost always means a dark page). */
  function verdict(el) {
    var cur = el;
    while (cur) {
      var c = parse(getComputedStyle(cur).backgroundColor);
      if (c && c.a > 0.6) return lum(c) < 0.45;
      cur = cur.parentElement;
    }
    var t = parse(getComputedStyle(el).color);
    if (t && t.a > 0.5) return lum(t) > 0.55;
    return null;
  }
  /* Nine sample points and a majority vote. Three points let a single dark
     header invert a whole light page. */
  function isDark() {
    var scheme = getComputedStyle(de).colorScheme || '';
    if (/dark/.test(scheme) && !/light/.test(scheme)) return true;
    var pts = [[0.5, 0.15], [0.5, 0.33], [0.5, 0.5], [0.5, 0.7], [0.5, 0.85],
               [0.15, 0.5], [0.85, 0.5], [0.25, 0.25], [0.75, 0.75]];
    var dark = 0, light = 0;
    for (var i = 0; i < pts.length; i++) {
      var el = document.elementFromPoint(innerWidth * pts[i][0], innerHeight * pts[i][1]);
      if (!el) continue;
      var v = verdict(el);
      if (v === true) dark++;
      else if (v === false) light++;
    }
    /* Inconclusive (everything transparent): do not invert. */
    if (!dark && !light) return false;
    return dark > light;
  }

  function remember(dark) {
    try {
      chrome.storage.local.get('nativeDark', function (d) {
        var map = d.nativeDark || {};
        if (dark && !map[host]) {
          if (Object.keys(map).length > 300) map = {};
          map[host] = 1;
        } else if (!dark && map[host]) delete map[host];
        else return;
        chrome.storage.local.set({ nativeDark: map });
      });
    } catch (e) {}
  }

  function decide() {
    if (de.hasAttribute('data-dark-off')) return;
    de.setAttribute('data-nodark', '1');
    var dark = false;
    try { dark = isDark(); } catch (e) {}
    if (!dark) de.removeAttribute('data-nodark');
    remember(dark);
  }
  window.__darkRevive = function () {
    de.removeAttribute('data-dark-off');
    de.removeAttribute('data-nodark');
    decide();
  };

  // a site we already know is dark: skip the filter before the first paint
  try {
    chrome.storage.local.get('nativeDark', function (d) {
      if (d.nativeDark && d.nativeDark[host] && !de.hasAttribute('data-dark-off')) de.setAttribute('data-nodark', '1');
    });
  } catch (e) {}

  function start() {
    decide();
    setTimeout(decide, 1200);
    var t;
    try {
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(decide, 400); })
        .observe(de, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-mode'] });
      if (document.body) new MutationObserver(function () { clearTimeout(t); t = setTimeout(decide, 400); })
        .observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.addEventListener('load', decide);
})();
