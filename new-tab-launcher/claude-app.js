/* Claude Code mini app.
   An editor, a chat and a GitHub push button. It is honest about what it is not:
   no VS Code extensions, no Claude Code plugins, no terminal. The banner in the
   markup says so and links to a real Codespace.

   Storage: ccFiles (scratch files), ccLogs (conversations, capped at 10),
   ccKey (separate brewkeg key, never exported), ccModel. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var MAX_LOGS = 10;
  var MAX_FILES = 40;

  var files = [], logs = [], activeFile = null, activeLog = null;
  var ccKey = '', model = 'claude-sonnet-5-5', ghToken = '', pcKey = '';
  var webOn = false, chatH = 250;
  var dirty = false, saveTimer = null, busy = false;

  /* Context limits. The chat used to send only the open file, trimmed to 6000
     characters, and ten messages of history. That is why long answers looked
     cut off: the tail of the conversation fell out of the request. */
  var MAX_TOKENS = 4096;
  var FILE_BUDGET = 24000;   /* characters of file text across all open files */
  var HISTORY = 24;          /* messages of conversation sent back */
  var HISTORY_CHARS = 12000; /* per-message cap when replaying history */

  /* ---------- small helpers ---------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  var el = window.LauncherUtils.el;
  function say(id, msg, err) {
    var s = $(id);
    if (!s) return;
    s.textContent = msg || '';
    s.className = 'status' + (err ? ' err' : '');
  }
  function b64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function unb64(b) {
    var bin = atob(String(b).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ---------- files ---------- */
  function renderFiles() {
    var list = $('fileList');
    list.textContent = '';
    if (!files.length) {
      list.appendChild(el('p', 'empty', 'No files yet. Press + to make one.'));
      return;
    }
    files.forEach(function (f) {
      var row = el('div', 'filerow' + (activeFile && f.id === activeFile.id ? ' on' : ''));
      /* attach toggle: a file that is not attached stays private to the app and
         never travels with a message */
      var att = el('button', 'fatt' + (f.attached !== false ? ' on' : ''), f.attached !== false ? '◉' : '○');
      att.type = 'button';
      att.title = (f.attached !== false ? 'Included in chat — click to detach' : 'Not sent to the model — click to include');
      att.setAttribute('aria-pressed', f.attached !== false ? 'true' : 'false');
      att.addEventListener('click', function (e) {
        e.stopPropagation();
        f.attached = f.attached === false;
        persistFiles();
        renderFiles();
      });
      row.appendChild(att);
      row.appendChild(el('span', 'fname', f.name));
      var del = el('button', 'fdel', '×');
      del.type = 'button';
      del.title = 'Delete ' + f.name;
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!confirm('Delete ' + f.name + '?')) return;
        files = files.filter(function (x) { return x.id !== f.id; });
        if (activeFile && activeFile.id === f.id) { activeFile = files[0] || null; loadEditor(); }
        persistFiles();
        renderFiles();
      });
      row.appendChild(del);
      row.addEventListener('click', function () {
        activeFile = f;
        loadEditor();
        renderFiles();
      });
      list.appendChild(row);
    });
  }

  function loadEditor() {
    $('editor').value = activeFile ? activeFile.content : '';
    $('tabName').textContent = activeFile ? activeFile.name : 'untitled';
    setDirty(false);
  }

  function setDirty(on) {
    dirty = on;
    $('dirty').hidden = !on;
  }

  function persistFiles() {
    var out = files.slice(0, MAX_FILES).map(function (f) {
      return { id: f.id, name: f.name, content: f.content, attached: f.attached !== false };
    });
    chrome.storage.local.set({ ccFiles: out });
  }

  function newFile() {
    var name = prompt('File name', 'untitled.js');
    if (!name) return;
    name = name.trim().slice(0, 60);
    if (!name) return;
    var f = { id: uid(), name: name, content: '' };
    files.unshift(f);
    activeFile = f;
    persistFiles();
    renderFiles();
    loadEditor();
    $('editor').focus();
  }

  /* ---------- conversations ---------- */
  function renderLogs() {
    var sel = $('logSel');
    sel.textContent = '';
    if (!logs.length) {
      var o = el('option', null, 'No conversations');
      o.value = '';
      sel.appendChild(o);
      return;
    }
    logs.forEach(function (l) {
      var o = el('option', null, l.title || 'Untitled');
      o.value = l.id;
      if (activeLog && l.id === activeLog.id) o.selected = true;
      sel.appendChild(o);
    });
  }

  function renderChat() {
    var box = $('chatLog');
    box.textContent = '';
    if (!activeLog || !activeLog.messages.length) {
      box.appendChild(el('div', 'msg sys', 'Ask about the file in the editor, or say what to change.'));
      return;
    }
    activeLog.messages.forEach(function (m) {
      box.appendChild(el('div', 'msg ' + (m.role === 'user' ? 'me' : 'ai'), m.content));
    });
    box.scrollTop = box.scrollHeight;
  }

  function persistLogs() {
    var out = logs.slice(0, MAX_LOGS).map(function (l) {
      return { id: l.id, title: l.title, when: l.when, messages: l.messages.slice(-40) };
    });
    chrome.storage.local.set({ ccLogs: out });
  }

  function newLog() {
    var l = { id: uid(), title: 'New conversation', when: Date.now(), messages: [] };
    logs.unshift(l);
    if (logs.length > MAX_LOGS) logs = logs.slice(0, MAX_LOGS);
    activeLog = l;
    persistLogs();
    renderLogs();
    renderChat();
    $('chatIn').focus();
  }

  function pushMessage(role, content) {
    if (!activeLog) newLog();
    activeLog.messages.push({ role: role, content: content });
    if (activeLog.title === 'New conversation' && role === 'user') {
      activeLog.title = content.slice(0, 40);
      renderLogs();
    }
    activeLog.when = Date.now();
    persistLogs();
    renderChat();
  }

  /* ---------- chat ---------- */
  function chatPost(body) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage({ type: 'chat', key: ccKey, body: body }, function (res) {
          if (chrome.runtime.lastError || !res) {
            reject(new Error('net:' + ((chrome.runtime.lastError && chrome.runtime.lastError.message) || 'no response from background')));
            return;
          }
          if (!res.status) { reject(new Error('net:' + (res.text || 'request failed'))); return; }
          resolve(res);
        });
      } catch (e) { reject(new Error('net:' + ((e && e.message) || 'messaging unavailable'))); }
    });
  }

  /* ---------- Parallel web search ---------- */
  function cstat(msg, err) {
    var s = $('chatStatus');
    if (!s) return;
    s.textContent = msg || '';
    s.className = 'chatstatus' + (err ? ' err' : '');
  }

  var STOP = {
    the: 1, and: 1, for: 1, with: 1, that: 1, this: 1, what: 1, when: 1, why: 1,
    how: 1, does: 1, can: 1, could: 1, you: 1, your: 1, are: 1, was: 1, were: 1,
    have: 1, has: 1, from: 1, into: 1, about: 1, tell: 1, want: 1, need: 1,
    please: 1, make: 1, give: 1, show: 1, some: 1, there: 1, then: 1, than: 1,
    is: 1, it: 1, my: 1, me: 1, we: 1, to: 1, of: 1, in: 1, on: 1, at: 1,
    a: 1, an: 1, i: 1, do: 1, not: 1, but: 1, or: 1, if: 1, so: 1
  };
  /* Two or three short keyword probes, which is what the search backend wants —
     not the whole conversational prompt. */
  function queriesFor(q) {
    var words = String(q).toLowerCase().replace(/[^a-z0-9\s.+#/_-]/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 2 && !STOP[w]; });
    var out = [];
    var head = words.slice(0, 6).join(' ');
    if (head) out.push(head.slice(0, 200));
    if (words.length > 6) out.push((words.slice(0, 3).join(' ') + ' ' + words[words.length - 1]).slice(0, 200));
    if (!out.length) out.push(String(q).slice(0, 200));
    return out.slice(0, 3);
  }

  function parallelSearch(q) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage({
          type: 'search', key: pcKey, body: {
            objective: String(q).slice(0, 1500),
            search_queries: queriesFor(q),
            mode: 'basic',
            max_chars_total: 6000,
            advanced_settings: { max_results: 6 }
          }
        }, function (res) {
          if (chrome.runtime.lastError || !res) {
            reject(new Error('net:' + ((chrome.runtime.lastError && chrome.runtime.lastError.message) || 'no response')));
            return;
          }
          if (!res.status) { reject(new Error('net:' + (res.text || 'request failed'))); return; }
          if (res.status === 401 || res.status === 403) { reject(new Error('Parallel rejected that key.')); return; }
          if (res.status >= 300) { reject(new Error('Parallel returned ' + res.status + '.')); return; }
          try { resolve(JSON.parse(res.text) || {}); } catch (e) { reject(new Error('Parallel sent something unreadable.')); }
        });
      } catch (e) { reject(new Error('net:' + ((e && e.message) || 'messaging unavailable'))); }
    });
  }

  /* Turn Parallel's results into a compact system block. Excerpts come back as
     plain strings (with objects tolerated in case the shape changes). */
  function searchContext(res) {
    var rs = (res && res.results) || [], lines = [];
    for (var i = 0; i < rs.length && i < 6; i++) {
      var r = rs[i] || {};
      var ex = Array.isArray(r.excerpts) ? r.excerpts : (typeof r.excerpts === 'string' ? [r.excerpts] : []);
      var text = ex.map(function (e) { return typeof e === 'string' ? e : ((e && e.text) || ''); })
        .join(' ').replace(/\s+/g, ' ').slice(0, 800);
      lines.push((i + 1) + '. ' + (r.title || r.url || 'result') + ' — ' + (r.url || '') +
        (r.publish_date ? ' (' + r.publish_date + ')' : '') + (text ? '\n' + text : ''));
    }
    if (!lines.length) return '';
    return 'Web results fetched just now (Parallel Search). These are real pages. Cite the URL when you ' +
      'rely on one, and say so plainly when they do not answer the question.\n\n' + lines.join('\n\n');
  }

  function send(text) {
    if (busy) return;
    if (!ccKey) {
      pushMessage('assistant', 'I need your brewkeg key first. Open Settings (the gear on the left) and paste it in.');
      return;
    }
    busy = true;
    $('sendBtn').disabled = true;
    cstat('');
    pushMessage('user', text);

    var sys = 'You are a coding assistant inside a small editor on a Chromebook. ' +
      'Answer with short, concrete code and plain explanation. No emoji. ' +
      'The user can copy your code into the editor and push it to GitHub themselves, so do not claim to have run or saved anything. ' +
      'You can see every file the user has attached in this app; only the open one is shown in the editor.';
    var msgs = [{ role: 'system', content: sys }];

    /* Every attached file travels with the message, open file first, under one
       shared character budget so a pile of files cannot blow past the request. */
    var attached = files.filter(function (f) { return f.attached !== false && f.content; });
    if (attached.length) {
      var parts = [], used = 0;
      attached.sort(function (a, b) {
        return (activeFile && a.id === activeFile.id ? 0 : 1) - (activeFile && b.id === activeFile.id ? 0 : 1);
      });
      attached.forEach(function (f) {
        var room = FILE_BUDGET - used;
        if (room <= 0) return;
        var body = f.content.length > room
          ? f.content.slice(0, room) + '\n… (cut at ' + room + ' characters)'
          : f.content;
        used += body.length;
        parts.push('--- ' + f.name + (activeFile && f.id === activeFile.id ? ' (open in the editor)' : '') + ' ---\n' + body);
      });
      if (parts.length) {
        msgs.push({
          role: 'system',
          content: 'Files in this app — ' + attached.length + ' attached, ' + used + ' characters:\n\n' + parts.join('\n\n')
        });
      }
    }

    activeLog.messages.slice(-HISTORY).forEach(function (m) {
      if (m.role !== 'user' && m.role !== 'assistant') return;
      msgs.push({ role: m.role, content: String(m.content || '').slice(0, HISTORY_CHARS) });
    });

    var pre = Promise.resolve('');
    if (webOn) {
      if (!pcKey) {
        cstat('Web is on, but no Parallel key is saved — replying without search.', true);
      } else {
        cstat('Searching the web…');
        pre = parallelSearch(text).then(function (r) {
          var n = (r.results || []).length;
          cstat(n ? 'Web: ' + n + ' result' + (n === 1 ? '' : 's') : 'Web: nothing found');
          return searchContext(r);
        }).catch(function (e) {
          var m = (e && e.message) || 'Web search failed';
          if (m.indexOf('net:') === 0) m = 'Web search could not reach api.parallel.ai';
          cstat(m, true);
          return '';
        });
      }
    }

    pre.then(function (ctx) {
      if (ctx) msgs.splice(1, 0, { role: 'system', content: ctx });
      return chatPost({ model: model, messages: msgs, max_tokens: MAX_TOKENS });
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) throw new Error('That key was rejected. Check it in Settings.');
      if (res.status === 402) throw new Error('That key is out of balance.');
      if (res.status === 429) throw new Error('Too many requests just now. Wait a moment and try again.');
      if (!res.status || res.status < 200 || res.status >= 300) {
        var msg = res.text || ('HTTP ' + res.status);
        try { var j = JSON.parse(res.text); msg = (j.error && (j.error.message || j.error)) || j.message || msg; } catch (e) {}
        throw new Error(String(msg).slice(0, 200));
      }
      var d = JSON.parse(res.text);
      var out = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
      if (!out) throw new Error('The model returned nothing.');
      return String(out).trim();
    }).then(function (out) {
      pushMessage('assistant', out);
    }).catch(function (e) {
      var m = e.message || 'Something went wrong.';
      if (m.indexOf('net:') === 0) m = 'Could not reach the model. Check your internet connection.';
      pushMessage('assistant', m);
    }).then(function () {
      busy = false;
      $('sendBtn').disabled = false;
    });
  }

  /* ---------- GitHub ---------- */
  function gh(path, method, body) {
    return fetch('https://api.github.com' + path, {
      method: method || 'GET',
      headers: {
        'Authorization': 'Bearer ' + ghToken,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 401) throw new Error('GitHub rejected the token.');
      if (r.status === 403) throw new Error('GitHub refused that. Check the token has repo scope.');
      if (r.status === 404) return { missing: true };
      if (!r.ok) throw new Error('GitHub returned an error (' + r.status + ').');
      return r.status === 204 ? {} : r.json();
    });
  }

  /* Naive line diff: trim the common head and tail, show what is left. */
  function diffLines(oldText, newText) {
    var a = oldText ? oldText.split('\n') : [];
    var b = newText ? newText.split('\n') : [];
    var head = 0;
    while (head < a.length && head < b.length && a[head] === b[head]) head++;
    var tail = 0;
    while (tail < a.length - head && tail < b.length - head &&
           a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
    var removed = a.slice(head, a.length - tail);
    var added = b.slice(head, b.length - tail);
    return { head: head, removed: removed, added: added, tail: tail, a: a, b: b };
  }

  function renderDiff(d) {
    var box = $('pushDiff');
    box.textContent = '';
    box.hidden = false;
    var ctx = function (t) { box.appendChild(el('div', 'ctx', '  ' + t)); };
    var add = function (t) { box.appendChild(el('div', 'add', '+ ' + t)); };
    var del = function (t) { box.appendChild(el('div', 'del', '- ' + t)); };

    var start = Math.max(0, d.head - 2);
    for (var i = start; i < d.head; i++) ctx(d.a[i]);
    d.removed.slice(0, 60).forEach(del);
    d.added.slice(0, 60).forEach(add);
    if (d.removed.length > 60 || d.added.length > 60) ctx('… diff truncated');
    var end = Math.min(d.a.length, d.a.length - d.tail + 2);
    for (var j = Math.max(d.a.length - d.tail, d.head); j < end; j++) ctx(d.a[j]);
  }

  var pending = null, reviewSeq = 0;

  function invalidateReview() {
    reviewSeq++;
    pending = null;
    $('pushGo').disabled = true;
    $('pushDiff').hidden = true;
  }

  function review() {
    var repo = $('pushRepo').value.trim();
    var path = $('pushPath').value.trim().replace(/^\/+/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { say('pushStatus', 'Repository should look like owner/repo.', true); return; }
    if (!path) { say('pushStatus', 'Give the file a path inside the repo.', true); return; }
    if (!activeFile) { say('pushStatus', 'There is no file in the editor to push.', true); return; }
    if (!ghToken) { say('pushStatus', 'Connect your GitHub token on the GitHub tab first.', true); return; }

    var reviewedFile = activeFile;
    var reviewedContent = activeFile.content;
    var sequence = ++reviewSeq;
    pending = null;
    say('pushStatus', 'Checking what is already there…');
    $('pushGo').disabled = true;
    $('pushDiff').hidden = true;

    gh('/repos/' + repo + '/contents/' + path).then(function (d) {
      if (sequence !== reviewSeq || activeFile !== reviewedFile || activeFile.content !== reviewedContent ||
          $('pushRepo').value.trim() !== repo || $('pushPath').value.trim().replace(/^\\/+/, '') !== path) {
        say('pushStatus', 'The file or destination changed during review. Review again before pushing.', true);
        return;
      }
      var oldText = '', sha = null;
      if (!d.missing) {
        sha = d.sha;
        oldText = unb64(d.content || '');
      }
      var diff = diffLines(oldText, activeFile.content);
      pending = { repo: repo, path: path, sha: sha, diff: diff, fileId: reviewedFile.id, content: reviewedContent };
      renderDiff(diff);
      if (!diff.removed.length && !diff.added.length) {
        say('pushStatus', 'That file already matches the editor. Nothing to push.');
        $('pushGo').disabled = true;
        return;
      }
      say('pushStatus', (sha ? 'Updating ' : 'Creating ') + path + ' — ' +
        diff.added.length + ' line' + (diff.added.length === 1 ? '' : 's') + ' added, ' +
        diff.removed.length + ' removed.');
      $('pushGo').disabled = false;
    }).catch(function (e) {
      say('pushStatus', e.message === 'Failed to fetch' ? 'Could not reach GitHub. Check your internet connection.' : e.message, true);
    });
  }

  function doPush() {
    if (!pending) return;
    if (!activeFile || activeFile.id !== pending.fileId || activeFile.content !== pending.content ||
        $('pushRepo').value.trim() !== pending.repo || $('pushPath').value.trim().replace(/^\\/+/, '') !== pending.path) {
      invalidateReview();
      say('pushStatus', 'The file or destination changed after review. Review the current version before pushing.', true);
      return;
    }
    var msg = $('pushMsg').value.trim() || ('Update ' + pending.path);
    $('pushGo').disabled = true;
    say('pushStatus', 'Pushing…');
    var body = { message: msg, content: b64(pending.content) };
    if (pending.sha) body.sha = pending.sha;
    gh('/repos/' + pending.repo + '/contents/' + pending.path, 'PUT', body).then(function (d) {
      if (d && d.content && d.content.html_url) {
        say('pushStatus', 'Pushed. ' + d.content.html_url);
      } else {
        say('pushStatus', 'Pushed.');
      }
      pending = null;
      $('pushDiff').hidden = true;
    }).catch(function (e) {
      say('pushStatus', e.message === 'Failed to fetch' ? 'Could not reach GitHub. Check your internet connection.' : e.message, true);
      $('pushGo').disabled = false;
    });
  }

  /* ---------- wiring ---------- */
  $('newFile').addEventListener('click', newFile);
  $('newLog').addEventListener('click', newLog);
  $('delLog').addEventListener('click', function () {
    if (!activeLog) return;
    if (!confirm('Delete this conversation?')) return;
    logs = logs.filter(function (l) { return l.id !== activeLog.id; });
    activeLog = logs[0] || null;
    persistLogs();
    renderLogs();
    renderChat();
  });
  $('logSel').addEventListener('change', function () {
    var id = $('logSel').value;
    activeLog = logs.filter(function (l) { return l.id === id; })[0] || null;
    renderChat();
  });

  $('editor').addEventListener('input', function () {
    if (pending) invalidateReview();
    if (!activeFile) {
      activeFile = { id: uid(), name: 'untitled.js', content: '' };
      files.unshift(activeFile);
      renderFiles();
    }
    activeFile.content = $('editor').value;
    $('tabName').textContent = activeFile.name;
    setDirty(true);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { persistFiles(); setDirty(false); }, 600);
  });

  $('chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = $('chatIn').value.trim();
    if (!t) return;
    $('chatIn').value = '';
    send(t);
  });

  $('paneFiles').addEventListener('click', function () { $('newFile').focus(); });
  $('paneChat').addEventListener('click', function () { $('chatIn').focus(); });
  $('paneGit').addEventListener('click', function () { $('dlgPush').showModal(); });
  $('paneSet').addEventListener('click', function () {
    $('ccKeyIn').value = ccKey;
    $('pcKeyIn').value = pcKey;
    $('ccModel').value = model;
    say('setStatus', '');
    $('dlgSet').showModal();
  });

  /* ---------- chat size ---------- */
  /* The chat row is whatever height the user drags it to (remembered), and ⤢
     hands it the whole column when a reply needs room. */
  function applyChatH() {
    document.documentElement.style.setProperty('--chat-h', chatH + 'px');
  }
  var grip = $('chatGrip');
  if (grip) {
    var drag = null;
    grip.addEventListener('pointerdown', function (e) {
      if (document.body.classList.contains('chatmax')) return;
      drag = { y: e.clientY, h: $('chatPanel').getBoundingClientRect().height };
      try { grip.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    grip.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var max = Math.max(180, window.innerHeight - 170);
      chatH = Math.max(120, Math.min(max, drag.h + (drag.y - e.clientY)));
      applyChatH();
    });
    function endDrag() {
      if (!drag) return;
      drag = null;
      chrome.storage.local.set({ ccChatH: chatH });
    }
    grip.addEventListener('pointerup', endDrag);
    grip.addEventListener('pointercancel', endDrag);
    /* keyboard: arrow keys nudge, Home/End jump */
    grip.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        chatH = Math.max(120, chatH + (e.key === 'ArrowUp' ? 40 : -40));
        applyChatH();
        chrome.storage.local.set({ ccChatH: chatH });
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        toggleChatMax();
        e.preventDefault();
      }
    });
    grip.addEventListener('dblclick', toggleChatMax);
  }
  function toggleChatMax() {
    var on = document.body.classList.toggle('chatmax');
    var b = $('chatGrow');
    if (b) { b.textContent = on ? '⤡' : '⤢'; b.title = on ? 'Restore the editor' : 'Expand chat'; }
  }
  if ($('chatGrow')) $('chatGrow').addEventListener('click', toggleChatMax);

  /* ---------- web search toggle ---------- */
  if ($('webOn')) {
    $('webOn').addEventListener('change', function () {
      webOn = $('webOn').checked;
      chrome.storage.local.set({ ccWeb: webOn });
      cstat(webOn ? (pcKey ? 'Web search on' : 'Add a Parallel key in Settings') : '');
    });
  }

  $('setCancel').addEventListener('click', function () { $('dlgSet').close(); });
  $('setForm').addEventListener('submit', function (e) {
    e.preventDefault();
    ccKey = $('ccKeyIn').value.trim();
    pcKey = $('pcKeyIn').value.trim();
    model = $('ccModel').value;
    chrome.storage.local.set({ ccKey: ccKey, pcKey: pcKey, ccModel: model }, function () {
      say('setStatus', ccKey ? 'Saved.' : 'Key cleared.');
      setTimeout(function () { $('dlgSet').close(); }, 500);
    });
  });

  $('pushCancel').addEventListener('click', function () { $('dlgPush').close(); });
  $('pushReview').addEventListener('click', review);
  $('pushGo').addEventListener('click', doPush);
  ['pushRepo', 'pushPath'].forEach(function (id) {
    $(id).addEventListener('input', function () { if (pending) invalidateReview(); });
  });

  /* ---------- boot ---------- */
  chrome.storage.local.get(['ccFiles', 'ccLogs', 'ccKey', 'ccModel', 'ghToken', 'pcKey', 'ccWeb', 'ccChatH'], function (d) {
    files = Array.isArray(d.ccFiles) ? d.ccFiles : [];
    logs = Array.isArray(d.ccLogs) ? d.ccLogs : [];
    ccKey = d.ccKey || '';
    model = d.ccModel || 'claude-sonnet-5-5';
    ghToken = d.ghToken || '';
    pcKey = d.pcKey || '';
    webOn = !!d.ccWeb;
    chatH = parseInt(d.ccChatH, 10) || 250;
    applyChatH();
    if ($('webOn')) $('webOn').checked = webOn;
    if (webOn && !pcKey) cstat('Web is on — add a Parallel key in Settings', true);

    activeFile = files[0] || null;
    activeLog = logs[0] || null;

    renderFiles();
    loadEditor();
    renderLogs();
    renderChat();

    if (!ccKey && !logs.length) {
      pushMessage('assistant', 'Welcome. Add your brewkeg key in Settings (the gear on the left) to start chatting. The editor and the GitHub push work without it.');
    }
  });
})();
