(function(){
'use strict';
if(document.body.getAttribute('data-app')!=='home')return;
var $=function(id){return document.getElementById(id);},tour=null,step=0,animating=false,started=false;
var steps=[
{title:'Welcome to your launcher',body:'This is your home base: a calmer dashboard with space for your shortcuts, notes and tasks. Let us take a quick tour.',target:null,action:'continue'},
{title:'Your sidebar',body:'Tap the menu button to collapse or expand navigation. On smaller screens it opens as a drawer. Installed mini-apps are listed beneath the main pages.',target:'.nav-toggle',action:'sidebar'},
{title:'Installed mini-apps',body:'Mini-apps you have installed get their own shortcuts in the sidebar. Open one there, or visit Mini-apps to discover and install more.',target:'.nav-installed',action:'manual'},
{title:'Search',body:'Use this field to search, run launcher commands, or find a shortcut. It is your quick entry point.',target:'#q',action:'focus'},
{title:'Shortcuts and workspaces',body:'Keep favourite sites here. Add, edit or remove shortcuts. Use Workspaces to maintain separate collections for school, projects or personal use.',target:'#layout-shortcuts',action:'manual'},
{title:'Notes and tasks',body:'Quick notes and tasks have their own panels. Notes autosave and tasks can have due dates.',target:'#layout-notes',action:'manual'},
{title:'Settings, when you need them',body:'Themes, wallpaper, accessibility, backup and performance settings are tucked into this expandable section so they do not dominate your dashboard.',target:'#homeSettings',action:'manual'},
{title:'You are all set',body:'That is the basics. Explore at your own pace. You can reopen this guide whenever you need it from the Guide button.',target:null,action:'finish'}
];
function build(){if(tour)return;tour=document.createElement('section');tour.className='launcher-tour';tour.setAttribute('role','dialog');tour.setAttribute('aria-modal','true');tour.setAttribute('aria-labelledby','tourTitle');tour.innerHTML='<div class="tour-card"><div class="tour-kicker">QUICK TOUR <span id="tourCount"></span></div><h2 id="tourTitle"></h2><p id="tourBody"></p><div class="tour-progress" aria-hidden="true"><i id="tourProgress"></i></div><div class="tour-actions"><button type="button" class="tour-skip">Skip tour</button><button type="button" class="tour-next">Continue</button></div></div>';document.body.appendChild(tour);tour.querySelector('.tour-skip').addEventListener('click',finish);tour.querySelector('.tour-next').addEventListener('click',advance);}
function clearTarget(){document.querySelectorAll('.tour-highlight').forEach(function(el){el.classList.remove('tour-highlight');});}
function render(){if(!tour)return;clearTarget();var s=steps[step],next=tour.querySelector('.tour-next');tour.querySelector('#tourCount').textContent='· '+(step+1)+' / '+steps.length;tour.querySelector('#tourTitle').textContent=s.title;tour.querySelector('#tourBody').textContent=s.body;tour.querySelector('#tourProgress').style.width=((step+1)/steps.length*100)+'%';next.textContent=s.action==='finish'?'Finish':s.action==='continue'?'Continue':'Next';next.hidden=s.action==='sidebar'||s.action==='focus';if(s.target){var target=document.querySelector(s.target);if(target){target.classList.add('tour-highlight');if(s.action==='sidebar'||s.action==='focus')target.focus();}}if(s.action==='manual')next.focus();}
function advance(){if(animating)return;if(step>=steps.length-1){finish();return;}animating=true;tour.classList.add('tour-dark-transition');window.setTimeout(function(){step++;render();window.setTimeout(function(){tour.classList.remove('tour-dark-transition');animating=false;},90);},170);}
function finish(){if(tour){tour.remove();tour=null;}clearTarget();started=false;chrome.storage.local.set({launcherTourComplete:true});}
function start(){if(started)return;started=true;build();step=0;render();tour.querySelector('.tour-next').focus();}
var guide=document.createElement('button');guide.type='button';guide.className='launcher-guide';guide.textContent='Guide';guide.setAttribute('aria-label','Open quick tour');guide.addEventListener('click',function(){started=false;start();});document.body.appendChild(guide);
document.addEventListener('click',function(e){if(!tour||animating)return;var s=steps[step];if(s.action==='sidebar'&&e.target.closest('.nav-toggle'))advance();else if(step===6&&e.target.closest('#homeSettings summary'))advance();});
document.addEventListener('focusin',function(e){if(!tour||animating||!e.isTrusted)return;if(steps[step].action==='focus'&&e.target.closest('#q'))advance();else if(steps[step].action==='manual'&&step===5&&e.target.closest('#layout-notes, #taskTitle'))advance();});
document.addEventListener('change',function(e){if(!tour||animating)return;if(step===4&&e.target.closest('#workspaceSelect'))advance();});
chrome.storage.local.get('launcherTourComplete',function(d){if(!d.launcherTourComplete)start();});
})();