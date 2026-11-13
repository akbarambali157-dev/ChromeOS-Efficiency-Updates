(function(){
'use strict';
var $=function(id){return document.getElementById(id);},params=new URLSearchParams(location.search),id=params.get('id');
var frame=$('miniFrame'),notice=$('workspaceNotice'),app=null,nonce='',db=null,ready=false;
function say(message,error){notice.textContent=message||'';notice.className='workspace-notice'+(error?' error':'');}
function validId(v){return typeof v==='string'&&/^[a-z][a-z0-9-]{1,39}$/.test(v);}
function openDb(){return new Promise(function(resolve,reject){var req=indexedDB.open('my-launcher-miniapps',1);req.onupgradeneeded=function(){var d=req.result;if(!d.objectStoreNames.contains('apps'))d.createObjectStore('apps',{keyPath:'appId'});};req.onsuccess=function(){db=req.result;resolve(db);};req.onerror=function(){reject(req.error||Error('App data storage unavailable.'));};});}
function readData(){return new Promise(function(resolve,reject){var tx=db.transaction('apps','readonly'),req=tx.objectStore('apps').get(id);req.onsuccess=function(){resolve(req.result&&req.result.value&&typeof req.result.value==='object'?req.result.value:{});};req.onerror=function(){reject(req.error);};});}
function writeData(value,limit){var json;try{json=JSON.stringify(value);}catch(e){return Promise.reject(Error('App data must be serialisable.'));}if(new Blob([json]).size>limit)return Promise.reject(Error('App data exceeds this app’s '+Math.round(limit/1024)+' KB limit.'));return new Promise(function(resolve,reject){var tx=db.transaction('apps','readwrite');tx.objectStore('apps').put({appId:id,value:value,updatedAt:Date.now()});tx.oncomplete=function(){resolve();};tx.onerror=function(){reject(tx.error||Error('Could not save app data.'));};tx.onabort=function(){reject(tx.error||Error('App data save was cancelled.'));};});}
function theme(){var s=getComputedStyle(document.documentElement),bg=s.getPropertyValue('--bg').trim()||'#10151c',nums=bg.match(/[0-9]+/g),light=nums&&nums.length>=3?((+nums[0]*299+ +nums[1]*587+ +nums[2]*114)/1000>145):false;return{background:bg,panel:s.getPropertyValue('--panel').trim()||'#19222d',text:s.getPropertyValue('--text').trim()||'#e8eef5',muted:s.getPropertyValue('--muted').trim()||'#a8b6c5',accent:s.getPropertyValue('--accent').trim()||'#83d6bd',colorScheme:light?'light':'dark'};}
function send(type,payload){if(!frame.contentWindow)return;frame.contentWindow.postMessage({channel:'my-launcher-miniapp',nonce:nonce,appId:id,type:type,payload:payload||{}},'*');}
function receive(event){if(event.source!==frame.contentWindow)return;var m=event.data;if(!m||m.channel!=='my-launcher-miniapp'||m.nonce!==nonce||m.appId!==id||typeof m.type!=='string')return;
if(m.type==='app.ready'){ready=true;send('theme',theme());readData().then(function(value){send('storage.result',{value:value});}).catch(function(e){say(e.message,true);send('storage.result',{value:{}});});say('Running locally · network access is limited to the app’s declared needs.');return;}
if(m.type==='research.search'){var q=m.payload&&typeof m.payload.query==='string'?m.payload.query.trim().slice(0,180):'';if(!q){send('research.results',{error:'Enter a search term.'});return;}fetch('https://api.openalex.org/works?search='+encodeURIComponent(q)+'&filter=is_oa:true&per-page=8&select=id,doi,title,publication_year,open_access').then(function(r){if(!r.ok)throw Error('OpenAlex request failed.');return r.json();}).then(function(d){var rows=(d.results||[]).slice(0,8).map(function(w){return{title:String(w.title||'Untitled').slice(0,300),year:w.publication_year||null,url:(w.open_access&&w.open_access.oa_url)||w.id};});send('research.results',{items:rows});}).catch(function(){send('research.results',{error:'Search failed. Check your internet connection.'});});return;}
if(m.type==='storage.get'){readData().then(function(value){send('storage.result',{value:value});}).catch(function(e){say(e.message,true);send('storage.result',{value:{}});});return;}
if(m.type==='storage.set'){var value=m.payload&&m.payload.value;if(!value||typeof value!=='object'||Array.isArray(value)){say('Rejected invalid app data.',true);return;}writeData(value,app.dataLimit||65536).then(function(){say('Saved on this device.');if(m.payload.flush)send('app.flushed',{});}).catch(function(e){say(e.message,true);});return;}
if(m.type==='app.flushed'){location.href='apps.html';return;}
if(m.type==='launcher.notes.get'){chrome.storage.local.get('note').then(function(d){send('launcher.notes.result',{text:typeof d.note==='string'?d.note.slice(0,20000):''});}).catch(function(){send('launcher.notes.result',{error:'Could not read launcher note.'});});return;}
if(m.type==='launcher.notes.set'){var note=m.payload&&typeof m.payload.text==='string'?m.payload.text:'';if(note.length>20000){send('launcher.notes.saved',{ok:false,error:'Launcher note is limited to 20,000 characters.'});return;}chrome.storage.local.set({note:note}).then(function(){send('launcher.notes.saved',{ok:true});}).catch(function(){send('launcher.notes.saved',{ok:false,error:'Could not save launcher note.'});});return;}
if(m.type==='launcher.tasks.add'){var payload=m.payload||{},title=typeof payload.title==='string'?payload.title.trim().slice(0,160):'',due=typeof payload.due==='string'?payload.due:'';var dateOk=!due||(/^\\d{4}-\\d{2}-\\d{2}$/.test(due)&&!isNaN(new Date(due+'T00:00:00').getTime())&&new Date(due+'T00:00:00').toISOString().slice(0,10)===due);if(!title||!dateOk){send('launcher.tasks.added',{ok:false,error:'Task title or due date is invalid.'});return;}chrome.storage.local.get('tasks').then(function(d){var tasks=Array.isArray(d.tasks)?d.tasks.filter(function(t){return t&&typeof t.title==='string'&&t.title.trim()&&t.title.length<=160;}).slice(0,100):[];if(tasks.length>=100){send('launcher.tasks.added',{ok:false,error:'Launcher task limit reached.'});return;}tasks.push({id:String(Date.now())+'-'+String(Math.floor(Math.random()*100000)),title:title,due:due,done:false,created:Date.now()});return chrome.storage.local.set({tasks:tasks}).then(function(){send('launcher.tasks.added',{ok:true});});}).catch(function(){send('launcher.tasks.added',{ok:false,error:'Could not add launcher task.'});});return;}

if(m.type==='app.close'){location.href='apps.html';return;}
}
function init(){
if(!validId(id)){say('Invalid app ID.',true);return;}
Promise.all([fetch('miniapps/registry.json').then(function(r){if(!r.ok)throw Error('Local app registry unavailable.');return r.json();}),chrome.storage.local.get('launcherMarketplaceInstalled'),openDb()]).then(function(values){
var registry=values[0],installed=values[1].launcherMarketplaceInstalled||{};
if(!registry||registry.schemaVersion!==1||!Array.isArray(registry.apps))throw Error('Unsupported local app registry.');
app=registry.apps.filter(function(x){return x&&x.id===id;})[0];
if(!app)throw Error('This app is not included in the installed launcher version.');
var record=installed[id];
if(!record||record.runtime!=='bundled'||record.version!==app.version)throw Error('Install this app from the marketplace before opening it.');
$('workspaceIcon').textContent=app.icon||'□';$('workspaceName').textContent=app.name;$('workspaceMeta').textContent='Version '+app.version+' · '+app.ramMb+' MB estimated active RAM · local app';
nonce=Array.from(crypto.getRandomValues(new Uint8Array(24))).map(function(x){return x.toString(16).padStart(2,'0');}).join('');
frame.src='app-frame.html?id='+encodeURIComponent(id)+'&nonce='+encodeURIComponent(nonce);
}).catch(function(e){say(e.message,true);$('workspaceName').textContent='App unavailable';});
}
frame.addEventListener('load',function(){if(ready)send('theme',theme());});
window.addEventListener('message',receive);
chrome.storage.onChanged.addListener(function(changes,area){if(area==='local'&&ready&&(changes.theme||changes.themeMode||changes.customPalette)){send('theme',theme());}});
$('minimiseApp').addEventListener('click',function(){var shell=document.querySelector('.mini-frame-shell'),hidden=shell.hidden;shell.hidden=!hidden;$('minimiseApp').textContent=hidden?'Minimise':'Restore';say(hidden?'App restored.':'App minimised. Its workspace remains open.');});
$('closeApp').addEventListener('click',function(){if(ready){say('Saving app data before closing…');send('app.flush',{});}else location.href='apps.html';});
window.addEventListener('pagehide',function(){if(db)db.close();});
init();
})();