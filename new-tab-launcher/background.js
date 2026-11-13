importScripts('tools.js');
var DARK_IDS = ['dark-sites', 'dark-all', 'dark-main'];
function noop() {}

function hostOf(url) {
  try { var u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname : ''; }
  catch (e) { return ''; }
}

/* ---------- Dark mode for websites (on by default) ---------- */
function getDark() {
  return chrome.storage.local.get(['darkMode', 'darkSkip']).then(function (d) {
    return {
      on: !(d.darkMode && d.darkMode.on === false),
      skip: (Array.isArray(d.darkSkip) ? d.darkSkip : []).filter(function (h) { return /^[a-z0-9.-]+$/i.test(h); })
    };
  });
}

/* Never inject into these. Cloudflare documents that extensions which inject CSS
   or JS into challenge pages cause unpassable Turnstile loops, and Codespaces
   breaks when its own dark styling is filtered. This is the only in-extension
   fix Cloudflare's docs actually support. */
var NEVER = [
  '*://challenges.cloudflare.com/*',
  '*://*.challenges.cloudflare.com/*',
  '*://github.dev/*',
  '*://*.githubpreview.dev/*',
  '*://github.com/codespaces*',
  '*://*.github.com/codespaces*'
];

function registerDark() {
  return getDark().then(function (c) {
    return chrome.scripting.getRegisteredContentScripts().then(function (all) {
      var ours = all.map(function (s) { return s.id; }).filter(function (id) { return DARK_IDS.indexOf(id) >= 0; });
      return ours.length ? chrome.scripting.unregisterContentScripts({ ids: ours }) : null;
    }).then(function () {
      if (!c.on) return;
      var excl = NEVER.concat(c.skip.map(function (h) { return '*://' + h + '/*'; }));
      var base = { matches: ['http://*/*', 'https://*/*'], runAt: 'document_start', allFrames: false, matchAboutBlank: false };
      var main = { id: 'dark-all', css: ['dark.css'], js: ['dark-detect.js'], matches: base.matches, runAt: base.runAt, allFrames: base.allFrames, matchAboutBlank: base.matchAboutBlank };
      main.excludeMatches = excl;
      /* Do not patch page.matchMedia(). Faking the operating-system colour
         preference is invasive and can break site theme controls and widgets. */
      return chrome.scripting.registerContentScripts([main]);
    });
  });
}

function syncTabs() {
  return Promise.all([getDark(), chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] })]).then(function (r) {
    var c = r[0];
    return Promise.all(r[1].map(function (t) {
      if (t.discarded) return null;
      var target = { tabId: t.id };
      var off = !c.on || c.skip.indexOf(hostOf(t.url)) >= 0;
      if (off) {
        return chrome.scripting.executeScript({
          target: target,
          func: function () {
            document.documentElement.setAttribute('data-dark-off', '1');
            document.documentElement.setAttribute('data-nodark', '1');
          }
        }).catch(noop);
      }
      return chrome.scripting.executeScript({ target: target, func: function () {
          /* Clear stale opt-out markers before the detector runs. This also
             handles tabs first visited while global dark mode was disabled. */
          document.documentElement.removeAttribute('data-dark-off');
          document.documentElement.removeAttribute('data-nodark');
        }
      }).then(function () { return chrome.scripting.insertCSS({ target: target, files: ['dark.css'] }); })
        .then(function () { return chrome.scripting.executeScript({ target: target, files: ['dark-detect.js'] }); })
        .catch(noop);
    }));
  });
}

function applyDark() { return registerDark().then(syncTabs).catch(noop); }

