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
  var ccKey = '', model = 'claude-sonnet-5-5', ghToken = '';
  var dirty = false, saveTimer = null, busy = false;

  /* ---------- small helpers ---------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
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
      return { id: f.id, name: f.name, content: f.content };
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

  function send(text) {
    if (busy) return;
    if (!ccKey) {
      pushMessage('assistant', 'I need your brewkeg key first. Open Settings (the gear on the left) and paste it in.');
      return;
    }
    busy = true;
    $('sendBtn').disabled = true;
    pushMessage('user', text);

    var sys = 'You are a coding assistant inside a small editor on a Chromebook. ' +
      'Answer with short, concrete code and plain explanation. No emoji. ' +
      'The user can copy your code into the editor and push it to GitHub themselves, so do not claim to have run or saved anything.';
    var msgs = [{ role: 'system', content: sys }];
    if (activeFile && activeFile.content) {
      msgs.push({ role: 'system', content: 'The file open in the editor is ' + activeFile.name + ':\n\n' + activeFile.content.slice(0, 6000) });
    }
    activeLog.messages.slice(-10).forEach(function (m) { msgs.push({ role: m.role, content: m.content }); });

    chatPost({ model: model, messages: msgs, max_tokens: 1500 }).then(function (res) {
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

  var pending = null;

  function review() {
    var repo = $('pushRepo').value.trim();
    var path = $('pushPath').value.trim().replace(/^\/+/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { say('pushStatus', 'Repository should look like owner/repo.', true); return; }
    if (!path) { say('pushStatus', 'Give the file a path inside the repo.', true); return; }
    if (!activeFile) { say('pushStatus', 'There is no file in the editor to push.', true); return; }
    if (!ghToken) { say('pushStatus', 'Connect your GitHub token on the GitHub tab first.', true); return; }

    say('pushStatus', 'Checking what is already there…');
    $('pushGo').disabled = true;
    $('pushDiff').hidden = true;

    gh('/repos/' + repo + '/contents/' + path).then(function (d) {
      var oldText = '', sha = null;
      if (!d.missing) {
        sha = d.sha;
        oldText = unb64(d.content || '');
      }
      var diff = diffLines(oldText, activeFile.content);
      pending = { repo: repo, path: path, sha: sha, diff: diff };
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
    var msg = $('pushMsg').value.trim() || ('Update ' + pending.path);
    $('pushGo').disabled = true;
    say('pushStatus', 'Pushing…');
    var body = { message: msg, content: b64(activeFile.content) };
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
    $('ccModel').value = model;
    say('setStatus', '');
    $('dlgSet').showModal();
  });

  $('setCancel').addEventListener('click', function () { $('dlgSet').close(); });
  $('setForm').addEventListener('submit', function (e) {
    e.preventDefault();
    ccKey = $('ccKeyIn').value.trim();
    model = $('ccModel').value;
    chrome.storage.local.set({ ccKey: ccKey, ccModel: model }, function () {
      say('setStatus', ccKey ? 'Saved.' : 'Key cleared.');
      setTimeout(function () { $('dlgSet').close(); }, 500);
    });
  });

  $('pushCancel').addEventListener('click', function () { $('dlgPush').close(); });
  $('pushReview').addEventListener('click', review);
  $('pushGo').addEventListener('click', doPush);

  /* ---------- boot ---------- */
  chrome.storage.local.get(['ccFiles', 'ccLogs', 'ccKey', 'ccModel', 'ghToken'], function (d) {
    files = Array.isArray(d.ccFiles) ? d.ccFiles : [];
    logs = Array.isArray(d.ccLogs) ? d.ccLogs : [];
    ccKey = d.ccKey || '';
    model = d.ccModel || 'claude-sonnet-5-5';
    ghToken = d.ghToken || '';

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
