(function(){
'use strict';
var $=function(id){return document.getElementById(id);},params=new URLSearchParams(location.search),id=params.get('id');
var frame=$('miniFrame'),notice=$('workspaceNotice'),app=null,nonce='',db=null,ready=false;
function say(message,error){notice.textContent=message||'';notice.className='workspace-notice'+(error?' error':'');}
function validId(v){return typeof v==='string'&&/^[a-z][a-z0-9-]{1,39}$/.test(v);}
function openDb(){return new Promise(function(resolve,reject){var req=indexedDB.open('my-launcher-miniapps',1);req.onupgradeneeded=function(){var d=req.result;if(!d.objectStoreNames.contains('apps'))d.createObjectStore('apps',{keyPath:'appId'});};req.onsuccess=function(){db=req.result;resolve(db);};req.onerror=function(){reject(req.error||Error('App data storage unavailable.'));};});}
function readData(){return new Promise(function(resolve,reject){var tx=db.transaction('apps','readonly'),req=tx.objectStore('apps').get(id);req.onsuccess=function(){resolve(req.result&&req.result.value&&typeof req.result.value==='object'?req.result.value:{});};req.onerror=function(){reject(req.error);};});}
function writeData(value,limit){var json;try{json=JSON.stringify(value);}catch(e){return Promise.reject(Error('App data must be serialisable.'));}if(json.length>limit)return Promise.reject(Error('App data exceeds this app’s '+Math.round(limit/1024)+' KB limit.'));return new Promise(function(resolve,reject){var tx=db.transaction('apps','readwrite');tx.objectStore('apps').put({appId:id,value:value,updatedAt:Date.now()});tx.oncomplete=function(){resolve();};tx.onerror=function(){reject(tx.error||Error('Could not save app data.'));};tx.onabort=function(){reject(tx.error||Error('App data save was cancelled.'));};});}
function theme(){var s=getComputedStyle(document.documentElement);return{background:s.getPropertyValue('--bg').trim()||'#10151c',panel:s.getPropertyValue('--panel').trim()||'#19222d',text:s.getPropertyValue('--text').trim()||'#e8eef5',muted:s.getPropertyValue('--muted').trim()||'#a8b6c5',accent:s.getPropertyValue('--accent').trim()||'#83d6bd',colorScheme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'};}
function send(type,payload){if(!frame.contentWindow)return;frame.contentWindow.postMessage({channel:'my-launcher-miniapp',nonce:nonce,appId:id,type:type,payload:payload||{}},'*');}
function receive(event){if(event.source!==frame.contentWindow)return;var m=event.data;if(!m||m.channel!=='my-launcher-miniapp'||m.nonce!==nonce||m.appId!==id||typeof m.type!=='string')return;
if(m.type==='app.ready'){ready=true;send('theme',theme());readData().then(function(value){send('storage.result',{value:value});}).catch(function(e){say(e.message,true);send('storage.result',{value:{}});});say('Running locally · network access is limited to the app’s declared needs.');return;}
if(m.type==='storage.get'){readData().then(function(value){send('storage.result',{value:value});}).catch(function(e){say(e.message,true);send('storage.result',{value:{}});});return;}
if(m.type==='storage.set'){var value=m.payload&&m.payload.value;if(!value||typeof value!=='object'||Array.isArray(value)){say('Rejected invalid app data.',true);return;}writeData(value,app.dataLimit||65536).then(function(){say('Saved on this device.');}).catch(function(e){say(e.message,true);});return;}
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
$('closeApp').addEventListener('click',function(){location.href='apps.html';});
window.addEventListener('pagehide',function(){if(db)db.close();});
init();
})();