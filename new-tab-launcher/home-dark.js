(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var skip = [];
  function say(m, err) { var s = $('dmStatus'); s.textContent = m || ''; s.className = 'status' + (err ? ' err' : ''); }
  function sync() { chrome.runtime.sendMessage({ type: 'darkSync' }, function () { void chrome.runtime.lastError; }); }
  function persist() { chrome.storage.local.set({ darkSkip: skip }, sync); }

  function render() {
    var box = $('dmChips');
    box.textContent = '';
    skip.forEach(function (h, i) {
      var c = document.createElement('span'); c.className = 'chip';
      c.appendChild(document.createTextNode(h));
      var x = document.createElement('button');
      x.type = 'button'; x.title = 'Dark mode on this site again'; x.textContent = '\u00D7';
      x.addEventListener('click', function () { skip.splice(i, 1); persist(); render(); });
      c.appendChild(x); box.appendChild(c);
    });
  }

  chrome.storage.local.get(['darkMode', 'darkSkip'], function (d) {
    $('dmOn').checked = !(d.darkMode && d.darkMode.on === false);
    skip = Array.isArray(d.darkSkip) ? d.darkSkip : [];
    render();
  });
  $('dmOn').addEventListener('change', function () {
    chrome.storage.local.set({ darkMode: { on: $('dmOn').checked } }, sync);
  });
  $('dmAdd').addEventListener('click', function () {
    var v = $('dmHost').value.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(v)) { say('Type a site like example.com', true); return; }
    if (skip.indexOf(v) < 0) { skip.push(v); persist(); render(); }
    $('dmHost').value = '';
    say(v + ' will be left as it is.');
  });
})();
