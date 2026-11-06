(function (g) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function pt(t, r) {
    var th = Math.PI * (1 - t);
    return [100 + r * Math.cos(th), 100 - r * Math.sin(th)];
  }
  function arc(t0, t1, r) {
    var a = pt(t0, r), b = pt(t1, r);
    return 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2);
  }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  g.makeGauge = function (host) {
    host.textContent = '';
    var svg = el('svg', { 'class': 'gauge', viewBox: '0 0 200 134', role: 'img', 'aria-label': 'Memory used' }, host);
    var R = 78;
    [[0, 0.6, 'var(--accent)'], [0.6, 0.85, '#f0c36b'], [0.85, 1, 'var(--danger)']].forEach(function (z) {
      el('path', { 'class': 'g-zone', d: arc(z[0], z[1], R), stroke: z[2] }, svg);
    });
    var fill = el('path', { 'class': 'g-fill', d: arc(0, 1, R), pathLength: '100', stroke: 'var(--accent)' }, svg);
    for (var i = 0; i <= 10; i++) {
      var a = pt(i / 10, 66), b = pt(i / 10, 71);
      el('line', { 'class': 'g-tick', x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1) }, svg);
    }
    var l0 = pt(0, 52), l5 = pt(0.5, 52), l1 = pt(1, 52);
    [[l0, '0'], [l5, '50'], [l1, '100']].forEach(function (p) {
      var t = el('text', { 'class': 'g-lbl', x: p[0][0].toFixed(1), y: (p[0][1] + (p[1] === '50' ? 8 : -1)).toFixed(1) }, svg);
      t.textContent = p[1];
    });
    var needle = el('g', { 'class': 'g-needle' }, svg);
    needle.style.transform = 'rotate(-90deg)';
    el('line', { x1: 100, y1: 100, x2: 100, y2: 34, stroke: 'var(--text)', 'stroke-width': 3, 'stroke-linecap': 'round' }, needle);
    el('circle', { cx: 100, cy: 100, r: 6, fill: 'var(--text)' }, svg);
    var val = el('text', { 'class': 'g-val', x: 100, y: 122 }, svg);
    var sub = el('text', { 'class': 'g-sub', x: 100, y: 112 }, svg);
    val.textContent = '\u2013'; sub.textContent = '';

    return {
      set: function (pct, label) {
        pct = Math.max(0, Math.min(100, pct));
        needle.style.transform = 'rotate(' + (pct * 1.8 - 90) + 'deg)';
        fill.style.strokeDasharray = pct + ' 100';
        fill.style.stroke = pct >= 85 ? 'var(--danger)' : pct >= 60 ? '#f0c36b' : 'var(--accent)';
        val.textContent = Math.round(pct) + '% used';
        if (label != null) svg.setAttribute('aria-label', label);
      }
    };
  };
})(window);
