(function () {
  /* Registry: id -> page. Each page declares itself with <body data-app="...">,
     so nothing here parses location.pathname. */
  var APPS = [
    { id: 'home',     href: 'newtab.html',   label: 'Home' },
    { id: 'github',   href: 'github.html',   label: 'GitHub' },
    { id: 'drive',    href: 'drive.html',    label: 'Drive' },
    { id: 'brewkeg',  href: 'brewkeg.html',  label: 'Brewkeg' },
    { id: 'sessions', href: 'sessions.html', label: 'Sessions' },
    { id: 'memory',   href: 'memory.html',   label: 'Memory' },
    { id: 'files',    href: 'files.html',    label: 'Files' },
    { id: 'claude',   href: 'claude-app.html', label: 'Claude' }
  ];
  var nav = document.querySelector('nav.nav');
  if (!nav || nav.children.length) return;
  var here = document.body.getAttribute('data-app') || '';
  APPS.forEach(function (app) {
    var a = document.createElement('a');
    a.href = app.href;
    a.textContent = app.label;
    if (app.id === here) a.className = 'on';
    nav.appendChild(a);
  });
})();
