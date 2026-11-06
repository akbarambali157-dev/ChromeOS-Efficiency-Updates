/* Shared read-through cache over chrome.storage.local.
   Every page used to call chrome.storage.local.get separately for the same keys
   (shortcuts was read twice on the home page alone). This keeps one copy in
   memory per page and drops it when storage actually changes, so a new tab does
   one storage round trip instead of several. */
(function () {
  'use strict';

  var cache = {};
  var listeners = [];

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;
    Object.keys(changes).forEach(function (k) { delete cache[k]; });
    listeners.forEach(function (fn) { try { fn(changes); } catch (e) {} });
  });

  function pick(want) {
    var out = {};
    want.forEach(function (k) { if (k in cache) out[k] = cache[k]; });
    return out;
  }

  window.store = {
    /* Same shape as chrome.storage.local.get: a key, or an array of keys. */
    get: function (keys, cb) {
      var want = Array.isArray(keys) ? keys : [keys];
      var missing = want.filter(function (k) { return !(k in cache); });
      if (!missing.length) { cb(pick(want)); return; }
      chrome.storage.local.get(missing, function (d) {
        Object.keys(d).forEach(function (k) { cache[k] = d[k]; });
        cb(pick(want));
      });
    },
    set: function (obj, cb) { chrome.storage.local.set(obj, cb); },
    remove: function (k, cb) { chrome.storage.local.remove(k, cb); },
    onChange: function (fn) { listeners.push(fn); }
  };
})();
