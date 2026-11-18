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

  var files = [], logs = [], activeFile = null, activeLog = null, projects = [], activeProjectId = 'default', projectData = {}, projectModalMode = 'edit';
  var ccKey = '', model = 'claude-sonnet-5-5', provider = 'brewkeg', openAIKey = '', anthropicKey = '', ghToken = '', pcKey = '';
  var webOn = false, chatH = 250;
  var saveTimer = null, busy = false;

  /* Context limits. The chat used to send only the open file, trimmed to 6000
     characters, and ten messages of history. That is why long answers looked
     cut off: the tail of the conversation fell out of the request. */
  var MAX_TOKENS = 4096;
  var MAX_PROJECT_DATA_BYTES = 4.3 * 1024 * 1024;
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
        saveFiles();
        renderFiles();
        if ($('contextStatus')) $('contextStatus').textContent = files.filter(function(x){return x.attached!==false;}).length+' files in context';
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
        saveFiles();
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
    $('dirty').hidden = !on;
  }

  function renderProjects() {
    var sel=$('projectSel'); if(!sel)return; sel.textContent='';
    projects.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.name;if(p.id===activeProjectId)o.selected=true;sel.appendChild(o);});
  }
  function snapshotProject() {
    projectData[activeProjectId]=projectData[activeProjectId]||{};
    var previous=projectData[activeProjectId];projectData[activeProjectId]=Object.assign({},previous||{}, {files:files.map(function(f){return {id:f.id,name:f.name,content:f.content,attached:f.attached!==false};}),logs:logs.slice(0,MAX_LOGS).map(function(l){return {id:l.id,title:l.title,when:l.when,messages:l.messages.slice(-40)};})});
    if(projectDataBytes()>MAX_PROJECT_DATA_BYTES){projectData[activeProjectId]=previous;say('chatStatus','Project storage limit reached. Current data was not saved.',true);return;}
    chrome.storage.local.set({ccProjectData:projectData,ccActiveProject:activeProjectId},function(){if(chrome.runtime.lastError)say('chatStatus','Could not save project data. Storage may be full.',true);});
  }
  function loadProject(id) {
    if(window.CCWorkspaces&&window.CCWorkspaces.flushProjectNotes)window.CCWorkspaces.flushProjectNotes();
    activeProjectId=id;var data=projectData[id]||{};
    files=Array.isArray(data.files)?data.files.filter(function(f){return f&&typeof f.id==='string'&&typeof f.name==='string'&&typeof f.content==='string';}).slice(0,MAX_FILES):[];
    logs=Array.isArray(data.logs)?data.logs.slice(0,MAX_LOGS):[];
    activeFile=files[0]||null;activeLog=logs[0]||null;
    renderProjects();renderFiles();loadEditor();renderLogs();renderChat();
    $('contextStatus').textContent=files.filter(function(f){return f.attached!==false;}).length+' files in context';
    chrome.storage.local.set({ccActiveProject:id});
    if(window.CCWorkspaces&&window.CCWorkspaces.refreshProject)window.CCWorkspaces.refreshProject();
  }
  function openProjectSettings(createMode) {
    projectModalMode=createMode?'create':'edit';
    var p=projects.filter(function(x){return x.id===activeProjectId;})[0]||{};
    $('projectDialogTitle').textContent=createMode?'Create project':'Project settings';
    $('projectName').value=createMode?'':p.name||'';
    $('projectInstructions').value=createMode?'':p.instructions||'';
    $('projectDelete').hidden=createMode||projects.length<=1;
    if($('dlgProject')&&!$('dlgProject').open)$('dlgProject').showModal();
    $('projectName').focus();
  }
  function saveProjectSettings() {
    var name=$('projectName').value.trim().slice(0,40), instructions=$('projectInstructions').value.slice(0,3000);
    if(!name){say('chatStatus','Project name is required.',true);$('projectName').focus();return;}
    if(projectModalMode==='create'){
      if(projects.length>=12){say('chatStatus','Project limit reached (12). Delete a project first.',true);return;}
      var id='p-'+uid();projects.push({id:id,name:name,instructions:instructions,tasks:[],notes:'',createdAt:Date.now(),updatedAt:Date.now()});projectData[id]={files:[],logs:[]};
      chrome.storage.local.set({ccProjects:projects,ccProjectData:projectData},function(){if(chrome.runtime.lastError){say('chatStatus','Could not save project. Storage may be full.',true);return;}$('dlgProject').close();loadProject(id);say('chatStatus','Project created.');});
    } else {
      var p=projects.filter(function(x){return x.id===activeProjectId;})[0];if(!p)return;
      p.name=name;p.instructions=instructions;p.updatedAt=Date.now();
      chrome.storage.local.set({ccProjects:projects},function(){if(chrome.runtime.lastError){say('chatStatus','Could not save project settings.',true);return;}$('dlgProject').close();renderProjects();say('chatStatus','Project settings saved.');});
    }
  }
  function deleteProject() {
    if(projects.length<=1){say('chatStatus','Keep at least one project.',true);return;}
    var p=projects.filter(function(x){return x.id===activeProjectId;})[0];if(!p)return;
    if(!confirm('Delete '+p.name+' and its local files and conversations?'))return;
    projects=projects.filter(function(x){return x.id!==p.id;});delete projectData[p.id];var next=projects[0].id;
    chrome.storage.local.set({ccProjects:projects,ccProjectData:projectData},function(){if(chrome.runtime.lastError){say('chatStatus','Could not delete project.',true);return;}$('dlgProject').close();loadProject(next);say('chatStatus','Project deleted.');});
  }
  function projectDataBytes() { return new TextEncoder().encode(JSON.stringify(projectData)).length; }
  function persistFiles(callback) {
    if (files.length > MAX_FILES) {
      if (callback) callback(false);
      return;
    }
    var out = files.map(function (f) {
      return { id: f.id, name: f.name, content: f.content, attached: f.attached !== false };
    });
    var previous=projectData[activeProjectId];projectData[activeProjectId]=Object.assign({},previous||{},{files:out});
    if(projectDataBytes()>MAX_PROJECT_DATA_BYTES){projectData[activeProjectId]=previous;say('chatStatus','Project storage limit reached (4.3 MiB across projects). Remove or shorten files before saving.',true);if(callback)callback(false);return;}
    chrome.storage.local.set({ ccProjectData: projectData }, function () {if(callback)callback(!chrome.runtime.lastError);});
  }

  function saveFiles() {
    persistFiles(function (ok) {
      setDirty(!ok);
      $('dirty').title = ok ? '' : 'Could not save editor files. Free storage space and try again.';
    });
  }

  function importLocalFiles(pickerId) {
    var picker=$(pickerId), selected=Array.prototype.slice.call(picker.files||[]).slice(0,8), total=0;
    if(!selected.length)return;
    var room=Math.max(0,MAX_FILES-files.length);selected=selected.slice(0,room);
    if(!room){say('chatStatus','File limit reached. Delete a file before importing.',true);picker.value='';return;}
    var allowed=/\.(txt|md|js|json|css|html|xml|ya?ml|py|sql|csv|ts|tsx|jsx)$/i;
    var tasks=selected.map(function(file){
      return new Promise(function(resolve){
        if(file.size>1048576||!allowed.test(file.name)){resolve(null);return;}
        if(total+file.size>4194304){resolve(null);return;}total+=file.size;
        var reader=new FileReader();reader.onload=function(){var text=String(reader.result||'');if(text.indexOf('\u0000')>=0){resolve(null);return;}resolve({id:uid(),name:String(file.webkitRelativePath||file.name).slice(0,60),content:text,attached:true});};reader.onerror=function(){resolve(null);};reader.readAsText(file);
      });
    });
    Promise.all(tasks).then(function(items){var imported=items.filter(Boolean);if(!imported.length){say('chatStatus','No supported files imported. Limits: 1 MiB each, 4 MiB total, text formats only.',true);picker.value='';return;}
      files=imported.concat(files).slice(0,MAX_FILES);activeFile=files[0];persistFiles(function(ok){if(ok){renderFiles();loadEditor();$('contextStatus').textContent=files.filter(function(f){return f.attached!==false;}).length+' files in context';say('chatStatus','Imported '+imported.length+' file(s). Review attachments before sending.');}else say('chatStatus','Could not save imported files.',true);});picker.value='';
    });
  }
  function newFile() {
    if (files.length >= MAX_FILES) {
      window.alert('The editor can keep up to ' + MAX_FILES + ' files. Delete one before creating another.');
      return;
    }
    var name = prompt('File name', 'untitled.js');
    if (!name) return;
    name = name.trim().slice(0, 60);
    if (!name) return;
    var f = { id: uid(), name: name, content: '' };
    files.unshift(f);
    activeFile = f;
    saveFiles();
    renderProjects();
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
      $('insertCode').disabled=true;
      return;
    }
    activeLog.messages.forEach(function (m) {
      box.appendChild(el('div', 'msg ' + (m.role === 'user' ? 'me' : 'ai'), m.content));
    });
    var latest=activeLog.messages.slice().reverse().filter(function(m){return m.role==='assistant';})[0];
    $('insertCode').disabled=!(latest&&extractCodeBlock(latest.content));
    box.scrollTop = box.scrollHeight;
  }
  function persistLogs() {
    var out = logs.slice(0, MAX_LOGS).map(function (l) {
      return { id: l.id, title: l.title, when: l.when, messages: l.messages.slice(-40) };
    });
    var previous=projectData[activeProjectId];projectData[activeProjectId]=Object.assign({},previous||{},{logs:out});
    if(projectDataBytes()>MAX_PROJECT_DATA_BYTES){projectData[activeProjectId]=previous;say('chatStatus','Conversation storage limit reached. Delete older conversations or shorten saved chats.',true);return;}
    chrome.storage.local.set({ ccProjectData: projectData },function(){if(chrome.runtime.lastError)say('chatStatus','Could not save conversations. Storage may be full.',true);});
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

  function extractCodeBlock(content) {
    var fence=String.fromCharCode(96,96,96),start=String(content||'').indexOf(fence);
    if(start<0)return '';
    var lineEnd=String(content).indexOf('\n',start+3);if(lineEnd<0)return '';
    var end=String(content).indexOf(fence,lineEnd+1);if(end<0)return '';
    return String(content).slice(lineEnd+1,end).replace(/\n$/,'');
  }
  function insertLatestCode() {
    if(!activeLog)return;
    if(!activeFile){activeFile={id:uid(),name:'untitled.js',content:''};files.unshift(activeFile);renderFiles();loadEditor();}
    var latest=activeLog.messages.slice().reverse().filter(function(m){return m.role==='assistant';})[0];
    if(!latest)return;
    var code=extractCodeBlock(latest.content);if(!code)return;
    var editor=$('editor'),start=editor.selectionStart,end=editor.selectionEnd;
    if(!confirm('Insert '+code.length+' characters of assistant code at the cursor or replace the selected text?'))return;
    var value=editor.value.slice(0,start)+code+editor.value.slice(end);
    editor.value=value;editor.selectionStart=editor.selectionEnd=start+code.length;editor.focus();
    activeFile.content=value;setDirty(true);saveFiles();pushMessage('assistant','Code block inserted into '+activeFile.name+'. Review it before pushing.');
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
    return CCProviders.request(provider, body.model || model, body.messages || [], body.max_tokens || MAX_TOKENS,
      { brewkeg: ccKey, openai: openAIKey, anthropic: anthropicKey });
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
            objective: 'Find current web sources that answer this question: ' + String(q).slice(0, 1400),
            search_queries: queriesFor(q),
            mode: 'basic',
            advanced_settings: { max_results: 6, excerpt_settings: { max_chars_per_result: 1000 } }
          }
        }, function (res) {
          if (chrome.runtime.lastError || !res) {
            reject(new Error('net:' + ((chrome.runtime.lastError && chrome.runtime.lastError.message) || 'no response')));
            return;
          }
          if (!res.status) { reject(new Error('net:' + (res.text || 'request failed'))); return; }
          if (res.status === 401 || res.status === 403) { reject(new Error('Parallel rejected that key.')); return; }
          if (res.status >= 300) { reject(new Error('Parallel returned ' + res.status + ': ' + String(res.text || '').slice(0, 240))); return; }
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
    if (!(provider === 'brewkeg' ? ccKey : provider === 'openai' ? openAIKey : anthropicKey)) {
      pushMessage('assistant', 'Add the selected provider key in Settings before sending.');
      return;
    }
    busy = true;
    $('sendBtn').disabled = true;
    cstat('');
    if(window.CCActivity)CCActivity.begin('Thinking',text.slice(0,90));
    pushMessage('user', text);

    var sys = 'You are a coding assistant inside a small editor on a Chromebook. ' +
      'Answer with short, concrete code and plain explanation. No emoji. When the user explicitly asks you to create or modify code, put the complete proposed code in a single fenced code block so the Apply code button can insert it into the editor. ' +
      'The user can copy your code into the editor and push it to GitHub themselves, so do not claim to have run or saved anything. ' +
      'The active editor file and attached scratch files are included when context is enabled. Do not claim to have accessed files that were not provided.';
    var projectInstructions=(projects.filter(function(p){return p.id===activeProjectId;})[0]||{}).instructions||'';
    if(projectInstructions)sys+='\n\nProject-specific instructions (follow these for this workspace):\n'+projectInstructions.slice(0,3000);
    var planMode=$('planMode')&&$('planMode').checked;
    if(planMode)sys+='\n\nPLAN MODE: Do not implement, write replacement code, or make changes yet. Produce a numbered, actionable implementation plan with scope, files likely affected, risks, and verification steps. Clearly state that you are waiting for approval. Do not expose private chain-of-thought; provide concise decision summaries only.';
    var msgs = [{ role: 'system', content: sys }];

    var projectInfo=projects.filter(function(p){return p.id===activeProjectId;})[0]||{};
    var projectMeta=[];if(projectInfo.notes)projectMeta.push('--- Project notes ---\n'+String(projectInfo.notes).slice(0,4000));if(Array.isArray(projectInfo.tasks)&&projectInfo.tasks.length)projectMeta.push('--- Project tasks ---\n'+projectInfo.tasks.slice(0,50).map(function(t){return (t.done?'[x] ':'[ ] ')+String(t.title||'').slice(0,200);}).join('\n'));if(projectMeta.length)msgs.push({role:'system',content:projectMeta.join('\n\n')});
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
        cstat('Searching the web…'); if(window.CCActivity)CCActivity.phase('Researching','Searching for sources related to your request');
        pre = parallelSearch(text).then(function (r) {
          var n = (r.results || []).length;
          cstat(n ? 'Web: ' + n + ' result' + (n === 1 ? '' : 's') : 'Web: nothing found');
          return searchContext(r);
        }).catch(function (e) {
          var m = (e && e.message) || 'Web search failed';
          if (m.indexOf('net:') === 0) m = 'Web search could not reach api.parallel.ai';
          cstat(m + ' — chat was not sent without research.', true);
          throw new Error('Web search failed: ' + m);
        });
      }
    }

    pre.then(function (ctx) {
      if (ctx) msgs.splice(1, 0, { role: 'system', content: ctx });
      if(window.CCActivity)CCActivity.phase('Reasoning through your request',text.slice(0,90)); return chatPost({ model: model, messages: msgs, max_tokens: MAX_TOKENS });
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
      if(window.CCActivity)CCActivity.phase('Preparing final response'); pushMessage('assistant', out);
    }).catch(function (e) {
      var m = e.message || 'Something went wrong.';
      if (m.indexOf('net:') === 0) m = 'Could not reach the model. Check your internet connection.';
      pushMessage('assistant', m);
    }).then(function () {
      if(window.CCActivity)CCActivity.end();
      busy = false;
      $('sendBtn').disabled = false;
    });
  }

  /* ---------- GitHub ---------- */
  function gh(path, method, body) {
    return window.GitHubApi.request(ghToken, path, {
      method: method || 'GET',
      body: body,
      notFoundAsMissing: true,
      forbiddenMessage: 'GitHub refused that. Check the token has repo scope.'
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

  function cleanRepoPath(value) {
    var path = String(value || '').trim();
    while (path.charAt(0) === '/') path = path.slice(1);
    return path;
  }

  function invalidPathSegment(part) {
    if (!part || part === '.' || part === '..' ||
        part.indexOf(String.fromCharCode(92)) >= 0 || part.indexOf('?') >= 0 || part.indexOf('#') >= 0) return true;
    for (var i = 0; i < part.length; i++) {
      var code = part.charCodeAt(i);
      if (code < 32 || code === 127) return true;
    }
    return false;
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
    var branch = $('pushBranch').value.trim() || 'main';
    var path = cleanRepoPath($('pushPath').value);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { say('pushStatus', 'Repository should look like owner/repo.', true); return; }
    var pathParts = path.split('/');
    if (!path || pathParts.some(invalidPathSegment)) {
      say('pushStatus', 'Give a valid file path inside the repo. Empty, dot, query and fragment segments are not allowed.', true); return;
    }
    var apiPath = pathParts.map(encodeURIComponent).join('/');
    if (!activeFile) { say('pushStatus', 'There is no file in the editor to push.', true); return; }
    if (!ghToken) { say('pushStatus', 'Connect your GitHub token on the GitHub tab first.', true); return; }

    var reviewedFile = activeFile;
    var reviewedContent = activeFile.content;
    var sequence = ++reviewSeq;
    pending = null;
    say('pushStatus', 'Checking what is already there…');
    $('pushGo').disabled = true;
    $('pushDiff').hidden = true;

    gh('/repos/' + repo + '/contents/' + apiPath).then(function (d) {
      if (sequence !== reviewSeq || activeFile !== reviewedFile || activeFile.content !== reviewedContent ||
          $('pushRepo').value.trim() !== repo || $('pushBranch').value.trim() !== branch || cleanRepoPath($('pushPath').value) !== path) {
        say('pushStatus', 'The file or destination changed during review. Review again before pushing.', true);
        return;
      }
      var oldText = '', sha = null;
      if (!d.missing) {
        sha = d.sha;
        oldText = unb64(d.content || '');
      }
      var diff = diffLines(oldText, activeFile.content);
      pending = { repo: repo, branch: branch, path: path, apiPath: apiPath, sha: sha, diff: diff, fileId: reviewedFile.id, content: reviewedContent };
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
        $('pushRepo').value.trim() !== pending.repo || $('pushBranch').value.trim() !== pending.branch || cleanRepoPath($('pushPath').value) !== pending.path) {
      invalidateReview();
      say('pushStatus', 'The file or destination changed after review. Review the current version before pushing.', true);
      return;
    }
    var msg = $('pushMsg').value.trim() || ('Update ' + pending.path);
    $('pushGo').disabled = true;
    say('pushStatus', 'Pushing…');
    var body = { message: msg, content: b64(pending.content), branch: pending.branch };
    if (pending.sha) body.sha = pending.sha;
    gh('/repos/' + pending.repo + '/contents/' + pending.apiPath, 'PUT', body).then(function (d) {
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
  $('openFiles').addEventListener('click', function () { $('filePicker').click(); });
  $('openFolder').addEventListener('click', function () { $('folderPicker').click(); });
  $('filePicker').addEventListener('change', function(){importLocalFiles('filePicker');});
  $('folderPicker').addEventListener('change', function(){importLocalFiles('folderPicker');});
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
    saveTimer = setTimeout(function () { saveTimer = null; saveFiles(); }, 600);
  });

  window.addEventListener('pagehide', function () {
    if (saveTimer !== null) { clearTimeout(saveTimer); saveTimer = null; saveFiles(); }
  });

  function renderContextManager() {
    if(!window.CCApp||!CCApp.getContextDetails)return;
    var d=CCApp.getContextDetails(),summary=$('contextSummary'),items=$('contextItems');summary.textContent='';items.textContent='';
    [[d.name,'Project'],[d.files.filter(function(f){return f.attached;}).length+' / '+d.files.length,'Files included'],[d.files.filter(function(f){return f.attached;}).reduce(function(n,f){return n+f.characters;},0).toLocaleString()+' chars','Attached file size']].forEach(function(x){var box=el('div','project-stat');box.appendChild(el('strong','',x[0]));box.appendChild(el('small','',x[1]));summary.appendChild(box);});
    function item(title,meta,check,change){var row=el('div','context-item'),main=el('div','context-item-main'),t=el('div','context-item-title',title),m=el('div','context-item-meta',meta);main.appendChild(t);main.appendChild(m);if(check!==null){var input=document.createElement('input');input.type='checkbox';input.checked=check;input.addEventListener('change',change);row.appendChild(input);}row.appendChild(main);items.appendChild(row);}
    item('Project instructions',d.instructions?d.instructions:'No project instructions set.',true,function(){});
    if(d.instructions){items.lastChild.querySelector('input').disabled=true;items.lastChild.querySelector('input').title='Project instructions are always included';}
    item('Project notes',d.notes?d.notes:'No project notes.',true,function(){});
    items.lastChild.querySelector('input').disabled=true;items.lastChild.querySelector('input').title='Project notes are included automatically';
    item('Task list',d.tasks.length?d.tasks.map(function(t){return (t.done?'✓ ':'○ ')+t.title;}).join('\\n'):'No tasks.',true,function(){});items.lastChild.querySelector('input').disabled=true;
    d.files.forEach(function(f){item((f.active?'● ':'')+f.name,(f.active?'Open in editor · ':'')+f.characters.toLocaleString()+' characters · '+(f.attached?'Included':'Excluded'),f.attached,function(){CCApp.setFileAttached(f.id,this.checked);renderContextManager();});});
    $('contextBudget').textContent='Shared file context cap: '+(d.files.reduce(function(n,f){return n+(f.attached?f.characters:0);},0)).toLocaleString()+' / 48,000 characters (project metadata has separate limits)';
  }
  $('contextManager').addEventListener('click',function(){renderContextManager();$('dlgContext').showModal();});
  $('contextClose').addEventListener('click',function(){$('dlgContext').close();});
  $('contextDone').addEventListener('click',function(){$('dlgContext').close();});
  $('insertCode').addEventListener('click', insertLatestCode);
  $('chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = $('chatIn').value.trim();
    if (!t) return;
    $('chatIn').value = '';
    send(t);
  });

  $('paneFiles').addEventListener('click', function () { CCWorkspaces.editorWorkspace(); });
  $('paneChat').addEventListener('click', function () { $('chatIn').focus(); });
  /* GitHub workspace navigation is wired by CCWorkspaces.init(). */
  $('paneSet').addEventListener('click', function () {
    $('ccKeyIn').value = ccKey;
    $('pcKeyIn').value = pcKey;
    $('openAIKeyIn').value = openAIKey;
    $('anthropicKeyIn').value = anthropicKey;
    $('ccProvider').value = provider;
    CCProviders.populate($('ccModel'), provider, model);
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

  $('ccProvider').addEventListener('change', function () { CCProviders.populate($('ccModel'), $('ccProvider').value); });
  $('setCancel').addEventListener('click', function () { $('dlgSet').close(); });
  $('setForm').addEventListener('submit', function (e) {
    e.preventDefault();
    ccKey = $('ccKeyIn').value.trim();
    pcKey = $('pcKeyIn').value.trim();
    openAIKey = $('openAIKeyIn').value.trim();
    anthropicKey = $('anthropicKeyIn').value.trim();
    provider = $('ccProvider').value;
    model = $('ccModel').value;
    chrome.storage.local.set({ ccKey: ccKey, pcKey: pcKey, ccOpenAIKey: openAIKey, ccAnthropicKey: anthropicKey, ccProvider: provider, ccModel: model }, function () {
      say('setStatus', 'Settings saved.');
      setTimeout(function () { $('dlgSet').close(); }, 500);
    });
  });

  $('pushCancel').addEventListener('click', function () { $('dlgPush').close(); });
  $('pushReview').addEventListener('click', review);
  $('pushGo').addEventListener('click', doPush);
  ['pushRepo', 'pushPath', 'pushBranch'].forEach(function (id) {
    $(id).addEventListener('input', function () { if (pending) invalidateReview(); });
  });

  /* ---------- boot ---------- */
  chrome.storage.local.get(['ccFiles', 'ccLogs', 'ccProjects', 'ccActiveProject', 'ccProjectData', 'ccKey', 'ccModel', 'ccProvider', 'ccOpenAIKey', 'ccAnthropicKey', 'ghToken', 'pcKey', 'ccWeb', 'ccChatH'], function (d) {
    projects = Array.isArray(d.ccProjects)&&d.ccProjects.length ? d.ccProjects.slice(0,12) : [{id:'default',name:'General',createdAt:Date.now()}];
    projectData = d.ccProjectData&&typeof d.ccProjectData==='object' ? d.ccProjectData : {};
    activeProjectId = projects.some(function(p){return p.id===d.ccActiveProject;}) ? d.ccActiveProject : projects[0].id;
    if(!projectData[activeProjectId]) projectData[activeProjectId]={files:Array.isArray(d.ccFiles)?d.ccFiles:[],logs:Array.isArray(d.ccLogs)?d.ccLogs:[]};
    var migrationWrite={ccProjects:projects,ccProjectData:projectData,ccActiveProject:activeProjectId};if(!Array.isArray(d.ccProjects)&&projectDataBytes()<=MAX_PROJECT_DATA_BYTES){migrationWrite.ccFiles=[];migrationWrite.ccLogs=[];}chrome.storage.local.set(migrationWrite,function(){if(chrome.runtime.lastError)say('chatStatus','Could not complete project migration. Storage may be full.',true);});
    files = Array.isArray(projectData[activeProjectId].files) ? projectData[activeProjectId].files.filter(function (f) {
      return f && typeof f.id === 'string' && typeof f.name === 'string' && typeof f.content === 'string';
    }).slice(0, MAX_FILES).map(function (f) {
      return { id: f.id, name: f.name.slice(0, 60), content: f.content, attached: f.attached !== false };
    }) : [];
    logs = Array.isArray(projectData[activeProjectId].logs) ? projectData[activeProjectId].logs : [];
    ccKey = d.ccKey || '';
    provider = d.ccProvider || 'brewkeg';
    model = d.ccModel || 'claude-sonnet-5-5';
    openAIKey = d.ccOpenAIKey || '';
    anthropicKey = d.ccAnthropicKey || '';
    ghToken = d.ghToken || '';
    pcKey = d.pcKey || '';
    webOn = !!d.ccWeb;
    chatH = parseInt(d.ccChatH, 10) || 250;
    applyChatH();
    if ($('webOn')) $('webOn').checked = webOn;
    CCProviders.populate($('ccModel'), provider, model);
    if (webOn && !pcKey) cstat('Web is on — add a Parallel key in Settings', true);

    activeFile = files[0] || null;
    activeLog = logs[0] || null;

    renderProjects();
    renderFiles();
    loadEditor();
    renderLogs();
    renderChat();
    CCWorkspaces.init();
    window.CCApp = {
      getContext: function () {
        var p=projects.filter(function(x){return x.id===activeProjectId;})[0]||{}, instruction=p.instructions?('--- Project instructions ---\n'+String(p.instructions).slice(0,3000)+'\n\n'):'', notes=p.notes?('--- Project notes ---\n'+String(p.notes).slice(0,4000)+'\n\n'):'', taskContext=Array.isArray(p.tasks)&&p.tasks.length?('--- Project task list ---\n'+p.tasks.slice(0,50).map(function(t){return (t.done?'[x] ':'[ ] ')+String(t.title||'').slice(0,200);}).join('\n')+'\n\n'):'';
        var a = files.filter(function (f) { return f.attached !== false && f.content; });
        return (instruction+notes+taskContext+a.map(function (f) { return '--- ' + f.name + (activeFile && f.id === activeFile.id ? ' (active editor)' : '') + ' ---\n' + f.content; }).join('\n\n')).slice(0, FILE_BUDGET);
      },
      getContextDetails: function () {
        var p=projects.filter(function(x){return x.id===activeProjectId;})[0]||{};
        return {name:p.name||'General',instructions:p.instructions||'',notes:p.notes||'',tasks:Array.isArray(p.tasks)?p.tasks.slice():[],files:files.map(function(f){return {id:f.id,name:f.name,attached:f.attached!==false,characters:(f.content||'').length,active:!!(activeFile&&activeFile.id===f.id)};})};
      },
      setFileAttached: function (id,on) {
        var f=files.filter(function(x){return x.id===id;})[0];if(!f)return false;f.attached=!!on;saveFiles();renderFiles();if($('contextStatus'))$('contextStatus').textContent=files.filter(function(x){return x.attached!==false;}).length+' files in context';return true;
      },
      getProjectInfo: function () {
        var p=projects.filter(function(x){return x.id===activeProjectId;})[0]||{};
        return {id:p.id,name:p.name,instructions:p.instructions||'',tasks:Array.isArray(p.tasks)?p.tasks.slice():[],notes:p.notes||'',fileCount:files.length,conversationCount:logs.length};
      },
      updateProjectMeta: function (updates,callback) {
        var p=projects.filter(function(x){return x.id===activeProjectId;})[0];if(!p)return false;
        if(updates&&Array.isArray(updates.tasks))p.tasks=updates.tasks.slice(0,50);
        if(updates&&typeof updates.notes==='string')p.notes=updates.notes.slice(0,4000);
        p.updatedAt=Date.now();
        chrome.storage.local.set({ccProjects:projects},function(){if(callback)callback(!chrome.runtime.lastError);});
        return true;
      },
      getSearchKey: function () { return pcKey; },
      importFile: function (name, content) {
        if (files.length >= MAX_FILES) return false;
        var f={id:uid(),name:String(name||'remote-file').slice(0,60),content:String(content||'').slice(0,1048576),attached:true};
        files.unshift(f);activeFile=f;persistFiles(function(ok){if(ok){renderFiles();loadEditor();$('contextStatus').textContent=files.filter(function(x){return x.attached!==false;}).length+' files in context';}});
        return true;
      }
    };
    $('contextStatus').textContent = files.filter(function (f) { return f.attached !== false; }).length + ' files in context';
    if($('projectSel'))$('projectSel').addEventListener('change',function(){snapshotProject();loadProject(this.value);});
    if($('newProject'))$('newProject').addEventListener('click',function(){openProjectSettings(true);});
    if($('projectManage'))$('projectManage').addEventListener('click',function(){openProjectSettings(false);});
    if($('projectSave'))$('projectSave').addEventListener('click',saveProjectSettings);
    if($('projectCancel'))$('projectCancel').addEventListener('click',function(){$('dlgProject').close();});
    if($('projectDelete'))$('projectDelete').addEventListener('click',deleteProject);

    if (!ccKey && !logs.length) {
      pushMessage('assistant', 'Welcome. Add your brewkeg key in Settings (the gear on the left) to start chatting. The editor and the GitHub push work without it.');
    }
  });
})();
