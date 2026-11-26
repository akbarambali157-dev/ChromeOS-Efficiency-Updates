(function(){
'use strict';
var I={
apps:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
home:'<path d="M3 10.6 12 3.2l9 7.4"/><path d="M5.6 9.4V21h12.8V9.4"/><path d="M9.8 21v-6h4.4v6"/>',
github:'<circle cx="6.5" cy="6" r="2.4"/><circle cx="6.5" cy="18" r="2.4"/><circle cx="17.5" cy="8" r="2.4"/><path d="M6.5 8.4v7.2"/><path d="M17.5 10.4c0 3.2-3.4 3.6-6.6 3.6H9"/>',
drive:'<path d="M9.4 3.4h5.2l6.2 10.8-2.6 4.5H5.8l-2.6-4.5z"/><path d="M9.4 3.4 5.8 18.7"/><path d="M14.6 3.4 18.2 18.7"/>',
brewkeg:'<path d="M5 7.5h10.5v8.2a3.3 3.3 0 0 1-3.3 3.3H8.3A3.3 3.3 0 0 a 5 15.7z"/><path d="M15.5 9.6h1.9a2.2 2.2 0 0 1 0 4.4h-1.9"/>',
sessions:'<path d="M12 3.2 3.4 7.6 12 12l8.6-4.4z"/><path d="M3.4 12.4 12 16.8l8.6-4.4"/><path d="M3.4 16.8 12 21.2l8.6-4.4"/>',
memory:'<rect x="7" y="7" width="10" height="10" rx="2.2"/><path d="M10 3.2v3.8M14 3.2v3.8M10 17v3.8M14 17v3.8M3.2 10h3.8M3.2 14h3.8M17 10h3.8M17 14h3.8"/>',
files:'<path d="M3.2 7.4a2 2 0 0 1 2-2h3.6l2 2.2h8a2 2 0 0 a 2 2v8.6a2 2 0 0 1-2 2H5.2a2 2 0  a 2-2z"/>',
claude:'<path d="M12 3.4v17.2M3.4 12h17.2M6 6l12 12M18 6 6 18"/>',
diagnostics:'<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 12h5M8 15h8"/>'
};
var APPS=[
{id:'home',href:'newtab.html',label:'Home',icon:I.home},{id:'apps',href:'apps.html',label:'Mini-apps',icon:I.apps},
{id:'github',href:'github.html',label:'GitHub',icon:I.github},{id:'drive',href:'drive.html',label:'Drive',icon:I.drive},
{id:'brewkeg',href:'brewkeg.html',label:'Brewkeg',icon:I.brewkeg},{id:'sessions',href:'sessions.html',label:'Sessions',icon:I.sessions},
{id:'memory',href:'memory.html',label:'Memory',icon:I.memory},{id:'files',href:'files.html',label:'Files',icon:I.files},
{id:'claude',href:'claude-app.html',label:'Claude',icon:I.claude},{id:'diagnostics',href:'diagnostics.html',label:'Diagnostics',icon:I.diagnostics}
];
var nav=document.querySelector('nav.nav');if(!nav||nav.children.length)return;
var here=document.body.getAttribute('data-app')||'',reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,mobile=window.matchMedia&&window.matchMedia('(max-width: 820px)').matches,storage=window.chrome&&chrome.storage&&chrome.storage.local,collapsed=mobile;
function setCollapsed(v,save){collapsed=!!v;document.body.classList.toggle('sidebar-collapsed',collapsed);document.body.classList.toggle('sidebar-expanded',!collapsed);toggle.setAttribute('aria-expanded',String(!collapsed));toggle.title=collapsed?'Expand navigation':'Collapse navigation';toggle.setAttribute('aria-label',toggle.title);if(save&&storage)storage.set({launcherSidebarCollapsed:collapsed);}
}
var brand=document.createElement('div');brand.className='nav-brand';var brandText=document.createElement('span');brandText.className='nav-brand-text';brandText.textContent='My Launcher';
var toggle=document.createElement('button');toggle.type='button';toggle.className='nav-toggle';toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Collapse navigation');toggle.title='Collapse navigation';brand.appendChild(brandText);brand.appendChild(toggle);nav.appendChild(brand);
var core=document.createElement('div');core.className='nav-primary';
APPS.forEach(function(app){var a=document.createElement('a');a.href=app.href;a.title=app.label;a.setAttribute('aria-label',app.label);if(app.id===here)a.className='on';a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+app.icon+'</svg><span>'+app.label+'</span>';core.appendChild(a);});nav.appendChild(core);
var installedWrap=document.createElement('section');installedWrap.className='nav-installed';installedWrap.setAttribute('aria-label','Installed mini-apps');var installedTitle=document.createElement('div');installedTitle.className='nav-section-title';installedTitle.textContent='INSTALLED MINI-APPS';installedWrap.appendChild(installedTitle);var installedList=document.createElement('div');installedList.className='nav-installed-list';installedWrap.appendChild(installedList);nav.appendChild(installedWrap);
var foot=document.createElement('div');foot.className='nav-footer';foot.textContent='Lightweight workspace';nav.appendChild(foot);
var backdrop=document.createElement('button');backdrop.type='button';backdrop.className='nav-backdrop';backdrop.setAttribute('aria-label','Close navigation');document.body.appendChild(backdrop);
toggle.addEventListener('click',function(){if(mobile){var open=document.body.classList.toggle('sidebar-open');toggle.setAttribute('aria-expanded',String(open);}else setCollapsed(!collapsed,true);});
backdrop.addEventListener('click',function(){document.body.classList.remove('sidebar-open');toggle.setAttribute('aria-expanded','false');});
if(storage)storage.get('launcherSidebarCollapsed',function(d){if(typeof d.launcherSidebarCollapsed==='boolean'&&!mobile)setCollapsed(d.launcherSidebarCollapsed,false);else setCollapsed(mobile,false);});else setCollapsed(mobile,false);
function installedApps(){if(!storage){installedTitle.hidden=true;return;}storage.get('launcherMarketplaceInstalled',function(d){var installed=d.launcherMarketplaceInstalled||{},ids=Object.keys(installed);if(!ids.length){installedTitle.hidden=true;return;}fetch('miniapps/registry.json').then(function(res){if(!res.ok)throw Error('registry unavailable');return res.json();}).then(function(reg){var records=(reg.apps||[]).filter(function(app){var rec=installed[app.id];return rec&&rec.runtime==='bundled'&&rec.version===app.version;});if(!records.length){installedTitle.hidden=true;return;}records.forEach(function(app){var link=document.createElement('a');link.className='nav-miniapp';link.href='app-workspace.html?id='+encodeURIComponent(app.id);link.title=app.name;link.setAttribute('aria-label',app.name);var icon=document.createElement('span');icon.className='nav-miniapp-icon';icon.textContent=app.icon||'◈';var label=document.createElement('span');label.textContent=app.name;link.appendChild(icon);link.appendChild(label);if(here==='miniapp'&&new URLSearchParams(location.search).get('id')===app.id)link.classList.add('on');installedList.appendChild(link);});}).catch(function(){installedTitle.textContent='Installed mini-apps could not load';});});}
installedApps();
var veil=document.createElement('div');veil.className='nav-transition-veil';veil.setAttribute('aria-hidden','true');document.body.appendChild(veil);
nav.addEventListener('click',function(e){var a=e.target.closest('a');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||reduced)return;e.preventDefault();var url=a.href;document.body.classList.add('nav-transitioning');window.setTimeout(function(){location.href=url;},180);});
})();