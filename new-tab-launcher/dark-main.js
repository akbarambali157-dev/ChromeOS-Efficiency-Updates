/* Runs in the page itself. Makes simple dark/light checks from page scripts report dark. */
(function () {
  try {
    if (window.__mmPatched || !window.matchMedia) return;
    window.__mmPatched = true;
    var orig = window.matchMedia;
    window.matchMedia = function (q) {
      var r = orig.apply(window, arguments);
      if (typeof q !== 'string') return r;
      var s = q.replace(/\s+/g, '').toLowerCase();
      var dark = s === '(prefers-color-scheme:dark)';
      var light = s === '(prefers-color-scheme:light)';
      if (!dark && !light) return r;
      return new Proxy(r, {
        get: function (t, p) {
          if (p === 'matches') return dark;
          var v = t[p];
          return typeof v === 'function' ? v.bind(t) : v;
        }
      });
    };
  } catch (e) {}
})();
