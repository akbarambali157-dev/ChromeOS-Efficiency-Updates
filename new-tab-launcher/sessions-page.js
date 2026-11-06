(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var saved = {};

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

  // read a file line by line without loading it all into memory
  async function readLines(file, onLine) {
    var reader = file.stream().getReader();
    var dec = new TextDecoder();
    var buf = '';
    for (;;) {
      var r = await reader.read();
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true });
      var parts = buf.split('\n');
      buf = parts.pop();
      for (var i = 0; i < parts.length; i++) onLine(parts[i]);
    }
    buf += dec.decode();
    if (buf) onLine(buf);
  }

  function addLine(line, fname, acc, seen) {
    if (line.indexOf('"usage"') < 0) return;
    var o;
    try { o = JSON.parse(line); } catch (e) { return; }
    var m = o && o.message;
    if (!m || !m.usage || m.model === '<synthetic>') return;
    var key = (m.id || '') + ':' + (o.requestId || '');
    if (key !== ':') { if (seen[key]) return; seen[key] = 1; }
    var sid = o.sessionId || fname.replace(/\.jsonl$/, '');
    var s = acc[sid] || (acc[sid] = {
      id: sid, project: '', first: null, last: null,
      input: 0, output: 0, cacheW: 0, cacheR: 0, turns: 0, models: {}
    });
    var u = m.usage;
    s.input += u.input_tokens || 0;
    s.output += u.output_tokens || 0;
    s.cacheW += u.cache_creation_input_tokens || 0;
    s.cacheR += u.cache_read_input_tokens || 0;
    s.turns++;
    if (m.model) s.models[m.model] = (s.models[m.model] || 0) + 1;
    var ts = o.timestamp;
    if (ts) {
      if (!s.first || ts < s.first) s.first = ts;
      if (!s.last || ts > s.last) s.last = ts;
    }
    if (o.cwd && !s.project) s.project = String(o.cwd).split('/').filter(Boolean).pop() || o.cwd;
  }

  async function importFiles(fileList) {
    var files = Array.prototype.filter.call(fileList, function (f) { return /\.jsonl$/i.test(f.name); });
    if (!files.length) { say('No .jsonl files found in that selection.', true); return; }
    var acc = {}, seen = {};
    try {
      for (var i = 0; i < files.length; i++) {
        say('Reading file ' + (i + 1) + ' of ' + files.length + '\u2026');
        await readLines(files[i], function (l) { addLine(l, files[i].name, acc, seen); });
      }
    } catch (e) { say('Could not read a file: ' + e.message, true); return; }
    var n = Object.keys(acc).length;
    if (!n) { say('No token usage found in those files.', true); return; }
    Object.keys(acc).forEach(function (k) { saved[k] = acc[k]; });
    chrome.storage.local.set({ ccSessions: saved });
    say('Loaded ' + n + (n === 1 ? ' session' : ' sessions') + ' from ' + files.length + (files.length === 1 ? ' file.' : ' files.'));
    render();
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
    saved = {}; chrome.storage.local.remove('ccSessions'); say('Saved totals cleared.'); render();
  });

  chrome.storage.local.get('ccSessions', function (d) {
    saved = d.ccSessions || {};
    render();
  });
})();
