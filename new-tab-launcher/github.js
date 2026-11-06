(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var token = '';

  function api(path, method) {
    return fetch('https://api.github.com' + path, {
      method: method || 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
    }).then(function (r) {
      if (r.status === 401) throw new Error('GitHub rejected the token.');
      if (r.status === 403 || r.status === 404) throw new Error('GitHub refused that. Check the token has the codespace scope (and repo for pull requests, commits and builds).');
      if (!r.ok) throw new Error('GitHub returned an error (' + r.status + ').');
      return r.status === 204 ? {} : r.json();
    });
  }
  function say(id, msg, err) {
    var el = $(id);
    el.textContent = msg || '';
    el.className = 'status' + (err ? ' err' : '');
  }
  function fail(id, listId) {
    return function (e) {
      $(listId).textContent = '';
      say(id, e.message === 'Failed to fetch' ? 'Could not reach GitHub. Check your internet connection.' : e.message, true);
    };
  }
  function ago(iso) {
    if (!iso) return 'never';
    var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if (h < 48) return h + ' h ago';
    return Math.round(h / 24) + ' days ago';
  }

  // rows: {title, meta, href, pill, pillClass}
  function render(listId, statusId, rows, emptyMsg) {
    var list = $(listId);
    list.textContent = '';
    if (!rows.length) { say(statusId, emptyMsg); return; }
    say(statusId, '');
    rows.forEach(function (r) {
      var a = document.createElement('a');
      a.className = 'cs';
      a.href = r.href;
      var left = document.createElement('div');
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = r.title;
      var meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = r.meta;
      left.appendChild(nm); left.appendChild(meta);
      a.appendChild(left);
      if (r.pill) {
        var p = document.createElement('span');
        p.className = 'pill ' + (r.pillClass || '');
        p.textContent = r.pill;
        a.appendChild(p);
      }
      list.appendChild(a);
    });
  }

  var lastCs = [];
  function renderCs(items) {
    var list = $('csList');
    list.textContent = '';
    if (!items.length) { say('csStatus', 'No codespaces yet. Create one on github.com/codespaces.'); return; }
    say('csStatus', '');
    items.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'cs row-item';
      var left = document.createElement('a');
      left.className = 'csl';
      left.href = c.web_url;
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = c.display_name || c.name;
      var meta = document.createElement('div'); meta.className = 'meta';
      meta.textContent = (c.repository && c.repository.full_name || '') + ' \u2022 used ' + ago(c.last_used_at);
      left.appendChild(nm); left.appendChild(meta);

      var up = c.state === 'Available', down = c.state === 'Shutdown';
      var right = document.createElement('div'); right.className = 'rowbtns';
      var pill = document.createElement('span');
      pill.className = 'pill' + (up ? ' up' : '');
      pill.textContent = up ? 'Running' : (down ? 'Stopped' : c.state);
      right.appendChild(pill);
      var btn = document.createElement('button');
      btn.type = 'button';
      if (up || down) {
        btn.textContent = up ? 'Stop' : 'Start';
        if (down) btn.className = 'go';
        btn.addEventListener('click', function () { csAction(c.name, up ? 'stop' : 'start', btn); });
      } else {
        btn.textContent = '\u2026'; btn.disabled = true;
      }
      right.appendChild(btn);
      row.appendChild(left); row.appendChild(right);
      list.appendChild(row);
    });
  }

  /* One poll every 8 s for at most 60 s, stopping as soon as the codespace
     reaches the state we asked for. The old code fired five re-fetches in 35 s
     whether or not the first one had already shown the new state. */
  function csAction(name, verb, btn) {
    btn.disabled = true;
    btn.textContent = verb === 'start' ? 'Starting\u2026' : 'Stopping\u2026';
    var want = verb === 'start' ? 'Available' : 'Shutdown';
    api('/user/codespaces/' + encodeURIComponent(name) + '/' + verb, 'POST').then(function () {
      var started = Date.now();
      (function poll() {
        loadCodespaces(true).then(function () {
          var c = lastCs.filter(function (x) { return x.name === name; })[0];
          if (c && c.state === want) return;
          if (Date.now() - started > 60000) return;
          setTimeout(poll, 8000);
        });
      })();
    }).catch(function (e) {
      renderCs(lastCs);
      say('csStatus', e.message === 'Failed to fetch' ? 'Could not reach GitHub. Check your internet connection.' : e.message, true);
    });
  }

  function loadCodespaces(quiet) {
    if (!quiet) say('csStatus', 'Loading\u2026');
    return api('/user/codespaces?per_page=30').then(function (d) {
      lastCs = d.codespaces || [];
      renderCs(lastCs);
    }).catch(fail('csStatus', 'csList'));
  }

  function loadPRs(login) {
    say('prStatus', 'Loading\u2026');
    var q = encodeURIComponent('is:pr is:open involves:' + login);
    return api('/search/issues?sort=updated&per_page=8&q=' + q).then(function (d) {
      render('prList', 'prStatus', (d.items || []).map(function (i) {
        var repo = i.repository_url.split('/').slice(-2).join('/');
        return {
          title: i.title,
          meta: repo + ' \u2022 #' + i.number + ' \u2022 updated ' + ago(i.updated_at),
          href: i.html_url,
          pill: i.draft ? 'Draft' : 'Open'
        };
      }), 'No open pull requests.');
    }).catch(fail('prStatus', 'prList'));
  }

  function loadCommits(login) {
    say('cmStatus', 'Loading\u2026');
    return api('/users/' + encodeURIComponent(login) + '/events?per_page=30').then(function (ev) {
      var rows = [];
      ev.forEach(function (e) {
        if (e.type !== 'PushEvent' || !e.payload || !e.payload.commits) return;
        e.payload.commits.slice(-2).reverse().forEach(function (c) {
          if (rows.length >= 6) return;
          rows.push({
            title: (c.message || '').split('\n')[0],
            meta: e.repo.name + ' \u2022 ' + c.sha.slice(0, 7) + ' \u2022 ' + ago(e.created_at),
            href: 'https://github.com/' + e.repo.name + '/commit/' + c.sha
          });
        });
      });
      render('cmList', 'cmStatus', rows, 'No recent pushes.');
    }).catch(fail('cmStatus', 'cmList'));
  }

  function loadBuilds() {
    say('bdStatus', 'Loading\u2026');
    return api('/user/repos?sort=pushed&per_page=5').then(function (repos) {
      return Promise.all(repos.map(function (r) {
        return api('/repos/' + r.full_name + '/actions/runs?per_page=1').then(function (d) {
          var run = d.workflow_runs && d.workflow_runs[0];
          if (!run) return null;
          var ok = run.conclusion === 'success', bad = run.conclusion === 'failure';
          return {
            title: r.full_name,
            meta: (run.name || 'Workflow') + ' \u2022 ' + ago(run.updated_at),
            href: run.html_url,
            pill: bad ? 'Failed' : ok ? 'Passed' : (run.status === 'completed' ? run.conclusion : 'Running'),
            pillClass: bad ? 'bad' : ok ? 'up' : '',
            sort: bad ? 0 : 1
          };
        }).catch(function () { return null; });
      })).then(function (rows) {
        rows = rows.filter(Boolean).sort(function (a, b) { return a.sort - b.sort; });
        render('bdList', 'bdStatus', rows, 'No builds found in your latest repos.');
      });
    }).catch(fail('bdStatus', 'bdList'));
  }

  function loadAll() {
    loadCodespaces();
    api('/user').then(function (u) {
      loadPRs(u.login); loadCommits(u.login); loadBuilds();
    }).catch(function (e) {
      ['prStatus', 'cmStatus', 'bdStatus'].forEach(function (id) { say(id, e.message, true); });
    });
  }

  $('saveTok').addEventListener('click', function () {
    var t = $('tok').value.trim();
    if (!t) return;
    chrome.storage.local.set({ ghToken: t }, function () {
      token = t; $('tok').value = ''; $('connect').open = false; loadAll();
    });
  });
  $('rmTok').addEventListener('click', function () {
    chrome.storage.local.remove('ghToken', function () {
      token = '';
      ['csList', 'prList', 'cmList', 'bdList'].forEach(function (id) { $(id).textContent = ''; });
      ['prStatus', 'cmStatus', 'bdStatus'].forEach(function (id) { say(id, ''); });
      say('csStatus', 'Token removed.');
      $('connect').open = true;
    });
  });

  chrome.storage.local.get('ghToken', function (d) {
    if (d.ghToken) { token = d.ghToken; loadAll(); }
    else { say('csStatus', 'Not connected yet.'); $('connect').open = true; }
  });
})();
