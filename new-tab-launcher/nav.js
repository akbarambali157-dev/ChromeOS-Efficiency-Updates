(function () {
  /* Registry: id -> page. Each page declares itself with <body data-app="...">,
     so nothing here parses location.pathname.

     The nav is a left sidebar, not a top bar. nav.js adds .has-nav to <body> so
     the stylesheet can shift the page over without every page needing a wrapper
     element. Pages without a <nav class="nav"> (the popup, the Claude app) are
     left alone. */
  var I = {
    home: '<path d="M3 10.6 12 3.2l9 7.4"/><path d="M5.6 9.4V21h12.8V9.4"/><path d="M9.8 21v-6h4.4v6"/>',
    github: '<circle cx="6.5" cy="6" r="2.4"/><circle cx="6.5" cy="18" r="2.4"/><circle cx="17.5" cy="8" r="2.4"/><path d="M6.5 8.4v7.2"/><path d="M17.5 10.4c0 3.2-3.4 3.6-6.6 3.6H9"/>',
    drive: '<path d="M9.4 3.4h5.2l6.2 10.8-2.6 4.5H5.8l-2.6-4.5z"/><path d="M9.4 3.4 5.8 18.7"/><path d="M14.6 3.4 18.2 18.7"/>',
    brewkeg: '<path d="M5 7.5h10.5v8.2a3.3 3.3 0 0 1-3.3 3.3H8.3A3.3 3.3 0 0 1 5 15.7z"/><path d="M15.5 9.6h1.9a2.2 2.2 0 0 1 0 4.4h-1.9"/><path d="M8 4.4v1.6M11.4 4.4v1.6"/>',
    sessions: '<path d="M12 3.2 3.4 7.6 12 12l8.6-4.4z"/><path d="M3.4 12.4 12 16.8l8.6-4.4"/><path d="M3.4 16.8 12 21.2l8.6-4.4"/>',
    memory: '<rect x="7" y="7" width="10" height="10" rx="2.2"/><path d="M10 3.2v3.8M14 3.2v3.8M10 17v3.8M14 17v3.8M3.2 10h3.8M3.2 14h3.8M17 10h3.8M17 14h3.8"/>',
    files: '<path d="M3.2 7.4a2 2 0 0 1 2-2h3.6l2 2.2h8a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2z"/>',
    claude: '<path d="M12 3.4v17.2M3.4 12h17.2M6 6l12 12M18 6 6 18"/>'
  };

  var APPS = [
    { id: 'home',     href: 'newtab.html',     label: 'Home',     icon: I.home },
    { id: 'github',   href: 'github.html',     label: 'GitHub',   icon: I.github },
    { id: 'drive',    href: 'drive.html',      label: 'Drive',    icon: I.drive },
    { id: 'brewkeg',  href: 'brewkeg.html',    label: 'Brewkeg',  icon: I.brewkeg },
    { id: 'sessions', href: 'sessions.html',   label: 'Sessions', icon: I.sessions },
    { id: 'memory',   href: 'memory.html',     label: 'Memory',   icon: I.memory },
    { id: 'files',    href: 'files.html',      label: 'Files',    icon: I.files },
    { id: 'claude',   href: 'claude-app.html', label: 'Claude',   icon: I.claude }
  ];

  var nav = document.querySelector('nav.nav');
  if (!nav || nav.children.length) return;

  var here = document.body.getAttribute('data-app') || '';
  APPS.forEach(function (app) {
    var a = document.createElement('a');
    a.href = app.href;
    if (app.id === here) a.className = 'on';
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + app.icon + '</svg>' +
      '<span>' + app.label + '</span>';
    nav.appendChild(a);
  });

  document.body.classList.add('has-nav');
})();
