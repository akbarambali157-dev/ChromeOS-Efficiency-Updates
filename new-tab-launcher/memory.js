(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var gauge = makeGauge($('gauge'));
  var busy = false, sysTxt = '', tabTxt = '';
  function paintSum() { $('memSum').textContent = sysTxt + (tabTxt ? ' \u2022 ' + tabTxt : ''); }

  function gb(n) { return (n / 1073741824).toFixed(1); }
  function mb(b) { return b >= 1073741824 ? (b / 1073741824).toFixed(2) + ' GB' : Math.max(1, Math.round(b / 1048576)) + ' MB'; }
  function dur(ms) {
    var m = Math.floor(ms / 60000);
    if (m < 1) return 'under a minute';
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60);
    if (h < 48) return h + ' h ' + (m % 60) + ' min';
    return Math.floor(h / 24) + ' days';
  }
  function hostOf(u) {
    try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.hostname : ''; } catch (e) { return ''; }
  }

  function sys() {
    chrome.system.memory.getInfo(function (i) {
      if (!i) return;
      var pct = (i.capacity - i.availableCapacity) / i.capacity * 100;
      gauge.set(pct, 'Memory ' + Math.round(pct) + '% used');
      sysTxt = gb(i.availableCapacity) + ' GB free of ' + gb(i.capacity) + ' GB';
      paintSum();
    });
  }

  function measure(rows) {
    var queue = rows.filter(function (r) { return r.web && !r.tab.discarded; });
    var i = 0;
    function worker() {
      if (i >= queue.length) return Promise.resolve();
      var r = queue[i++];
      return chrome.scripting.executeScript({
        target: { tabId: r.tab.id },
        func: function () {
          var m = performance.memory;
          return m ? { u: m.usedJSHeapSize, t: m.totalJSHeapSize } : null;
        }
      }).then(function (res) { r.mem = res && res[0] && res[0].result || null; }, function () { r.mem = null; })
        .then(worker);
    }
    return Promise.all([worker(), worker(), worker(), worker()]);
  }

  function barClass(b) { return b > 200 * 1048576 ? 'hot' : b > 80 * 1048576 ? 'warn' : ''; }

  function row(opts) {
    var d = document.createElement('div');
    d.className = 'mrow' + (opts.dim ? ' dim' : '');
    var img = document.createElement('img');
    img.className = 'fav'; img.alt = '';
    if (opts.host) img.src = 'https://www.google.com/s2/favicons?sz=32&domain=' + opts.host;
    var mid = document.createElement('div'); mid.className = 'mid';
    var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = opts.title;
    var meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = opts.meta;
    mid.appendChild(nm); mid.appendChild(meta);
    var bar = document.createElement('div'); bar.className = 'mbar';
    var fill = document.createElement('i');
    fill.className = barClass(opts.bytes || 0);
    bar.appendChild(fill); mid.appendChild(bar);
    setTimeout(function () { fill.style.width = Math.max(opts.bytes ? 3 : 0, opts.pct) + '%'; }, 30);
    d.appendChild(img); d.appendChild(mid);
    var v = document.createElement('div'); v.className = 'mval'; v.textContent = opts.val;
    d.appendChild(v);
    if (opts.buttons) {
      var bx = document.createElement('div'); bx.className = 'rowbtns';
      opts.buttons.forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = b[0]; btn.addEventListener('click', b[1]);
        bx.appendChild(btn);
      });
      d.appendChild(bx);
    }
    return d;
  }

  function render(rows, now) {
    var tabsBox = $('tabList'), siteBox = $('bySite');
    tabsBox.textContent = ''; siteBox.textContent = '';

    var maxTab = 1;
    rows.forEach(function (r) { if (r.mem && r.mem.u > maxTab) maxTab = r.mem.u; });
    var sorted = rows.slice().sort(function (a, b) {
      return ((b.mem ? b.mem.u : -1) - (a.mem ? a.mem.u : -1));
    });
    var susp = rows.filter(function (r) { return r.tab.discarded; }).length;
    var audio = rows.filter(function (r) { return r.tab.audible; }).length;
    tabTxt = rows.length + ' tabs' + (susp ? ', ' + susp + ' suspended' : '') + (audio ? ', ' + audio + ' playing audio' : '');
    paintSum();

    sorted.forEach(function (r) {
      var t = r.tab, state = [];
      if (t.active) state.push('active');
      if (t.audible) state.push('playing audio');
      if (t.pinned) state.push('pinned');
      if (t.discarded) state.push('suspended');
      else if (!t.active && r.seen) state.push('idle ' + dur(now - r.seen));
      var meta = (r.host || 'browser page') + ' \u2022 running ' + dur(now - r.born) +
        (state.length ? ' \u2022 ' + state.join(', ') : '');
      var btns = [['Go', function () {
        chrome.tabs.update(t.id, { active: true });
        chrome.windows.update(t.windowId, { focused: true });
      }]];
      if (!t.active && !t.discarded && r.web) btns.push(['Suspend', function () { chrome.tabs.discard(t.id).then(refresh, refresh); }]);
      if (!t.active) btns.push(['Close', function () { chrome.tabs.remove(t.id).then(refresh, refresh); }]);
      tabsBox.appendChild(row({
        title: t.title || t.url || 'Tab', host: r.host, meta: meta, dim: t.discarded,
        bytes: r.mem ? r.mem.u : 0, pct: r.mem ? r.mem.u / maxTab * 100 : 0,
        val: r.mem ? mb(r.mem.u) : (t.discarded ? 'asleep' : '\u2013'), buttons: btns
      }));
    });

    // by site, counting identical readings once (tabs sharing one process)
    var sites = {};
    rows.forEach(function (r) {
      var k = r.host || 'Browser pages';
      var s = sites[k] || (sites[k] = { host: r.host, tabs: 0, seen: {}, bytes: 0, oldest: 0 });
      s.tabs++;
      s.oldest = Math.max(s.oldest, now - r.born);
      if (r.mem) {
        var sig = r.mem.u + ':' + r.mem.t;
        if (!s.seen[sig]) { s.seen[sig] = 1; s.bytes += r.mem.u; }
      }
    });
    var list = Object.keys(sites).map(function (k) { return [k, sites[k]]; })
      .sort(function (a, b) { return b[1].bytes - a[1].bytes; }).slice(0, 8);
    var maxSite = list.length ? Math.max(1, list[0][1].bytes) : 1;
    list.forEach(function (e) {
      var s = e[1];
      siteBox.appendChild(row({
        title: e[0], host: s.host,
        meta: s.tabs + (s.tabs === 1 ? ' tab' : ' tabs') + ' \u2022 longest running ' + dur(s.oldest),
        bytes: s.bytes, pct: s.bytes / maxSite * 100, val: s.bytes ? '\u2248 ' + mb(s.bytes) : '\u2013'
      }));
    });
  }

  function refresh() {
    if (busy) return Promise.resolve();
    busy = true;
    sys();
    $('mStatus').textContent = 'Measuring\u2026';
    return Promise.all([chrome.tabs.query({}), chrome.storage.session.get(['born', 'seen'])]).then(function (r) {
      var now = Date.now(), born = r[1].born || {}, seen = r[1].seen || {};
      var rows = r[0].map(function (t) {
        var h = hostOf(t.url || t.pendingUrl || '');
        return { tab: t, host: h, web: !!h, born: born[t.id] || now, seen: seen[t.id] || 0, mem: null };
      });
      return measure(rows).then(function () { render(rows, now); $('mStatus').textContent = ''; });
    }).catch(function () { $('mStatus').textContent = 'Could not read tabs.'; })
      .then(function () { busy = false; });
  }

  $('refresh').addEventListener('click', refresh);
  $('suspendAll').addEventListener('click', function () {
    freeMemory().then(function (n) {
      $('mStatus').textContent = n ? 'Suspended ' + n + (n === 1 ? ' tab.' : ' tabs.') : 'Nothing to suspend right now.';
      setTimeout(refresh, 600);
    });
  });
  refresh();
  setInterval(function () { if (!document.hidden) refresh(); }, 15000);
  setInterval(sys, 4000);
})();
