(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var host = '', skip = [];
  function say(m) { $('pStatus').textContent = m || ''; }
  function sync() { chrome.runtime.sendMessage({ type: 'darkSync' }); }

  chrome.storage.local.get(['darkMode', 'darkSkip'], function (d) {
    $('gDark').checked = !(d.darkMode && d.darkMode.on === false);
    skip = Array.isArray(d.darkSkip) ? d.darkSkip : [];
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var u = tabs[0] && tabs[0].url || '';
      try { var x = new URL(u); if (/^https?:$/.test(x.protocol)) host = x.hostname; } catch (e) {}
      if (host) {
        $('siteTxt').textContent = 'Dark mode on ' + host;
        $('sDark').checked = skip.indexOf(host) < 0;
      } else {
        $('siteTxt').textContent = 'This site';
        $('siteSub').textContent = 'Open a website to change its setting';
        $('sDark').disabled = true;
      }
    });
  });

  $('gDark').addEventListener('change', function () {
    chrome.storage.local.set({ darkMode: { on: $('gDark').checked } }, sync);
  });
  $('sDark').addEventListener('change', function () {
    if (!host) return;
    var i = skip.indexOf(host);
    if ($('sDark').checked) { if (i >= 0) skip.splice(i, 1); }
    else if (i < 0) skip.push(host);
    chrome.storage.local.set({ darkSkip: skip }, sync);
  });

  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  $('pDupes').addEventListener('click', function () {
    closeDupes().then(function (n) { say(n ? 'Closed ' + plural(n, 'duplicate tab') + '.' : 'No duplicate tabs.'); });
  });
  $('pMem').addEventListener('click', function () {
    freeMemory().then(function (n) { say(n ? 'Suspended ' + plural(n, 'tab') + '.' : 'Nothing to suspend.'); });
  });
  $('pOpen').addEventListener('click', function () {
    chrome.tabs.create({ url: chrome.runtime.getURL('memory.html') });
    window.close();
  });

  /* ---------- Turnstile diagnostic ---------- */
  /* Cloudflare's docs say extensions that inject CSS or JS into challenge pages
     cause unpassable loops. The extension already excludes challenges.cloudflare.com
     from injection, so this checks the one thing left that we control: whether
     dark mode is still on for the site the user is stuck on. */
  var CHALLENGE = /(^|\.)challenges\.cloudflare\.com$/i;

  /* Cloudflare's supported-browsers page lists Chrome as "current version and
     two previous major versions", and treats a browser that has gone two years
     without security updates as limited support. ChromeOS 103 is end of life,
     so on this machine the browser itself is the usual reason a check never
     passes — and no extension can change that. */
  function chromeMajor() {
    var m = navigator.userAgent.match(/Chrome\/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function tsStatus() {
    var txt = $('tsText'), fix = $('tsFix');
    $('tsBox').hidden = false;
    fix.hidden = true;
    if (!host) {
      txt.textContent = 'Open the page that shows the check, then press this again.';
      return;
    }
    if (CHALLENGE.test(host)) {
      txt.textContent = "This is Cloudflare's own challenge page. The extension never injects anything here, so dark mode is not the cause.";
      return;
    }
    chrome.storage.local.get(['darkMode', 'darkSkip'], function (d) {
      var on = !(d.darkMode && d.darkMode.on === false);
      var sk = Array.isArray(d.darkSkip) ? d.darkSkip : [];
      var v = chromeMajor();
      var old = v && v < 120;
      if (!on || sk.indexOf(host) >= 0) {
        txt.textContent = 'Dark mode is already off for ' + host + ', so the extension is not interfering. ' +
          (old ? 'You are on Chrome ' + v + '. Cloudflare only officially supports the current Chrome and the two before it, and treats a browser without security updates for two years as limited support. ChromeOS 103 stopped getting updates, so the browser is the likely cause — and no extension can change that.'
               : 'If the check still fails, the cause is outside the extension: an ad blocker, a VPN, or the network.');
      } else {
        txt.textContent = 'Dark mode is on for ' + host + '. Injected CSS is the most likely cause of a check that never passes.';
        fix.hidden = false;
      }
    });
  }

  $('pTs').addEventListener('click', function () {
    if (!$('tsBox').hidden) { $('tsBox').hidden = true; return; }
    tsStatus();
  });

  $('tsFix').addEventListener('click', function () {
    if (!host) return;
    if (skip.indexOf(host) < 0) skip.push(host);
    chrome.storage.local.set({ darkSkip: skip }, function () {
      sync();
      $('sDark').checked = false;
      tsStatus();
    });
  });
})();
