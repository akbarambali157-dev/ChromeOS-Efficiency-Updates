/* Shared assistant brain. Both the full Assistant page and the floating orb on
   the home page drive this, so the intents, the speech, the listening loop and
   the brewkeg call exist exactly once. The caller supplies a small view object
   that knows how to draw lines, panels and state:

     view.addLine(who, text)   who is 'me' or 'ai'
     view.addPanel(title, node)
     view.setState(s)          s is idle | listening | thinking | speaking
     view.micOn(on)            optional
     view.interim(text)        optional
     view.maxLines             how many lines to keep (14 page, 6 orb)
*/
(function () {
  'use strict';

  window.AssistantCore = function (view) {
    var DEFAULT_MODEL = 'claude-haiku-4-5';
    var cfg = { name: 'Nova', model: DEFAULT_MODEL, speak: true, wake: false };
    var key = '', ghToken = '';
    var history = [];
    var state = 'idle', busy = false;
    var CODES = {
      0: 'clear', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'foggy', 48: 'foggy',
      51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 56: 'freezing drizzle', 57: 'freezing drizzle',
      61: 'light rain', 63: 'rainy', 65: 'heavy rain', 66: 'freezing rain', 67: 'freezing rain',
      71: 'light snow', 73: 'snowy', 75: 'heavy snow', 77: 'snow grains', 80: 'rain showers', 81: 'rain showers',
      82: 'heavy showers', 85: 'snow showers', 86: 'snow showers', 95: 'thunderstorms', 96: 'thunderstorms', 99: 'thunderstorms'
    };
    var KNOWN = {
      'github': 'https://github.com', 'git hub': 'https://github.com', 'google drive': 'https://drive.google.com',
      'drive': 'https://drive.google.com', 'gmail': 'https://mail.google.com', 'email': 'https://mail.google.com',
      'youtube': 'https://www.youtube.com', 'claude': 'https://claude.ai', 'google': 'https://www.google.com',
      'brewkeg': 'https://brewkeg.dev/dashboard', 'docs': 'https://docs.google.com/document/',
      'google docs': 'https://docs.google.com/document/', 'sheets': 'https://docs.google.com/spreadsheets/',
      'google sheets': 'https://docs.google.com/spreadsheets/', 'slides': 'https://docs.google.com/presentation/',
      'codespaces': 'https://github.com/codespaces', 'my codespaces': 'https://github.com/codespaces',
      'pull requests': 'https://github.com/pulls', 'issues': 'https://github.com/issues'
    };
    var PAGES = { 'memory': 'memory.html', 'memory monitor': 'memory.html', 'sessions': 'sessions.html', 'home': 'newtab.html',
      'launcher': 'newtab.html', 'github page': 'github.html', 'drive page': 'drive.html', 'brewkeg page': 'brewkeg.html' };

    /* ---------- helpers ---------- */
    function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
    function hostOf(u) { try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.hostname.replace(/^www\./, '') : ''; } catch (e) { return ''; } }
    function gb(n) { return (n / 1073741824).toFixed(1); }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

    function setState(s) { state = s; view.setState(s); }
    function addLine(who, text) { view.addLine(who, text); }
    function addPanel(title, node) { view.addPanel(title, node); }

    /* ---------- speaking ---------- */
    var voice = null;
    function pickVoice() {
      var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
      var en = vs.filter(function (v) { return /^en/i.test(v.lang); });
      voice = en.filter(function (v) { return /female|samantha|zira|google us english|google uk english female/i.test(v.name); })[0] || en[0] || null;
    }
    if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
    function speak(text) {
      if (!cfg.speak || !window.speechSynthesis) return Promise.resolve();
      return new Promise(function (resolve) {
        var done = false;
        function res() { if (!done) { done = true; resolve(); } }
        setTimeout(res, 8000 + text.length * 90);
        try { speechSynthesis.cancel(); } catch (e) {}
        var u = new SpeechSynthesisUtterance(text);
        if (voice) u.voice = voice;
        u.rate = 1.03;
        u.onstart = function () { setState('speaking'); };
        u.onend = u.onerror = function () { res(); };
        speechSynthesis.speak(u);
      });
    }

    /* ---------- listening ---------- */
    var rec = null, recOn = false, wantListen = false, awaiting = false;
    function stopRec() { try { if (rec && recOn) rec.stop(); } catch (e) {} }
    function startListening() {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { addLine('ai', "This browser can't do speech recognition, so please type your request."); wantListen = false; return; }
      if (recOn || busy) return;
      var finalText = '';
      rec = new SR();
      rec.lang = navigator.language || 'en-US';
      rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      rec.onstart = function () { recOn = true; if (state === 'idle') setState('listening'); if (view.micOn) view.micOn(true); };
      rec.onresult = function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
        }
        if (view.interim) view.interim(finalText + interim);
      };
      rec.onerror = function (e) {
        var er = e.error;
        if (er === 'no-speech' || er === 'aborted') return;
        wantListen = false;
        if (er === 'not-allowed' || er === 'service-not-allowed') addLine('ai', 'The microphone is blocked. Click the lock icon in the address bar and allow the microphone, then try again.');
        else if (er === 'network') addLine('ai', "I couldn't reach Chrome's speech service. Check your internet, or type your request instead.");
        else addLine('ai', 'Voice input stopped (' + er + '). You can still type.');
      };
      rec.onend = function () {
        recOn = false;
        if (view.micOn) view.micOn(false);
        if (state === 'listening') setState('idle');
        if (view.interim) view.interim('');
        var t = finalText.trim();
        if (t) onHeard(t);
        else if (wantListen && !busy && !document.hidden) setTimeout(function () { if (wantListen) startListening(); }, 300);
      };
      try { rec.start(); } catch (e) { recOn = false; }
    }
    function resume() {
      if (wantListen && !recOn && !document.hidden) setTimeout(function () { if (wantListen) startListening(); }, 250);
    }
    function setWake(on) {
      wantListen = !!on;
      if (wantListen) startListening(); else stopRec();
    }
    function onHeard(t) {
      if (wantListen && cfg.wake && !awaiting) {
        var low = t.toLowerCase(), nm = cfg.name.toLowerCase(), i = low.indexOf(nm);
        if (i < 0) { resume(); return; }
        var rest = t.slice(i + nm.length).replace(/^[\s,.:;!?-]+/, '');
        if (!rest) {
          awaiting = true; busy = true; addLine('ai', 'Yes?');
          speak('Yes?').then(function () { busy = false; setState('idle'); resume(); });
          return;
        }
        t = rest;
      }
      awaiting = false;
      handle(t);
    }

    /* ---------- actions ---------- */
    function gh(path, method) {
      return fetch('https://api.github.com' + path, {
        method: method || 'GET',
        headers: { 'Authorization': 'Bearer ' + ghToken, 'Accept': 'application/vnd.github+json' }
      }).then(function (r) {
        if (r.status === 401 || r.status === 403 || r.status === 404) throw new Error('auth');
        if (!r.ok) throw new Error('http' + r.status);
        return r.status === 204 ? {} : r.json();
      });
    }
    function csName(c) { return (c.repository && c.repository.name) || c.display_name || c.name; }

    function perfReport() {
      return Promise.all([new Promise(function (res) { chrome.system.memory.getInfo(res); }), chrome.tabs.query({})]).then(function (r) {
        var info = r[0], tabs = r[1];
        var pct = (info.capacity - info.availableCapacity) / info.capacity * 100;
        var susp = tabs.filter(function (t) { return t.discarded; }).length;
        var gdiv = el('div'), g = makeGauge(gdiv);
        addPanel('Memory', gdiv);
        setTimeout(function () { g.set(pct); }, 80);

        var web = tabs.filter(function (t) { return /^https?:/.test(t.url || '') && !t.discarded; }).slice(0, 25);
        var out = [], idx = 0;
        function worker() {
          if (idx >= web.length) return Promise.resolve();
          var t = web[idx++];
          return chrome.scripting.executeScript({
            target: { tabId: t.id },
            func: function () { var m = performance.memory; return m ? m.usedJSHeapSize : null; }
          }).then(function (res) { var v = res && res[0] && res[0].result; if (v) out.push({ t: t, v: v }); }, function () {}).then(worker);
        }
        return Promise.all([worker(), worker(), worker(), worker()]).then(function () {
          out.sort(function (a, b) { return b.v - a.v; });
          var top = out.slice(0, 3);
          if (top.length) {
            var box = el('div');
            top.forEach(function (x) {
              var row = el('div', 'prow');
              row.appendChild(el('span', '', hostOf(x.t.url) || x.t.title));
              row.appendChild(el('span', '', Math.max(1, Math.round(x.v / 1048576)) + ' MB'));
              box.appendChild(row);
              var bar = el('div', 'mbar'), fill = el('i', x.v > 200 * 1048576 ? 'hot' : x.v > 80 * 1048576 ? 'warn' : '');
              bar.appendChild(fill); box.appendChild(bar);
              setTimeout(function () { fill.style.width = Math.max(4, x.v / top[0].v * 100) + '%'; }, 100);
            });
            addPanel('Heaviest tabs', box);
          }
          var msg = 'Memory is ' + Math.round(pct) + ' percent used, with ' + gb(info.availableCapacity) + ' gigabytes free of ' + gb(info.capacity) +
            '. You have ' + plural(tabs.length, 'tab') + ' open' + (susp ? ', ' + susp + ' of them suspended' : '') + '.';
          if (top.length) msg += ' The heaviest is ' + (hostOf(top[0].t.url) || 'one tab') + ', at about ' + Math.round(top[0].v / 1048576) + ' megabytes of page memory.';
          if (pct >= 80) msg += ' That is high. I can free up memory if you like.';
          return msg;
        });
      });
    }

    function weather() {
      return chrome.storage.local.get(['weather', 'weatherCache']).then(function (d) {
        var w = d.weather, c = d.weatherCache;
        if (!w || !w.city) return 'Set your city in the launcher settings first, then ask me again.';
        if (!c) return "I don't have the forecast yet. Open the launcher home page once, then ask me again.";
        var city = String(w.city.name).split(',')[0], unit = w.unit === 'f' ? 'F' : 'C';
        var box = el('div');
        box.appendChild(el('div', 'big', Math.round(c.cur) + '°' + unit));
        box.appendChild(el('div', 'sub2', city + ' • ' + (CODES[c.code] || 'weather') + ' • H ' + Math.round(c.hi) + '° L ' + Math.round(c.lo) + '°'));
        addPanel('Weather', box);
        return 'In ' + city + ' it is ' + Math.round(c.cur) + ' degrees ' + (unit === 'F' ? 'Fahrenheit' : 'Celsius') + ' and ' + (CODES[c.code] || 'unsettled') +
          '. Today the high is ' + Math.round(c.hi) + ' and the low is ' + Math.round(c.lo) + '.';
      });
    }

    function codespaces(it) {
      return chrome.storage.local.get('ghToken').then(function (d) {
        if (!d.ghToken) return 'Connect your GitHub token on the GitHub tab first.';
        ghToken = d.ghToken;
        return gh('/user/codespaces?per_page=30').then(function (res) {
          var list = res.codespaces || [];
          if (!list.length) return 'You have no codespaces yet.';
          var box = el('div');
          list.slice(0, 4).forEach(function (c) {
            var row = el('div', 'prow');
            row.appendChild(el('span', '', csName(c)));
            row.appendChild(el('span', '', c.state === 'Available' ? 'running' : c.state === 'Shutdown' ? 'stopped' : c.state.toLowerCase()));
            box.appendChild(row);
          });
          addPanel('Codespaces', box);
          var running = list.filter(function (c) { return c.state === 'Available'; });
          if (it.verb === 'list') return 'You have ' + plural(list.length, 'codespace') + ', and ' + (running.length ? running.length + ' running.' : 'none running.');
          var want = it.verb === 'stop' ? 'Available' : 'Shutdown';
          var pool = list.filter(function (c) { return c.state === want; });
          if (!pool.length) return it.verb === 'stop' ? 'None of your codespaces are running.' : 'Your codespaces are already running or busy.';
          pool.sort(function (a, b) { return String(b.last_used_at).localeCompare(String(a.last_used_at)); });
          var named = pool.filter(function (c) { return it.text.indexOf(csName(c).toLowerCase()) >= 0; })[0];
          var pick = named || pool[0];
          return gh('/user/codespaces/' + encodeURIComponent(pick.name) + '/' + it.verb, 'POST').then(function () {
            return (it.verb === 'stop' ? 'Stopping ' : 'Starting ') + csName(pick) + (it.verb === 'start' ? '. Give it about a minute.' : '.');
          });
        });
      }).catch(function (e) {
        return e && e.message === 'auth' ? 'GitHub rejected the token. Check it has the codespace scope.' : "I couldn't reach GitHub right now.";
      });
    }

    function openThing(what) {
      what = what.replace(/^(the|my)\s+/, '').trim();
      var url = KNOWN[what] || KNOWN[what.replace(/\s+/g, '')];
      if (!url && PAGES[what]) url = chrome.runtime.getURL(PAGES[what]);
      return (url ? Promise.resolve(url) : chrome.storage.local.get('shortcuts').then(function (d) {
        var s = (d.shortcuts || []).filter(function (x) { return x.name.toLowerCase() === what || x.name.toLowerCase().indexOf(what) >= 0; })[0];
        if (s) return s.url;
        var dom = what.replace(/\s+dot\s+/g, '.').replace(/\s+/g, '');
        return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(dom) ? 'https://' + dom : '';
      })).then(function (u) {
        if (!u) return "I don't know a site called " + what + ". I can search for it instead if you like.";
        return chrome.tabs.create({ url: u }).then(function () { return 'Opening ' + what + '.'; });
      });
    }

    /* ---------- files (summary saved by the Files page) ---------- */
    function fmtB(b) {
      if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' gigabytes';
      if (b >= 1048576) return Math.round(b / 1048576) + ' megabytes';
      return Math.max(1, Math.round(b / 1024)) + ' kilobytes';
    }
    function agoTxt(ms) {
      var h = Math.round((Date.now() - ms) / 3600000);
      return h < 1 ? 'just now' : h < 48 ? h + ' hours ago' : Math.round(h / 24) + ' days ago';
    }
    function filesReply() {
      return chrome.storage.local.get('fileScan').then(function (d) {
        var s = d.fileScan;
        if (!s) return 'I have not scanned a folder yet. Open the Files tab, choose a folder, and press Scan. I will then be able to tell you what is in it and what you can clean up.';
        var box = el('div');
        Object.keys(s.types).sort(function (a, b) { return s.types[b].b - s.types[a].b; }).slice(0, 4).forEach(function (k) {
          var row = el('div', 'prow');
          row.appendChild(el('span', '', k + ' (' + s.types[k].n + ')'));
          row.appendChild(el('span', '', fmtB(s.types[k].b).replace(' gigabytes', ' GB').replace(' megabytes', ' MB').replace(' kilobytes', ' KB')));
          box.appendChild(row);
        });
        addPanel('Folder: ' + s.folder, box);
        var parts = [];
        ['junk', 'installers', 'dupes', 'bigOld'].forEach(function (k) {
          var g = s.groups[k];
          if (g && g.n) parts.push(g.n + ' ' + { junk: 'junk or empty files', installers: 'old installers', dupes: 'likely duplicates', bigOld: 'big old files to review' }[k]);
        });
        var msg = 'Your ' + s.folder + ' folder has ' + s.files + ' files using ' + fmtB(s.bytes) + ', scanned ' + agoTxt(s.t) + '.';
        if (parts.length) msg += ' I found ' + parts.join(', ') + '. About ' + fmtB(s.clean) + ' could be cleaned up. Open the Files tab to review and move them.';
        else msg += ' I did not find anything obvious to clean up.';
        return msg;
      });
    }

    /* ---------- email (reads your signed-in Gmail inbox, read only) ---------- */
    function fetchMail() {
      return fetch('https://mail.google.com/mail/u/0/feed/atom', { credentials: 'include' }).then(function (r) {
        if (r.status === 401 || r.status === 403) throw new Error('signin');
        if (!r.ok) throw new Error('http' + r.status);
        return r.text();
      }).then(function (x) {
        var doc = new DOMParser().parseFromString(x, 'application/xml');
        if (!doc.querySelector('feed')) throw new Error('signin');
        var cnt = doc.querySelector('fullcount');
        var items = Array.prototype.slice.call(doc.querySelectorAll('entry')).map(function (e) {
          function q(sel) { var n = e.querySelector(sel); return n ? n.textContent.trim() : ''; }
          var l = e.querySelector('link'), href = l ? l.getAttribute('href') : '';
          return {
            title: q('title') || '(no subject)', snippet: q('summary'),
            from: q('author > name') || q('author > email') || 'Unknown sender',
            href: /^https:\/\/mail\.google\.com\//.test(href) ? href : 'https://mail.google.com/'
          };
        });
        return { count: cnt ? parseInt(cnt.textContent, 10) || 0 : items.length, items: items };
      });
    }
    function emailReply(it) {
      return fetchMail().then(function (m) {
        if (!m.count) return 'You have no unread emails.';
        var box = el('div');
        m.items.slice(0, 5).forEach(function (x) {
          var a = el('a', 'mail');
          a.href = x.href; a.target = '_blank'; a.rel = 'noopener';
          a.appendChild(el('b', '', x.from));
          a.appendChild(el('span', '', x.title));
          if (x.snippet) a.appendChild(el('small', '', x.snippet.slice(0, 90)));
          box.appendChild(a);
        });
        addPanel(m.count + ' unread', box);
        if (it.verb === 'summarize') {
          if (!key) return 'I need your brewkeg key to summarize. For now: you have ' + plural(m.count, 'unread email') + ', the newest from ' + m.items[0].from + ' about ' + m.items[0].title + '.';
          var digest = m.items.slice(0, 10).map(function (x, i) { return (i + 1) + '. From ' + x.from + ': ' + x.title + ' - ' + x.snippet.slice(0, 160); }).join('\n');
          return ask('Summarize these unread emails in two or three short sentences and say if anything looks urgent.\n' + digest, true);
        }
        var msg = 'You have ' + plural(m.count, 'unread email') + '. The newest is from ' + m.items[0].from + ' about ' + m.items[0].title + '.';
        if (m.items[1]) msg += ' Then ' + m.items[1].from + ' about ' + m.items[1].title + '.';
        if (m.items[2]) msg += ' And ' + m.items[2].from + ' about ' + m.items[2].title + '.';
        return msg;
      }).catch(function (e) {
        if (e && e.message === 'signin') return "I couldn't read Gmail. Make sure you're signed in to Gmail in this Chrome, then try again.";
        return "Gmail didn't respond. You can say open Gmail instead.";
      });
    }

    function route(text) {
      var it = assistantIntent(text);
      if (!it) return null;
      switch (it.k) {
        case 'help': return Promise.resolve('I can give a performance report, check your unread email, tell you what is in your scanned folder, close duplicate tabs, free up memory, tell you the weather, start or stop your codespaces, open sites, search the web, switch dark mode or themes, and answer general questions.');
        case 'perf': return perfReport();
        case 'dupes': return closeDupes().then(function (n) { return n ? 'Closed ' + plural(n, 'duplicate tab') + '.' : 'There are no duplicate tabs.'; });
        case 'free': return freeMemory().then(function (n) { return n ? 'Suspended ' + plural(n, 'background tab') + '. They reload when you open them.' : 'There is nothing to suspend right now.'; });
        case 'weather': return weather();
        case 'time': return Promise.resolve('It is ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.');
        case 'date': return Promise.resolve('Today is ' + new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + '.');
        case 'codespace': return codespaces(it);
        case 'files': return filesReply();
        case 'email': return emailReply(it);
        case 'dark':
          if (it.value === null) return Promise.resolve('Tell me to turn dark mode on, or off.');
          return chrome.storage.local.set({ darkMode: { on: it.value } }).then(function () {
            chrome.runtime.sendMessage({ type: 'darkSync' }, function () { void chrome.runtime.lastError; });
            return 'Dark mode for websites is now ' + (it.value ? 'on' : 'off') + '.';
          });
        case 'theme':
          if (!it.value) return Promise.resolve('Which theme? I have ' + assistantThemes.join(', ') + '.');
          try { localStorage.setItem('theme', it.value); } catch (e) {}
          document.documentElement.setAttribute('data-theme', it.value);
          return chrome.storage.local.set({ theme: it.value }).then(function () { return 'Switched to the ' + it.value + ' theme.'; });
        case 'open': return openThing(it.what);
        case 'search':
          return chrome.tabs.create({ url: 'https://www.google.com/search?q=' + encodeURIComponent(it.what) }).then(function () { return 'Searching for ' + it.what + '.'; });
      }
      return null;
    }

    /* ---------- the AI brain (brewkeg, OpenAI-style chat endpoint) ---------- */
    /* brewkeg.dev returns no Access-Control-Allow-Origin header, so fetching it
       from a page is blocked and rejects as "Failed to fetch". The background
       service worker is not bound by page-origin CORS, so the POST is relayed
       through it. The response is wrapped in a fetch-like shim so the status
       handling below stays unchanged. */
    function shim(status, text) {
      return {
        status: status,
        ok: status >= 200 && status < 300,
        text: function () { return Promise.resolve(text); },
        json: function () { return Promise.resolve(JSON.parse(text)); }
      };
    }
    function chatPost(body, keyOverride) {
      return new Promise(function (resolve, reject) {
        try {
          chrome.runtime.sendMessage({ type: 'chat', key: keyOverride || key, body: body }, function (res) {
            if (chrome.runtime.lastError || !res) {
              reject(new Error('net:' + ((chrome.runtime.lastError && chrome.runtime.lastError.message) || 'no response from background')));
              return;
            }
            if (!res.status) { reject(new Error('net:' + (res.text || 'request failed'))); return; }
            resolve(shim(res.status, res.text));
          });
        } catch (e) { reject(new Error('net:' + ((e && e.message) || 'messaging unavailable'))); }
      });
    }

    function ask(text, noHistory) {
      if (!key) return Promise.resolve('To answer general questions I need your brewkeg key. Open Assistant settings and paste it in. Commands like weather, tabs and codespaces already work without it.');
      var sys = 'You are ' + cfg.name + ', a friendly voice assistant inside the user\'s Chromebook new-tab launcher. ' +
        'Your replies are spoken aloud, so answer in one to three short plain sentences with no markdown, lists or emoji. ' +
        'The launcher already handles weather, tabs, memory reports, codespaces and opening sites by itself, so do not pretend to do those. ' +
        'If you cannot do something on the user\'s computer, say so briefly. Current date and time: ' + new Date().toString() + '.';
      var msgs = [{ role: 'system', content: sys }].concat(history.slice(-10), [{ role: 'user', content: text }]);
      return chatPost({ model: cfg.model, messages: msgs, max_tokens: 350 }).then(function (r) {
        if (r.status === 401 || r.status === 403) throw new Error('key');
        if (r.status === 402) throw new Error('balance');
        if (r.status === 429) throw new Error('rate');
        if (r.status === 400 || r.status === 404 || r.status === 422) {
          return r.text().then(function (t) {
            var msg = t;
            try { var j = JSON.parse(t); msg = (j.error && (j.error.message || j.error)) || j.message || t; } catch (e) {}
            throw new Error('badreq:' + String(msg).slice(0, 140));
          });
        }
        if (!r.ok) throw new Error('http' + r.status);
        return r.json();
      }).then(function (d) {
        var out = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
        if (!out) throw new Error('empty');
        out = String(out).replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
        if (!noHistory) history.push({ role: 'user', content: text }, { role: 'assistant', content: out });
        return out;
      }).catch(function (e) {
        var m = e && e.message;
        if (m === 'key') return 'Brewkeg rejected the key. Check it in Assistant settings.';
        if (m === 'balance') return 'Brewkeg says your balance may be used up. Check your dashboard.';
        if (m === 'rate') return 'Brewkeg is rate limiting me. Try again in a moment.';
        if (m && m.indexOf('badreq:') === 0) return 'Brewkeg did not accept that request. It said: ' + m.slice(7) + ' You can change the model name in Assistant settings.';
        if (m && m.indexOf('net:') === 0) return "I couldn't reach brewkeg (" + m.slice(4) + "). Check your internet connection.";
        if (m === 'Failed to fetch') return "I couldn't reach brewkeg. Check your internet connection.";
        return 'Brewkeg returned an error (' + m + ').';
      });
    }

    /* ---------- main loop ---------- */
    function handle(text) {
      text = text.trim();
      if (!text || busy) return;
      busy = true;
      addLine('me', text);
      setState('thinking');
      var p = route(text) || ask(text);
      p.then(function (reply) { addLine('ai', reply); return speak(reply); })
        .catch(function () { var m = 'Sorry, something went wrong with that.'; addLine('ai', m); return speak(m); })
        .then(function () { busy = false; setState('idle'); resume(); });
    }

    function init(cb) {
      chrome.storage.local.get(['assistant', 'aiKey'], function (d) {
        if (d.assistant && typeof d.assistant === 'object') {
          cfg = {
            name: String(d.assistant.name || 'Nova').slice(0, 20),
            model: (!d.assistant.model || d.assistant.model === 'brewkeg-opus') ? DEFAULT_MODEL : String(d.assistant.model),
            speak: d.assistant.speak !== false,
            wake: !!d.assistant.wake
          };
        }
        key = d.aiKey || '';
        if (cb) cb(cfg, key);
      });
    }

    return {
      init: init,
      handle: handle,
      ask: ask,
      chatPost: chatPost,
      speak: speak,
      startListening: startListening,
      stopRec: stopRec,
      resume: resume,
      setWake: setWake,
      setState: setState,
      addLine: addLine,
      getCfg: function () { return cfg; },
      setCfg: function (c) { cfg = c; },
      getKey: function () { return key; },
      setKey: function (k) { key = k; },
      isBusy: function () { return busy; }
    };
  };
})();
