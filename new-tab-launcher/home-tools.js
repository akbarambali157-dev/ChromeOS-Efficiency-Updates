(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.textContent = ''; }, 3500);
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  $('tDupes').addEventListener('click', function () {
    closeDupes().then(function (n) {
      toast(n ? 'Closed ' + plural(n, 'duplicate tab') + '.' : 'No duplicate tabs found.');
    });
  });
  $('tMem').addEventListener('click', function () {
    freeMemory().then(function (n) {
      toast(n ? 'Suspended ' + plural(n, 'background tab') + '. They reload when you open them.'
              : 'Nothing to suspend right now.');
    });
  });

  function loadClosed() {
    chrome.sessions.getRecentlyClosed({ maxResults: 10 }).then(function (items) {
      var box = $('closed');
      box.textContent = '';
      var shown = 0;
      items.forEach(function (s) {
        if (!s.tab || shown >= 6) return;
        var url = s.tab.url || '';
        if (url.indexOf('chrome://newtab') === 0 || url.indexOf('chrome-extension://') === 0) return;
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = s.tab.title || url;
        var small = document.createElement('small');
        try { small.textContent = new URL(url).hostname; } catch (e) { small.textContent = url; }
        a.appendChild(small);
        a.addEventListener('click', function (e) {
          e.preventDefault();
          chrome.sessions.restore(s.tab.sessionId);
        });
        box.appendChild(a);
        shown++;
      });
      $('closedWrap').hidden = shown === 0;
    }).catch(function () {});
  }
  loadClosed();
})();
