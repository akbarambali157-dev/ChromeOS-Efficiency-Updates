/* The full Assistant page. All the thinking lives in assistant-core.js; this
   file only supplies the page's view and its settings form. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  var core = window.AssistantCore({
    maxLines: 14,
    addLine: function (who, text) {
      var log = $('log'), d = document.createElement('div');
      d.className = 'line ' + who; d.textContent = text;
      log.appendChild(d);
      while (log.children.length > 14) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    },
    addPanel: function (title, node) {
      var box = $('panels'), p = document.createElement('div');
      p.className = 'panel';
      var h = document.createElement('h4'); h.textContent = title;
      p.appendChild(h); p.appendChild(node);
      box.appendChild(p);
      while (box.children.length > 3) box.removeChild(box.firstChild);
    },
    setState: function (s) {
      $('orb').className = 'orb ' + s;
      $('stateTxt').textContent = { idle: 'Ready', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' }[s];
    },
    micOn: function (on) { $('mic').classList.toggle('on', on); },
    interim: function (t) { $('interim').textContent = t; }
  });

  /* ---------- input ---------- */
  $('askForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('askIn').value;
    $('askIn').value = '';
    core.handle(v);
  });
  $('mic').addEventListener('click', function () {
    try { speechSynthesis.cancel(); } catch (e) {}
    core.startListening();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) core.stopRec(); else core.resume();
  });

  var CHIPS = ['Performance report', 'Check my email', 'What files do I have', 'Weather', 'My codespaces', 'Close duplicate tabs'];
  CHIPS.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = c;
    b.addEventListener('click', function () { core.handle(c); });
    $('chips').appendChild(b);
  });

  /* ---------- settings ---------- */
  function applyName() {
    var cfg = core.getCfg();
    $('orbName').textContent = cfg.name.toUpperCase();
    $('askIn').placeholder = 'Ask ' + cfg.name + ' or give a command';
  }
  function startWake() { core.setWake(core.getCfg().wake); }

  $('cSave').addEventListener('click', function () {
    var nm = $('cName').value.trim().slice(0, 20) || 'Nova';
    var model = $('cModel').value.trim();
    if (model && !/^[\w.:\/-]+$/.test(model)) { $('cStatus').textContent = 'That model name has odd characters.'; $('cStatus').className = 'status err'; return; }
    var cfg = { name: nm, model: model || 'claude-haiku-4-5', speak: $('cSpeak').checked, wake: $('cWake').checked, contextEnabled: $('cContext').checked };
    core.setCfg(cfg);
    var k = $('cKey').value.trim() || core.getKey();
    core.setKey(k);
    $('cKey').value = '';
    chrome.storage.local.set({ assistant: cfg, aiKey: k }, function () {
      applyName();
      $('cStatus').className = 'status';
      $('cStatus').textContent = k ? 'Saved.' : 'Saved. Add your brewkeg key to enable general questions.';
      $('cKey').placeholder = k ? 'Key saved (hidden)' : 'bk_live_...';
      startWake();
    });
  });
  $('cClearKey').addEventListener('click', function () {
    core.setKey('');
    chrome.storage.local.remove('aiKey', function () {
      $('cKey').placeholder = 'bk_live_...';
      $('cStatus').className = 'status'; $('cStatus').textContent = 'Key removed.';
    });
  });
  /* Diagnostic: separates a bad key from a bad model from a blocked network,
     and prints the raw reason instead of a generic failure. */
  $('cTest').addEventListener('click', function () {
    var st = $('cStatus');
    var k = $('cKey').value.trim() || core.getKey();
    st.className = 'status';
    if (!k) { st.className = 'status err'; st.textContent = 'No key yet. Paste one above, then test.'; return; }
    st.textContent = 'Testing…';
    var model = core.getCfg().model;
    core.chatPost({ model: model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }, k)
      .then(function (r) {
        return r.text().then(function (t) {
          if (r.ok) {
            st.className = 'status';
            st.textContent = 'Connected. HTTP ' + r.status + ', model ' + model + ' replied.';
          } else {
            st.className = 'status err';
            st.textContent = 'HTTP ' + r.status + ': ' + String(t).slice(0, 180);
          }
        });
      })
      .catch(function (e) {
        st.className = 'status err';
        st.textContent = 'Network: ' + ((e && e.message) || e);
      });
  });

  core.init(function (cfg, key) {
    $('cName').value = cfg.name; $('cModel').value = cfg.model;
    $('cSpeak').checked = cfg.speak; $('cWake').checked = cfg.wake; $('cContext').checked = !!cfg.contextEnabled;
    $('cKey').placeholder = key ? 'Key saved (hidden)' : 'bk_live_...';
    applyName();
    core.addLine('ai', 'Hi, I’m ' + cfg.name + '. Tap the mic, or type a request.' + (key ? '' : ' Add your brewkeg key in Assistant settings for general questions.'));
    startWake();
  });
})();
