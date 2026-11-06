/* The floating assistant on the home page. Shares assistant-core.js with the
   full Assistant page, so the intents, speech and brewkeg call are not
   duplicated. The mini log keeps 6 lines; the full page keeps 14. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var fab = $('orbFab'), panel = $('orbPanel'), log = $('orbLog');

  var core = window.AssistantCore({
    maxLines: 6,
    addLine: function (who, text) {
      var d = document.createElement('div');
      d.className = 'line ' + who; d.textContent = text;
      log.appendChild(d);
      while (log.children.length > 6) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    },
    /* The mini panel has no room for the memory/weather cards, so they are
       dropped here and the spoken reply carries the information. */
    addPanel: function () {},
    setState: function (s) {
      fab.className = 'orb-fab ' + s;
      $('orbState').textContent = { idle: 'Ready', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' }[s];
    }
  });

  function open() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    $('orbIn').focus();
  }
  function close() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    core.stopRec();
  }

  fab.addEventListener('click', function () { if (panel.hidden) open(); else close(); });
  $('orbClose').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
  $('orbForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('orbIn').value;
    $('orbIn').value = '';
    core.handle(v);
  });

  core.init(function (cfg, key) {
    $('orbName').textContent = cfg.name.toUpperCase();
    $('orbIn').placeholder = 'Ask ' + cfg.name + ' or give a command';
    core.addLine('ai', 'Hi, I’m ' + cfg.name + '.' + (key ? '' : ' Add your brewkeg key on the Assistant page for general questions.'));
  });
})();