chrome.runtime.onInstalled.addListener(function () { applyDark(); touchBorn(); });
chrome.runtime.onStartup.addListener(function () { applyDark(); touchBorn(); });

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg) return;
  if (msg.type === 'darkSync' || msg.type === 'reregister') { applyDark(); return; }
  /* Lazy tab suggestions for the command bar. The page asks only when the
     search box is focused, so idle new tabs never scan every open tab. */
  if (msg.type === 'getTabs') {
    chrome.tabs.query({}).then(function (t) {
      sendResponse(t.map(function (x) {
        return { id: x.id, title: x.title, url: x.url, active: x.active, pinned: x.pinned };
      }));
    }).catch(function () { sendResponse([]); });
    return true;
  }
  /* Chat relay. brewkeg.dev sends no Access-Control-Allow-Origin header, so a
     fetch from the assistant page is blocked by the browser and rejects as
     "Failed to fetch". The service worker is not bound by page-origin CORS, so
     the POST is made here and the raw status and body are relayed back. */
  if (msg.type === 'chat') {
    fetch('https://brewkeg.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + msg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(msg.body)
    }).then(function (r) {
      return r.text().then(function (t) { sendResponse({ status: r.status, text: t }); });
    }).catch(function (e) {
      sendResponse({ status: 0, text: String((e && e.message) || e) });
    });
    return true;
  }
  /* Parallel web search relay. Same reason as the chat relay: the request is
     made from the worker so the page never has to satisfy CORS. The key comes
     from extension storage, is passed through and is never logged. */
  if (msg.type === 'search') {
    if (!msg.key) { sendResponse({ status: 401, text: 'No Parallel API key saved.' }); return; }
    fetch('https://api.parallel.ai/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': msg.key },
      body: JSON.stringify(msg.body || {})
    }).then(function (r) {
      return r.text().then(function (t) { sendResponse({ status: r.status, text: t }); });
    }).catch(function (e) {
      sendResponse({ status: 0, text: String((e && e.message) || e) });
    });
    return true;
  }
});

/* ---------- Shortcuts ---------- */
/* Alt+Shift+D flips dark mode for the site in the active tab and remembers the
   choice per host, which is what the home page has always advertised. */
function toggleDarkHere() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
    var t = tabs[0];
    if (!t || !t.id) return;
    var h = hostOf(t.url);
    if (!h) return;
    return chrome.storage.local.get('darkSkip').then(function (d) {
      var skip = Array.isArray(d.darkSkip) ? d.darkSkip : [];
      var i = skip.indexOf(h);
      if (i >= 0) skip.splice(i, 1); else skip.push(h);
      return chrome.storage.local.set({ darkSkip: skip }).then(applyDark);
    });
  }).catch(noop);
}

chrome.commands.onCommand.addListener(function (cmd) {
  if (cmd === 'close-dupes') closeDupes();
  else if (cmd === 'free-memory') freeMemory();
  else if (cmd === 'toggle-dark') toggleDarkHere();
});

/* ---------- Tab age tracking (for the Memory page) ---------- */
function touchBorn() {
  return Promise.all([chrome.tabs.query({}), chrome.storage.session.get('born')]).then(function (r) {
    var b = r[1].born || {}, n = {}, now = Date.now();
    r[0].forEach(function (t) { n[t.id] = b[t.id] || now; });
    return chrome.storage.session.set({ born: n });
  }).catch(noop);
}
chrome.tabs.onCreated.addListener(function (t) {
  chrome.storage.session.get('born').then(function (r) {
    var b = r.born || {};
    b[t.id] = Date.now();
    return chrome.storage.session.set({ born: b });
  }).catch(noop);
});
chrome.tabs.onRemoved.addListener(function (id) {
  chrome.storage.session.get(['born', 'seen']).then(function (r) {
    var b = r.born || {}, s = r.seen || {};
    delete b[id]; delete s[id];
    return chrome.storage.session.set({ born: b, seen: s });
  }).catch(noop);
});

/* ---------- Auto-suspend idle tabs ---------- */
var CHECK = 'autosuspend-check';
chrome.alarms.get(CHECK).then(function (a) {
  if (!a) chrome.alarms.create(CHECK, { periodInMinutes: 1 });
});
chrome.alarms.onAlarm.addListener(function (a) {
  if (a.name === CHECK) { touchBorn(); sweep(); }
});

function sweep() {
  return chrome.storage.local.get('autoSuspend').then(function (d) {
    var cfg = d.autoSuspend;
    var now = Date.now();
    return Promise.all([
      chrome.tabs.query({ active: false, audible: false, pinned: false, discarded: false }),
      chrome.storage.session.get('seen')
    ]).then(function (r) {
      var seen = r[1].seen || {}, next = {};
      var limit = cfg && cfg.on ? (cfg.minutes || 20) * 60000 : 0;
      r[0].forEach(function (t) {
        var ts = seen[t.id] || now;
        next[t.id] = ts;
        if (limit && !neverSuspend(t.url || t.pendingUrl || '') && now - ts > limit) chrome.tabs.discard(t.id).catch(noop);
      });
      return chrome.storage.session.set({ seen: next });
    });
  }).catch(noop);
}
