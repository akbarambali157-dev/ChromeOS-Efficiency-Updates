(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var saved = Object.create(null);
  var MAX_IMPORT_FILES = 20, MAX_IMPORT_BYTES = 25 * 1048576;
  var MAX_IMPORT_LINES = 100000, MAX_LINE_CHARS = 512000, MAX_SESSIONS = 500;

  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }
  function dur(a, b) {
    var m = Math.round((new Date(b) - new Date(a)) / 60000);
    if (!(m > 0)) return 'under a minute';
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  }
  function say(msg, err) { var s = $('status'); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : ''); }

  // Read incrementally and reject pathological single-line records.
  async function readLines(file, onLine) {
    var reader = file.stream().getReader();
    var dec = new TextDecoder();
    var buf = '';
    try {
      for (;;) {
        var r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        var parts = buf.split('\n');
        buf = parts.pop();
        if (buf.length > MAX_LINE_CHARS) throw new Error('A JSONL record is too large to process safely.');
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].length > MAX_LINE_CHARS) throw new Error('A JSONL record is too large to process safely.');
          onLine(parts[i]);
        }
      }
      buf += dec.decode();
      if (buf.length > MAX_LINE_CHARS) throw new Error('A JSONL record is too large to process safely.');
      if (buf) onLine(buf);
    } finally {
      try { reader.releaseLock(); } catch (e) {}
    }
  }

  function safeCount(value) {
    var n = Number(value);
    return isFinite(n) && n > 0 ? Math.min(Math.floor(n), 1000000000000) : 0;
  }

  function addLine(line, fname, acc, seen) {
    if (line.indexOf('"usage"') < 0) return;
    var o;
    try { o = JSON.parse(line); } catch (e) { return; }
    var m = o && o.message;
    if (!m || !m.usage || typeof m.usage !== 'object' || m.model === '<synthetic>') return;
    var messageId = typeof m.id === 'string' ? m.id.slice(0, 160) : '';
    var requestId = typeof o.requestId === 'string' ? o.requestId.slice(0, 160) : '';
    var key = messageId + ':' + requestId;
    if (key !== ':') { if (seen[key]) return; seen[key] = true; }
    var sid = String(o.sessionId || fname.replace(/\.jsonl$/i, '')).slice(0, 160);
    var s = acc[sid];
    if (!s) {
      if (Object.keys(acc).length >= MAX_SESSIONS) return;
      s = acc[sid] = {
        id: sid, project: '', first: null, last: null,
        input: 0, output: 0, cacheW: 0, cacheR: 0, turns: 0, models: Object.create(null)
      };
    }
    var u = m.usage;
    s.input = Math.min(1000000000000, s.input + safeCount(u.input_tokens));
    s.output = Math.min(1000000000000, s.output + safeCount(u.output_tokens));
    s.cacheW = Math.min(1000000000000, s.cacheW + safeCount(u.cache_creation_input_tokens));
    s.cacheR = Math.min(1000000000000, s.cacheR + safeCount(u.cache_read_input_tokens));
    s.turns = Math.min(1000000000000, s.turns + 1);
    if (typeof m.model === 'string' && m.model && m.model.length <= 80 &&
        (Object.prototype.hasOwnProperty.call(s.models, m.model) || Object.keys(s.models).length < 20)) {
      s.models[m.model] = Math.min(1000000000000, (s.models[m.model] || 0) + 1);
    }
    var ts = typeof o.timestamp === 'string' && o.timestamp.length <= 40 ? o.timestamp : '';
    if (ts && !isNaN(Date.parse(ts))) {
      if (!s.first || ts < s.first) s.first = ts;
      if (!s.last || ts > s.last) s.last = ts;
    }
    if (typeof o.cwd === 'string' && !s.project) {
      var cwd = o.cwd.slice(0, 240);
      s.project = cwd.split('/').filter(Boolean).pop() || cwd;
    }
  }
  async function importFiles(fileList) {
    var files = Array.prototype.filter.call(fileList, function (f) { return /\.jsonl$/i.test(f.name); });
    if (!files.length) { say('No .jsonl files found in that selection.', true); return; }
    if (files.length > MAX_IMPORT_FILES) { say('Choose no more than ' + MAX_IMPORT_FILES + ' JSONL files at once.', true); return; }
    var totalBytes = files.reduce(function (sum, f) { return sum + f.size; }, 0);
    if (totalBytes > MAX_IMPORT_BYTES) { say('That selection is larger than 25 MB. Import smaller batches.', true); return; }
    var acc = Object.create(null), seen = Object.create(null), linesRead = 0;
    try {
      for (var i = 0; i < files.length; i++) {
        say('Reading file ' + (i + 1) + ' of ' + files.length + '\u2026');
        await readLines(files[i], function (l) {
          linesRead++;
          if (linesRead > MAX_IMPORT_LINES) throw new Error('The selection exceeds the 100,000-record import limit. Split it into smaller files.');
          addLine(l, files[i].name, acc, seen);
        });
      }
    } catch (e) { say('Could not read the selection: ' + e.message, true); return; }
    var n = Object.keys(acc).length;
    if (!n) { say('No token usage found in those files.', true); return; }
    var nextSaved = Object.create(null);
    Object.keys(saved).forEach(function (k) { nextSaved[k] = saved[k]; });
    Object.keys(acc).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(nextSaved, k) || Object.keys(nextSaved).length < MAX_SESSIONS) nextSaved[k] = acc[k];
    });
    chrome.storage.local.set({ ccSessions: nextSaved }, function () {
      if (chrome.runtime.lastError) { say('Could not save imported totals. Clear older sessions or import a smaller batch.', true); return; }
      saved = nextSaved;
      say('Loaded ' + n + (n === 1 ? ' session' : ' sessions') + ' from ' + files.length + (files.length === 1 ? ' file.' : ' files.'));
      render();
    });
  }

  function render() {
    var list = $('list');
    list.textContent = '';
    var all = Object.keys(saved).map(function (k) { return saved[k]; })
      .sort(function (a, b) { return (b.last || '').localeCompare(a.last || ''); });
    $('stats').hidden = $('clear').hidden = !all.length;
    var io = 0, cache = 0;
    all.forEach(function (s) {
      io += s.input + s.output; cache += s.cacheW + s.cacheR;
      var a = document.createElement('div');
      a.className = 'cs row-item';
      var left = document.createElement('div');
      var nm = document.createElement('div'); nm.className = 'nm';
      nm.textContent = (s.project || 'Session') + ' \u2022 ' + s.id.slice(0, 8);
      var meta = document.createElement('div'); meta.className = 'meta';
      var main = Object.keys(s.models).sort(function (x, y) { return s.models[y] - s.models[x]; })[0] || '';
      meta.textContent = (s.last ? new Date(s.last).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'unknown date') +
        (s.first && s.last ? ' \u2022 ' + dur(s.first, s.last) : '') + ' \u2022 ' + s.turns + ' replies' +
        (main ? ' \u2022 ' + main : '') +
        ' \u2022 in ' + fmt(s.input) + ' \u2022 out ' + fmt(s.output) + ' \u2022 cache ' + fmt(s.cacheR + s.cacheW);
      left.appendChild(nm); left.appendChild(meta);
      var pill = document.createElement('span');
      pill.className = 'pill up';
      pill.textContent = fmt(s.input + s.output) + ' tokens';
      a.appendChild(left); a.appendChild(pill);
      list.appendChild(a);
    });
    $('sN').textContent = all.length;
    $('sIO').textContent = fmt(io);
    $('sC').textContent = fmt(cache);
  }

  $('pickDir').addEventListener('change', function (e) { importFiles(e.target.files); e.target.value = ''; });
  $('pickFiles').addEventListener('change', function (e) { importFiles(e.target.files); e.target.value = ''; });
  $('clear').addEventListener('click', function () {
    chrome.storage.local.remove('ccSessions', function () {
      if (chrome.runtime.lastError) { say('Could not clear saved totals.', true); return; }
      saved = Object.create(null); say('Saved totals cleared.'); render();
    });
  });

  chrome.storage.local.get('ccSessions', function (d) {
    var raw = d.ccSessions && typeof d.ccSessions === 'object' && !Array.isArray(d.ccSessions) ? d.ccSessions : {};
    saved = Object.create(null);
    Object.keys(raw).slice(0, MAX_SESSIONS).forEach(function (key) {
      var s = raw[key];
      if (!s || typeof s !== 'object' || Array.isArray(s)) return;
      var id = String(s.id || key).slice(0, 160);
      var models = Object.create(null);
      if (s.models && typeof s.models === 'object' && !Array.isArray(s.models)) {
        Object.keys(s.models).slice(0, 20).forEach(function (name) { models[String(name).slice(0, 80)] = safeCount(s.models[name]); });
      }
      saved[id] = {
        id: id, project: typeof s.project === 'string' ? s.project.slice(0, 120) : '',
        first: typeof s.first === 'string' ? s.first.slice(0, 40) : null,
        last: typeof s.last === 'string' ? s.last.slice(0, 40) : null,
        input: safeCount(s.input), output: safeCount(s.output), cacheW: safeCount(s.cacheW),
        cacheR: safeCount(s.cacheR), turns: safeCount(s.turns), models: models
      };
    });
    render();
  });
})();
