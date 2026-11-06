(function (g) {
  'use strict';
  function key(t) {
    var u = (t.url || t.pendingUrl || '').split('#')[0];
    if (!u || u.indexOf('chrome://newtab') === 0 || u.indexOf('chrome-extension://') === 0) return '';
    return u;
  }
  g.closeDupes = function () {
    return chrome.tabs.query({ currentWindow: true }).then(function (tabs) {
      tabs.sort(function (a, b) {
        return ((b.active ? 2 : 0) + (b.pinned ? 1 : 0)) - ((a.active ? 2 : 0) + (a.pinned ? 1 : 0));
      });
      var seen = {}, drop = [];
      tabs.forEach(function (t) {
        var k = key(t);
        if (!k) return;
        if (seen[k] && !t.active && !t.pinned) drop.push(t.id); else seen[k] = true;
      });
      return drop.length ? chrome.tabs.remove(drop).then(function () { return drop.length; }) : 0;
    });
  };
  /* Codespaces and local dev servers must never be discarded: dropping one kills
     a running build. Shared by the auto-suspend sweep in the service worker and
     by freeMemory below, so the two can never drift apart. */
  g.neverSuspend = function (url) {
    try {
      var u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) return true;
      var h = u.hostname;
      if (/(^|\.)github\.dev$/.test(h) || /(^|\.)githubpreview\.dev$/.test(h) || h === 'localhost') return true;
      /* github.com/<user>/<repo>/codespaces — the old predicate covered github.dev
         but not this, so a codespace tab was fair game for discarding. */
      if (/(^|\.)github\.com$/.test(h) && /^\/[^/]+\/[^/]+\/codespaces(\/|$)/.test(u.pathname)) return true;
      return false;
    } catch (e) { return true; }
  };

  g.freeMemory = function () {
    return chrome.tabs.query({ active: false, audible: false, pinned: false, discarded: false }).then(function (tabs) {
      var jobs = tabs.filter(function (t) {
        return !g.neverSuspend(t.url || t.pendingUrl || '');
      }).map(function (t) {
        return chrome.tabs.discard(t.id).then(function () { return 1; }, function () { return 0; });
      });
      return Promise.all(jobs).then(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); });
    });
  };
})(self);
