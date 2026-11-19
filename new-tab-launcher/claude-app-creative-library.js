/* Lazy Creative Library for the AI Development Workspace.
   Binary assets stay in IndexedDB; list rendering reads metadata only. */
(function(g){
'use strict';
var DB='cc-creative-library',VERSION=1,MAX_ASSETS=500,MAX_BATCH=8,PAGE=30,MAX_ANALYSIS=12000;
var LIMITS={image:15*1024*1024,video:50*1024*1024,text:2*1024*1024,document:20*1024*1024};
var db=null,dbPromise=null,app=null,root=null,ui=null,assets=[],collections=[],profiles=[],selectedId='',selectedProfileId='',objectUrl='',pageLimit=PAGE;
function uid(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
function el(tag,value,cls){var n=document.createElement(tag);if(value!==undefined&&value!==null)n.textContent=value;if(cls)n.className=cls;return n;}
function button(value,cls){var n=el('button',value,cls||'ghost');n.type='button';return n;}
function field(labelText,tag,placeholder){var wrap=el('label',undefined,'cl-field'),label=el('span',labelText),input=document.createElement(tag||'input');if(placeholder)input.placeholder=placeholder;input.className='workspace-input';wrap.appendChild(label);wrap.appendChild(input);return{wrap:wrap,input:input};}
function classifyFile(file){
 if(!file||typeof file.name!=='string')return'';
 var name=file.name.toLowerCase(),type=String(file.type||'').toLowerCase(),byName='';
 if(/\.(png|jpe?g|webp)$/.test(name))byName='image';
 else if(/\.(mp4|webm)$/.test(name))byName='video';
 else if(/\.(txt|md|markdown)$/.test(name))byName='text';
 else if(/\.pdf$/.test(name))byName='document';
 var byMime=type==='image/png'||type==='image/jpeg'||type==='image/webp'?'image':
  type==='video/mp4'||type==='video/webm'?'video':
  type==='text/plain'||type==='text/markdown'?'text':
  type==='application/pdf'?'document':'';
 if(type&&type!=='application/octet-stream'&&!byMime)return'';
 if(byName&&byMime&&byName!==byMime)return'';
 return byMime||byName;
}
function mimeFor(file,kind){
 var type=String(file&&file.type||'').toLowerCase(),allowed={image:['image/png','image/jpeg','image/webp'],video:['video/mp4','video/webm'],text:['text/plain','text/markdown'],document:['application/pdf']}[kind]||[];
 if(allowed.indexOf(type)>=0)return type;
 var name=String(file&&file.name||'').toLowerCase(),ext=name.slice(name.lastIndexOf('.')+1);
 var inferred=({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',txt:'text/plain',md:'text/markdown',markdown:'text/markdown',pdf:'application/pdf'})[ext];
 return allowed.indexOf(inferred)>=0?inferred:(allowed[0]||'application/octet-stream');
}
function formatBytes(bytes){var n=Number(bytes)||0;if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(1)+' KB';if(n<1073741824)return(n/1048576).toFixed(1)+' MB';return(n/1073741824).toFixed(2)+' GB';}
function validateFile(file){
 var kind=classifyFile(file);if(!kind)return{ok:false,reason:'Unsupported type. Use PNG, JPEG, WebP, MP4, WebM, TXT, Markdown or PDF.'};
 var size=Number(file.size);if(!Number.isFinite(size)||size<=0)return{ok:false,reason:'The selected file is empty or has an invalid size.'};
 if(size>LIMITS[kind])return{ok:false,reason:'File exceeds the '+formatBytes(LIMITS[kind])+' limit for '+kind+' references.'};
 return{ok:true,type:kind,mime:mimeFor(file,kind),maxBytes:LIMITS[kind]};
}
function normalizeTags(value){
 var list=Array.isArray(value)?value:String(value||'').split(','),seen={},out=[];
 list.forEach(function(item){var tag=String(item||'').trim().replace(/\s+/g,' ').slice(0,32),key=tag.toLowerCase();if(tag&&!seen[key]&&out.length<12){seen[key]=true;out.push(tag);}});return out;
}
function matchesAsset(asset,filter){
 filter=filter||{};var q=String(filter.query||'').trim().toLowerCase();
 if(filter.type&&filter.type!=='all'&&asset.type!==filter.type)return false;
 if(filter.collectionId&&filter.collectionId!=='all'&&asset.collectionId!==filter.collectionId)return false;
 if(!q)return true;return[asset.name,asset.description,asset.analysis,(asset.tags||[]).join(' ')].join(' ').toLowerCase().indexOf(q)!==-1;
}
function mergeAsset(current,updates){return Object.assign({},current||{},updates||{});}
function txRun(stores,mode,work){
 return new Promise(function(resolve,reject){
  if(!db)return reject(new Error('Creative Library database is not open.'));
  var tx;try{tx=db.transaction(stores,mode);}catch(e){reject(e);return;}
  var requests=[];try{var result=work(tx);if(Array.isArray(result))requests=result.filter(Boolean);else if(result)requests=[result];}
  catch(e){try{tx.abort();}catch(ignore){}reject(e);return;}
  var values=new Array(requests.length);
  requests.forEach(function(req,i){req.onsuccess=function(){values[i]=req.result;};req.onerror=function(){reject(req.error||new Error('IndexedDB request failed.'));};});
  tx.oncomplete=function(){resolve(values.length===0?undefined:values.length===1?values[0]:values);};
  tx.onerror=function(){reject(tx.error||new Error('IndexedDB transaction failed.'));};
  tx.onabort=function(){reject(tx.error||new Error('IndexedDB transaction was cancelled.'));};
 });
}
function openDb(){
 if(db)return Promise.resolve(db);if(dbPromise)return dbPromise;
 dbPromise=new Promise(function(resolve,reject){
  if(!g.indexedDB){reject(new Error('IndexedDB is unavailable in this browser context.'));return;}
  var request=g.indexedDB.open(DB,VERSION);
  request.onupgradeneeded=function(){
   var d=request.result;
   if(!d.objectStoreNames.contains('assets')){var a=d.createObjectStore('assets',{keyPath:'id'});a.createIndex('createdAt','createdAt',{unique:false});a.createIndex('type','type',{unique:false});a.createIndex('collectionId','collectionId',{unique:false});}
   if(!d.objectStoreNames.contains('blobs'))d.createObjectStore('blobs',{keyPath:'id'});
   if(!d.objectStoreNames.contains('collections'))d.createObjectStore('collections',{keyPath:'id'});
   if(!d.objectStoreNames.contains('profiles'))d.createObjectStore('profiles',{keyPath:'id'});
  };
  request.onsuccess=function(){db=request.result;db.onversionchange=function(){db.close();db=null;dbPromise=null;};resolve(db);};
  request.onerror=function(){dbPromise=null;reject(request.error||new Error('Could not open Creative Library storage.'));};
  request.onblocked=function(){dbPromise=null;reject(new Error('Storage upgrade is blocked by another open workspace. Close other extension tabs and retry.'));};
 }).catch(function(e){dbPromise=null;throw e;});return dbPromise;
}
function getAll(store){return txRun(store,'readonly',function(tx){return tx.objectStore(store).getAll();}).then(function(v){return Array.isArray(v)?v:[];});}
function put(store,value){return txRun(store,'readwrite',function(tx){return tx.objectStore(store).put(value);});}
function setStatus(message,bad){if(ui&&ui.status){ui.status.textContent=message||'';ui.status.className='cl-status'+(bad?' err':'');}}
function releasePreview(){if(objectUrl){g.URL.revokeObjectURL(objectUrl);objectUrl='';}}
function activeAsset(){return assets.filter(function(a){return a.id===selectedId;})[0]||null;}
function activeProject(){return app&&app.getProjectInfo?app.getProjectInfo():null;}
function projectList(){var x=app&&app.getProjects?app.getProjects():null;return x&&Array.isArray(x.projects)?x.projects:[];}
function buildUI(){
 root.textContent='';ui={};
 var shell=el('div',undefined,'cl-shell'),head=el('div',undefined,'cl-head'),copy=el('div');
 copy.appendChild(el('h2','Creative Library'));copy.appendChild(el('p','Keep local references, notes and reusable creative direction together.'));
 var importButton=button('Import references','primary'),picker=document.createElement('input');
 picker.type='file';picker.multiple=true;picker.hidden=true;picker.accept='.png,.jpg,.jpeg,.webp,.mp4,.webm,.txt,.md,.markdown,.pdf,image/png,image/jpeg,image/webp,video/mp4,video/webm,text/plain,text/markdown,application/pdf';
 head.appendChild(copy);head.appendChild(importButton);shell.appendChild(head);shell.appendChild(picker);
 shell.appendChild(el('p','Your references stay on this device. No asset is sent to an AI provider automatically. Image/video analysis and PDF text extraction are not available in this release.','cl-privacy'));
 var toolbar=el('div',undefined,'cl-toolbar'),search=document.createElement('input');search.type='search';search.className='workspace-input';search.placeholder='Search names, descriptions, tags or analysis';search.setAttribute('aria-label','Search references');
 var type=document.createElement('select');type.className='workspace-input';type.setAttribute('aria-label','Filter by type');
 [['all','All types'],['image','Images'],['video','Videos'],['text','Text'],['document','PDF documents']].forEach(function(x){var o=el('option',x[1]);o.value=x[0];type.appendChild(o);});
 var collectionFilter=document.createElement('select');collectionFilter.className='workspace-input';collectionFilter.setAttribute('aria-label','Filter by collection');
 toolbar.appendChild(search);toolbar.appendChild(type);toolbar.appendChild(collectionFilter);shell.appendChild(toolbar);
 var grid=el('div',undefined,'cl-grid'),left=el('div',undefined,'cl-column'),right=el('div',undefined,'cl-column');
 var listPanel=el('section',undefined,'cl-panel'),listHead=el('div',undefined,'cl-panel-head');listHead.appendChild(el('h3','References'));ui.count=el('span','0 items','cl-count');listHead.appendChild(ui.count);ui.list=el('div',undefined,'cl-list');ui.more=button('Show more','mini');listPanel.appendChild(listHead);listPanel.appendChild(ui.list);listPanel.appendChild(ui.more);left.appendChild(listPanel);
 var collectionsPanel=el('section',undefined,'cl-panel');collectionsPanel.appendChild(el('h3','Collections'));var collectionRow=el('div',undefined,'cl-inline');
 ui.collectionName=document.createElement('input');ui.collectionName.className='workspace-input';ui.collectionName.maxLength=48;ui.collectionName.placeholder='New collection name';var addCollection=button('Add','mini');
 collectionRow.appendChild(ui.collectionName);collectionRow.appendChild(addCollection);ui.collectionList=el('div',undefined,'cl-collection-list');collectionsPanel.appendChild(collectionRow);collectionsPanel.appendChild(ui.collectionList);left.appendChild(collectionsPanel);
 var detailPanel=el('section',undefined,'cl-panel');detailPanel.appendChild(el('h3','Reference details'));ui.detail=el('div',undefined,'cl-detail');detailPanel.appendChild(ui.detail);right.appendChild(detailPanel);
 var profilePanel=el('section',undefined,'cl-panel');profilePanel.appendChild(el('h3','Style profiles'));profilePanel.appendChild(el('p','Reusable creative direction stored locally; this is not model training.','cl-muted'));
 ui.profileSelect=document.createElement('select');ui.profileSelect.className='workspace-input';ui.profileSelect.setAttribute('aria-label','Choose style profile');profilePanel.appendChild(ui.profileSelect);
 var pn=field('Profile name','input','e.g. Documentary editorial'),pd=field('Description','textarea','What defines this style?'),pp=field('Reusable prompt guidance','textarea','Describe tone, pacing, composition or writing direction.');
 pn.input.maxLength=60;pd.input.maxLength=500;pp.input.maxLength=1200;ui.profileName=pn.input;ui.profileDescription=pd.input;ui.profilePrompt=pp.input;
 profilePanel.appendChild(pn.wrap);profilePanel.appendChild(pd.wrap);profilePanel.appendChild(pp.wrap);
 var actions=el('div',undefined,'cl-actions');ui.profileSave=button('Save profile','primary');ui.profileDelete=button('Delete','ghost');ui.profileCopy=button('Copy guidance','ghost');
 actions.appendChild(ui.profileSave);actions.appendChild(ui.profileDelete);actions.appendChild(ui.profileCopy);profilePanel.appendChild(actions);right.appendChild(profilePanel);
 grid.appendChild(left);grid.appendChild(right);shell.appendChild(grid);ui.status=el('div','','cl-status');ui.status.setAttribute('role','status');ui.status.setAttribute('aria-live','polite');shell.appendChild(ui.status);root.appendChild(shell);
 importButton.addEventListener('click',function(){picker.click();});picker.addEventListener('change',function(){importFiles(picker.files);picker.value='';});
 search.addEventListener('input',function(){pageLimit=PAGE;renderList();});type.addEventListener('change',function(){pageLimit=PAGE;renderList();});collectionFilter.addEventListener('change',function(){pageLimit=PAGE;renderList();});
 ui.more.addEventListener('click',function(){pageLimit+=PAGE;renderList();});addCollection.addEventListener('click',createCollection);
 ui.profileSelect.addEventListener('change',function(){selectedProfileId=ui.profileSelect.value;renderProfileForm();});
 ui.profileSave.addEventListener('click',saveProfile);ui.profileDelete.addEventListener('click',deleteProfile);ui.profileCopy.addEventListener('click',copyProfile);
 ui={status:ui.status,count:ui.count,list:ui.list,more:ui.more,collectionName:ui.collectionName,collectionList:ui.collectionList,detail:ui.detail,profileSelect:ui.profileSelect,profileName:ui.profileName,profileDescription:ui.profileDescription,profilePrompt:ui.profilePrompt,profileSave:ui.profileSave,profileDelete:ui.profileDelete,profileCopy:ui.profileCopy,search:search,type:type,collectionFilter:collectionFilter};
}
function renderCollectionFilter(){
 var current=ui.collectionFilter.value||'all';ui.collectionFilter.textContent='';var all=el('option','All collections');all.value='all';ui.collectionFilter.appendChild(all);
 collections.forEach(function(c){var o=el('option',c.name);o.value=c.id;ui.collectionFilter.appendChild(o);});ui.collectionFilter.value=collections.some(function(c){return c.id===current;})?current:'all';
}
function renderList(){
 var filter={query:ui.search.value,type:ui.type.value,collectionId:ui.collectionFilter.value},matches=assets.filter(function(a){return matchesAsset(a,filter);});
 ui.list.textContent='';ui.count.textContent=matches.length+' '+(matches.length===1?'item':'items');
 if(!matches.length){ui.list.appendChild(el('p','No references match this view. Import a file or change the filters.','cl-empty'));ui.more.hidden=true;return;}
 matches.slice(0,pageLimit).forEach(function(asset){
  var row=button('','cl-asset'+(asset.id===selectedId?' selected':''));row.setAttribute('aria-pressed',asset.id===selectedId?'true':'false');
  row.appendChild(el('strong',asset.name));row.appendChild(el('small',(asset.type||'file').toUpperCase()+' · '+formatBytes(asset.size)));
  var tags=el('span',(asset.tags||[]).slice(0,4).join(' · '),'cl-tags');if(tags.textContent)row.appendChild(tags);
  row.addEventListener('click',function(){selectedId=asset.id;renderList();renderDetail();});ui.list.appendChild(row);
 });ui.more.hidden=matches.length<=pageLimit;
}
function renderCollections(){
 renderCollectionFilter();ui.collectionList.textContent='';
 collections.forEach(function(c){var count=assets.filter(function(a){return a.collectionId===c.id;}).length,row=el('div',undefined,'cl-collection-row');row.appendChild(el('span',c.name+' · '+count));
  if(c.id!=='unsorted'){var remove=button('Delete','mini');remove.addEventListener('click',function(){deleteCollection(c);});row.appendChild(remove);}ui.collectionList.appendChild(row);
 });
}
function renderProfileForm(){
 var p=profiles.filter(function(x){return x.id===selectedProfileId;})[0]||null;
 ui.profileName.value=p?p.name:'';ui.profileDescription.value=p?p.description||'':'';ui.profilePrompt.value=p?p.prompt||'':'';
 ui.profileDelete.disabled=!p;ui.profileCopy.disabled=!p;ui.profileSave.textContent=p?'Update profile':'Save profile';
}
function renderProfiles(){
 var current=selectedProfileId;ui.profileSelect.textContent='';var blank=el('option','New style profile');blank.value='';ui.profileSelect.appendChild(blank);
 profiles.forEach(function(p){var o=el('option',p.name);o.value=p.id;ui.profileSelect.appendChild(o);});
 selectedProfileId=profiles.some(function(p){return p.id===current;})?current:'';ui.profileSelect.value=selectedProfileId;renderProfileForm();
}
function loadBlob(id){return txRun('blobs','readonly',function(tx){return tx.objectStore('blobs').get(id);});}
function renderPreview(asset,box){
 releasePreview();box.textContent='';
 if(asset.type==='document'){box.appendChild(el('p','PDF stored locally. Text extraction and in-app PDF rendering are not included.','cl-muted'));return;}
 loadBlob(asset.id).then(function(record){
  if(!record||!record.blob||selectedId!==asset.id)return;objectUrl=g.URL.createObjectURL(record.blob);
  if(asset.type==='image'){var img=el('img');img.alt=asset.name;img.loading='lazy';img.src=objectUrl;img.className='cl-preview-image';box.appendChild(img);return;}
  if(asset.type==='video'){var video=el('video');video.controls=true;video.preload='metadata';video.playsInline=true;video.src=objectUrl;video.className='cl-preview-video';box.appendChild(video);box.appendChild(el('p','Only browser metadata/preview is requested; the full video is not decoded into app memory.','cl-muted'));return;}
  if(asset.type==='text')record.blob.slice(0,49152).text().then(function(text){if(selectedId===asset.id)box.appendChild(el('pre',text.slice(0,MAX_ANALYSIS),'cl-preview-text'));});
 }).catch(function(e){if(selectedId===asset.id)box.appendChild(el('p','Preview unavailable: '+(e.message||e),'cl-muted'));});
}
function renderDetail(){
 releasePreview();ui.detail.textContent='';var asset=activeAsset();if(!asset){ui.detail.appendChild(el('p','Select a reference to inspect it, or import your first file.','cl-empty'));return;}
 var name=field('Name','input','Reference name'),description=field('Description / notes','textarea','Add context, intended use or observations.'),tags=field('Tags (comma separated)','input','editorial, colour, pacing');
 name.input.value=asset.name;name.input.maxLength=180;description.input.value=asset.description||'';description.input.maxLength=1200;tags.input.value=(asset.tags||[]).join(', ');tags.input.maxLength=400;
 ui.detail.appendChild(el('p',(asset.type||'file').toUpperCase()+' · '+formatBytes(asset.size)+' · Added '+new Date(asset.createdAt).toLocaleDateString(),'cl-muted'));
 ui.detail.appendChild(name.wrap);ui.detail.appendChild(description.wrap);ui.detail.appendChild(tags.wrap);
 var collection=field('Collection','select');collections.forEach(function(c){var o=el('option',c.name);o.value=c.id;collection.input.appendChild(o);});collection.input.value=asset.collectionId||'unsorted';ui.detail.appendChild(collection.wrap);
 var actions=el('div',undefined,'cl-actions'),save=button('Save reference details','primary'),remove=button('Delete reference','ghost');actions.appendChild(save);actions.appendChild(remove);ui.detail.appendChild(actions);
 save.addEventListener('click',function(){
  var current=assets.filter(function(a){return a.id===asset.id;})[0]||asset;
  var next=mergeAsset(current,{name:name.input.value.trim().slice(0,180),description:description.input.value.slice(0,1200),tags:normalizeTags(tags.input.value),collectionId:collection.input.value||'unsorted',updatedAt:Date.now()});
  if(!next.name)return setStatus('Reference name is required.',true);
  put('assets',next).then(function(){assets=assets.map(function(a){return a.id===next.id?next:a;});render();setStatus('Reference details saved locally.');}).catch(function(e){setStatus('Could not save details: '+e.message,true);});
 });
 remove.addEventListener('click',function(){if(!g.confirm('Delete '+asset.name+' and its locally stored file?'))return;
  txRun(['assets','blobs'],'readwrite',function(tx){return[tx.objectStore('assets').delete(asset.id),tx.objectStore('blobs').delete(asset.id)];}).then(function(){assets=assets.filter(function(a){return a.id!==asset.id;});selectedId=assets[0]?assets[0].id:'';render();setStatus('Reference deleted from this device.');}).catch(function(e){setStatus('Could not delete reference: '+e.message,true);});
 });
 var preview=el('div',undefined,'cl-preview');ui.detail.appendChild(preview);renderPreview(asset,preview);
 var projects=projectList(),projectField=field('Project association','select');if(!projects.length){var empty=el('option','No project available');empty.value='';projectField.input.appendChild(empty);}
 projects.forEach(function(p){var o=el('option',p.name||'Untitled project');o.value=p.id;projectField.input.appendChild(o);});
 var active=activeProject();if(active&&projects.some(function(p){return p.id===active.id;}))projectField.input.value=active.id;
 ui.detail.appendChild(projectField.wrap);var attached=Array.isArray(asset.projectIds)?asset.projectIds:[];
 var projectButton=button('Attach / detach selected project','mini');projectButton.addEventListener('click',function(){
  var projectId=projectField.input.value;if(!projectId)return setStatus('Choose a project first.',true);
  var current=assets.filter(function(a){return a.id===asset.id;})[0]||asset;
  var ids=(current.projectIds||[]).slice(),index=ids.indexOf(projectId);if(index>=0)ids.splice(index,1);else if(ids.length<20)ids.push(projectId);else return setStatus('A reference can be linked to at most 20 projects.',true);
  var next=mergeAsset(current,{projectIds:ids,updatedAt:Date.now()});
  put('assets',next).then(function(){assets=assets.map(function(a){return a.id===next.id?next:a;});render();setStatus(index>=0?'Project association removed.':'Reference attached to project.');}).catch(function(e){setStatus('Could not update project association: '+e.message,true);});
 });
 ui.detail.appendChild(projectButton);ui.detail.appendChild(el('p',attached.length?'Linked project count: '+attached.length:'Not attached to a project.','cl-muted'));
 if(asset.type==='text'&&app&&app.analyzeCreativeText){var analyze=button('Analyze text with AI','ghost');analyze.addEventListener('click',function(){analyzeText(asset);});ui.detail.appendChild(analyze);}
 else if(asset.type!=='text')ui.detail.appendChild(el('p','AI analysis is text-only in this release. This asset remains on-device.','cl-muted'));
 if(asset.analysis){ui.detail.appendChild(el('h4','Saved AI analysis'));ui.detail.appendChild(el('pre',asset.analysis,'cl-analysis'));}
}
function render(){renderCollections();renderProfiles();renderList();renderDetail();}
function refresh(){
 return Promise.all([getAll('assets'),getAll('collections'),getAll('profiles')]).then(function(v){
  assets=v[0].filter(function(a){return a&&typeof a.id==='string'&&typeof a.name==='string';}).sort(function(a,b){return(b.createdAt||0)-(a.createdAt||0);}).slice(0,MAX_ASSETS);
  collections=v[1].filter(function(c){return c&&typeof c.id==='string'&&typeof c.name==='string';});
  profiles=v[2].filter(function(p){return p&&typeof p.id==='string'&&typeof p.name==='string';}).slice(0,100);
  if(!collections.some(function(c){return c.id==='unsorted';}))collections.unshift({id:'unsorted',name:'Unsorted',createdAt:Date.now()});
  if(!assets.some(function(a){return a.id===selectedId;}))selectedId=assets[0]?assets[0].id:'';render();
 });
}
function ensureDefault(){return getAll('collections').then(function(v){if(v.some(function(c){return c.id==='unsorted';}))return;return put('collections',{id:'unsorted',name:'Unsorted',createdAt:Date.now(),updatedAt:Date.now()});});}
function checkQuota(size){
 if(!g.navigator||!g.navigator.storage||!g.navigator.storage.estimate)return Promise.resolve(true);
 return g.navigator.storage.estimate().then(function(x){return!x.quota||(Number(x.usage)||0)+size<x.quota*.85;}).catch(function(){return true;});
}
function importFiles(fileList){
 var files=Array.prototype.slice.call(fileList||[]);if(!files.length)return;
 if(files.length>MAX_BATCH){setStatus('Only the first '+MAX_BATCH+' files in this batch will be imported.');files=files.slice(0,MAX_BATCH);}
 var imported=0,skipped=[],chain=Promise.resolve();
 files.forEach(function(file){chain=chain.then(function(){
  var check=validateFile(file);if(!check.ok){skipped.push(file.name+': '+check.reason);return;}
  if(assets.length>=MAX_ASSETS){skipped.push(file.name+': library limit reached ('+MAX_ASSETS+').');return;}
  return checkQuota(file.size).then(function(enough){if(!enough){skipped.push(file.name+': browser storage is near its quota.');return;}
   var meta={id:uid(),name:file.name.slice(0,180),type:check.type,mime:check.mime,size:file.size,description:'',tags:[],collectionId:'unsorted',projectIds:[],analysis:'',createdAt:Date.now(),updatedAt:Date.now()};
   return txRun(['assets','blobs'],'readwrite',function(tx){return[tx.objectStore('assets').put(meta),tx.objectStore('blobs').put({id:meta.id,blob:file})];}).then(function(){assets.unshift(meta);selectedId=meta.id;imported++;});
  });
 }).catch(function(e){skipped.push(file.name+': '+(e.message||'storage error'));});});
 chain.then(function(){render();setStatus(imported+' reference(s) imported locally.'+(skipped.length?' '+skipped.join(' | '):''),skipped.length>0);});
}
function createCollection(){
 var name=ui.collectionName.value.trim().slice(0,48);if(!name)return setStatus('Enter a collection name.',true);
 if(collections.length>=60)return setStatus('Collection limit reached (60).',true);
 if(collections.some(function(c){return c.name.toLowerCase()===name.toLowerCase();}))return setStatus('A collection with that name already exists.',true);
 var record={id:uid(),name:name,createdAt:Date.now(),updatedAt:Date.now()};
 put('collections',record).then(function(){collections.push(record);ui.collectionName.value='';render();setStatus('Collection created.');}).catch(function(e){setStatus('Could not create collection: '+e.message,true);});
}
function deleteCollection(collection){
 if(!g.confirm('Delete collection '+collection.name+'? Its references will move to Unsorted.'))return;
 var affected=assets.filter(function(a){return a.collectionId===collection.id;});
 txRun(['assets','collections'],'readwrite',function(tx){var store=tx.objectStore('assets');affected.forEach(function(a){store.put(Object.assign({},a,{collectionId:'unsorted',updatedAt:Date.now()}));});return tx.objectStore('collections').delete(collection.id);})
 .then(function(){assets=assets.map(function(a){return a.collectionId===collection.id?Object.assign({},a,{collectionId:'unsorted'}):a;});collections=collections.filter(function(c){return c.id!==collection.id;});render();setStatus('Collection deleted. References moved to Unsorted.');})
 .catch(function(e){setStatus('Could not delete collection: '+e.message,true);});
}
function saveProfile(){
 var name=ui.profileName.value.trim().slice(0,60),description=ui.profileDescription.value.slice(0,500),prompt=ui.profilePrompt.value.slice(0,1200);
 if(!name||!prompt.trim())return setStatus('Profile name and reusable prompt guidance are required.',true);
 if(!selectedProfileId&&profiles.length>=100)return setStatus('Style profile limit reached (100).',true);
 if(profiles.some(function(p){return p.id!==selectedProfileId&&p.name.toLowerCase()===name.toLowerCase();}))return setStatus('A profile with that name already exists.',true);
 var old=profiles.filter(function(p){return p.id===selectedProfileId;})[0],record={id:old?old.id:uid(),name:name,description:description,prompt:prompt,createdAt:old?old.createdAt:Date.now(),updatedAt:Date.now()};
 put('profiles',record).then(function(){profiles=profiles.filter(function(p){return p.id!==record.id;});profiles.push(record);selectedProfileId=record.id;renderProfiles();setStatus('Style profile saved locally.');}).catch(function(e){setStatus('Could not save style profile: '+e.message,true);});
}
function deleteProfile(){
 if(!selectedProfileId)return;var p=profiles.filter(function(x){return x.id===selectedProfileId;})[0];if(!p||!g.confirm('Delete style profile '+p.name+'?'))return;
 txRun('profiles','readwrite',function(tx){return tx.objectStore('profiles').delete(p.id);}).then(function(){profiles=profiles.filter(function(x){return x.id!==p.id;});selectedProfileId='';renderProfiles();setStatus('Style profile deleted.');}).catch(function(e){setStatus('Could not delete profile: '+e.message,true);});
}
function copyProfile(){
 var p=profiles.filter(function(x){return x.id===selectedProfileId;})[0];if(!p)return;
 if(g.navigator&&g.navigator.clipboard&&g.navigator.clipboard.writeText)g.navigator.clipboard.writeText(p.prompt).then(function(){setStatus('Style guidance copied.');}).catch(function(){setStatus('Clipboard unavailable. Select the guidance and copy manually.',true);});
 else setStatus('Clipboard unavailable in this browser context.',true);
}
function analyzeText(asset){
 var target=app&&app.getCreativeAnalysisTarget?app.getCreativeAnalysisTarget():null;
 var destination=target?String(target.provider||'AI provider')+(target.model?' · '+target.model:''):'selected AI provider';
 if(!g.confirm('Send up to the first 12,000 characters of "'+asset.name+'" and its saved description/tags to '+destination+' for analysis? Nothing is sent unless you confirm.'))return;
 setStatus('Reading the selected text reference…');
 loadBlob(asset.id).then(function(record){if(!record||!record.blob)throw new Error('Local file data is missing.');return record.blob.slice(0,49152).text();})
 .then(function(content){if(!content.trim())throw new Error('The selected text reference is empty.');setStatus('Sending the confirmed text excerpt to your selected provider…');return app.analyzeCreativeText({name:asset.name,description:asset.description,tags:asset.tags,content:content.slice(0,MAX_ANALYSIS)});})
 .then(function(result){
  var current=assets.filter(function(a){return a.id===asset.id;})[0];
  if(!current)return setStatus('Reference was deleted before analysis finished; no result was saved.',true);
  var updated=mergeAsset(current,{analysis:String(result||'').slice(0,6000),updatedAt:Date.now()});
  return put('assets',updated).then(function(){assets=assets.map(function(a){return a.id===updated.id?updated:a;});render();setStatus('AI analysis saved locally.');});
 }).catch(function(e){setStatus('Analysis failed: '+(e.message||e),true);});
}
function open(appInstance){
 app=appInstance||app;root=document.getElementById('creativeLibraryRoot');if(!root)return Promise.reject(new Error('Creative Library panel is missing.'));
 if(!ui)buildUI();setStatus('Opening local Creative Library…');
 return openDb().then(ensureDefault).then(refresh).then(function(){setStatus(assets.length+' local reference(s) ready.');});
}
function suspend(){if(ui&&ui.detail){var video=ui.detail.querySelector('video');if(video){try{video.pause();}catch(ignore){}}}releasePreview();}
function close(){suspend();if(db){db.close();db=null;dbPromise=null;}}
g.addEventListener('pagehide',suspend);
g.CCCreativeLibrary=Object.freeze({open:open,suspend:suspend,close:close,test:Object.freeze({classifyFile:classifyFile,mimeFor:mimeFor,validateFile:validateFile,normalizeTags:normalizeTags,matchesAsset:matchesAsset,mergeAsset:mergeAsset,formatBytes:formatBytes,limits:LIMITS,maxAssets:MAX_ASSETS,maxImportBatch:MAX_BATCH,maxTextAnalysis:MAX_ANALYSIS})});
})(window);