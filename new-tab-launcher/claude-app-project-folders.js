/* Project-scoped local folder foundation.
   Folder handles are stored in IndexedDB, separate from extension settings storage. Every operation
   resolves a relative path beneath the user-selected directory. Writes are staged
   and require a separate explicit apply call. */
(function (g) {
  'use strict';
  var DB_NAME='cc-project-folders', DB_VERSION=1, STORE='handles';
  var MAX_FILE_BYTES=1024*1024, MAX_FILES=300, MAX_DEPTH=8, MAX_RESULTS=120, MAX_SEARCH_BYTES=12*1024*1024;
  var SKIP_DIRS={'.git':1,'node_modules':1,'.next':1,'dist':1,'build':1,'coverage':1,'.cache':1};
  var SKIP_FILES={'.env':1,'.env.local':1,'.env.production':1,'id_rsa':1,'id_ed25519':1,'credentials':1,'secrets.json':1};
  var TEXT_EXT=/\.(txt|md|js|mjs|cjs|json|css|html|xml|ya?ml|py|sql|csv|ts|tsx|jsx|sh|toml|ini|log|svg)$/i;
  function fail(message, code){var e=new Error(message);e.code=code||'PROJECT_FOLDER_ERROR';throw e;}
  function openDb(){
    return new Promise(function(resolve,reject){
      if(!g.indexedDB)return reject(new Error('IndexedDB is unavailable in this browser context.'));
      var req=g.indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'projectId'});};
      req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error||new Error('Could not open folder-handle storage.'));};
    });
  }
  function dbOp(mode,fn){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,mode),store=tx.objectStore(STORE),value;
      try{value=fn(store);}catch(e){db.close();reject(e);return;}
      tx.oncomplete=function(){db.close();resolve(value&&value.result!==undefined?value.result:value);};
      tx.onerror=function(){var e=tx.error||new Error('Folder-handle storage failed.');db.close();reject(e);};
      tx.onabort=function(){var e=tx.error||new Error('Folder-handle storage was interrupted.');db.close();reject(e);};
    });});
  }
  function projectKey(id){if(typeof id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(id))fail('Invalid project identifier.','INVALID_PROJECT');return id;}
  function validatePath(path){
    if(typeof path!=='string'||!path||path.length>500||path.indexOf('\\')!==-1||path.charAt(0)==='/'||/^[a-zA-Z]:/.test(path))fail('Use a relative path inside the selected project folder.','INVALID_PATH');
    var parts=path.split('/');
    if(parts.length>MAX_DEPTH)fail('That path is nested too deeply.','PATH_DEPTH');
    parts.forEach(function(part){if(!part||part==='.'||part==='..'||part.length>120||/[<>:"|?*\u0000-\u001f]/.test(part))fail('The path contains an invalid segment.','INVALID_PATH');});
    if(parts.some(function(p){return SKIP_DIRS[p.toLowerCase()]||SKIP_FILES[p.toLowerCase()]||/^\.env(?:\.|$)/i.test(p)||/\.(pem|key|p12|pfx)$/i.test(p);}))fail('This path is excluded because it may contain secrets or generated dependencies.','PROTECTED_PATH');
    return parts;
  }
  function supportedFile(path){var name=path.split('/').pop();return TEXT_EXT.test(name)&&!SKIP_FILES[name.toLowerCase()]&&!/^\.env(?:\.|$)/i.test(name)&&!/\.(pem|key|p12|pfx)$/i.test(name);}
  function getHandle(id){return dbOp('readonly',function(s){return s.get(projectKey(id));}).then(function(row){if(!row||!row.handle)fail('No folder is connected to this project.','NO_FOLDER');return row.handle;});}
  function permission(handle,request){
    return Promise.resolve().then(function(){return handle.queryPermission({mode:'readwrite'});}).then(function(state){
      if(state==='granted')return true;
      if(!request)return false;
      return handle.requestPermission({mode:'readwrite'}).then(function(next){return next==='granted';});
    });
  }
  function requirePermission(handle,request){return permission(handle,request).then(function(ok){if(!ok)fail('Folder access is not currently granted. Reconnect or grant access from the project folder controls.','PERMISSION_REQUIRED');});}
  function resolveDir(root,parts,create){
    return parts.slice(0,-1).reduce(function(p,part){return p.then(function(dir){return dir.getDirectoryHandle(part,{create:!!create});});},Promise.resolve(root));
  }
  function readHandle(fileHandle){
    return fileHandle.getFile().then(function(file){
      if(file.size>MAX_FILE_BYTES)fail('File is larger than the 1 MiB safe-read limit.','FILE_TOO_LARGE');
      return file.text().then(function(content){if(content.indexOf('\u0000')!==-1)fail('Binary files are not read by the project tools.','BINARY_FILE');return {content:content,size:file.size,lastModified:file.lastModified};});
    });
  }
  function getFile(root,path,create){
    var parts=validatePath(path);
    if(!supportedFile(path))fail('Only supported text/code files can be read or edited.','UNSUPPORTED_FILE');
    return resolveDir(root,parts,create).then(function(dir){return dir.getFileHandle(parts[parts.length-1],{create:!!create});});
  }
  function walk(dir,prefix,depth,state,out){
    if(depth>MAX_DEPTH||state.count>=MAX_FILES)return Promise.resolve(out);
    var entries=[];
    return (async function(){
      for await (var pair of dir.entries()){
        if(state.count>=MAX_FILES)break;
        var name=pair[0],handle=pair[1],path=prefix?prefix+'/'+name:name;
        if(handle.kind==='directory'){
          if(SKIP_DIRS[name.toLowerCase()]||name.charAt(0)==='.')continue;
          await walk(handle,path,depth+1,state,out);
        }else if(handle.kind==='file'&&supportedFile(path)){
          state.count++;out.push({path:path,name:name,kind:'file'});
        }
      }
      return out;
    })();
  }
  function connect(projectId){
    projectId=projectKey(projectId);
    if(typeof g.showDirectoryPicker!=='function')return Promise.reject(new Error('Folder access is not supported in this browser. Use the existing file import option instead.'));
    /* Must be called directly from a user click; do not move this picker into a timer. */
    return g.showDirectoryPicker({id:'cc-project-folder',mode:'readwrite'}).then(function(handle){
      return requirePermission(handle,false).then(function(){
        return dbOp('readwrite',function(s){return s.put({projectId:projectId,handle:handle,connectedAt:Date.now(),name:handle.name||'Project folder'});}).then(function(){return {name:handle.name||'Project folder',permission:'granted'};});
      });
    });
  }
  function reconnect(projectId){
    return getHandle(projectId).then(function(handle){return requirePermission(handle,true).then(function(){return {name:handle.name||'Project folder',permission:'granted'};});});
  }
  function status(projectId){
    return getHandle(projectId).then(function(handle){return permission(handle,false).then(function(ok){return {connected:true,name:handle.name||'Project folder',permission:ok?'granted':'needs-access'};});})
      .catch(function(e){if(e.code==='NO_FOLDER')return {connected:false,permission:'not-connected'};throw e;});
  }
  function disconnect(projectId){return dbOp('readwrite',function(s){return s.delete(projectKey(projectId));});}
  function list(projectId){
    return getHandle(projectId).then(function(root){return requirePermission(root,false).then(function(){return walk(root,'',0,{count:0},[]);});});
  }
  function read(projectId,path){
    var parts=validatePath(path);
    return getHandle(projectId).then(function(root){return requirePermission(root,false).then(function(){return getFile(root,path,false).then(readHandle).then(function(file){return {path:parts.join('/'),content:file.content,size:file.size,lastModified:file.lastModified};});});});
  }
  function search(projectId,query,options){
    query=String(query||'').trim();if(!query||query.length>200)fail('Enter a search term of 1–200 characters.','INVALID_QUERY');
    options=options||{};var max=Math.min(MAX_RESULTS,Math.max(1,Number(options.maxResults)||40)),needle=query.toLowerCase(),bytesRead=0;
    return list(projectId).then(function(items){var matches=[];
      return items.reduce(function(p,item){return p.then(function(){if(matches.length>=max)return;return read(projectId,item.path).then(function(file){
        var lines=file.content.split(/\r?\n/);
        for(var i=0;i<lines.length&&matches.length<max;i++)if(lines[i].toLowerCase().indexOf(needle)!==-1)matches.push({path:item.path,line:i+1,excerpt:lines[i].slice(0,240)});
      }).catch(function(e){if(e.code!=='FILE_TOO_LARGE'&&e.code!=='BINARY_FILE'&&e.code!=='UNSUPPORTED_FILE')throw e;});});},Promise.resolve()).then(function(){return {query:query,matches:matches,truncated:matches.length>=max};});
    });
  }
  function proposeWrite(projectId,path,content){
    var parts=validatePath(path);content=String(content===undefined?'':content);
    if(new TextEncoder().encode(content).length>MAX_FILE_BYTES)fail('Proposed file exceeds the 1 MiB limit.','FILE_TOO_LARGE');
    if(content.indexOf('\u0000')!==-1)fail('Binary content cannot be written by this tool.','BINARY_FILE');
    if(!supportedFile(path))fail('Only supported text/code files can be proposed.','UNSUPPORTED_FILE');
    return getHandle(projectId).then(function(root){return requirePermission(root,false).then(function(){
      return resolveDir(root,parts,false).then(function(dir){return dir.getFileHandle(parts[parts.length-1]).then(function(fh){return readHandle(fh).then(function(existing){return {projectId:projectKey(projectId),path:parts.join('/'),before:existing.content,after:content,kind:'edit',createdAt:Date.now()};});});})
      .catch(function(e){if(e.name==='NotFoundError')return {projectId:projectKey(projectId),path:parts.join('/'),before:null,after:content,kind:'create',createdAt:Date.now()};throw e;});
    });});
  }
  function applyProposal(proposal){
    if(!proposal||!proposal.projectId||!proposal.path||typeof proposal.after!=='string')fail('Invalid file-change proposal.','INVALID_PROPOSAL');
    var parts=validatePath(proposal.path);if(new TextEncoder().encode(proposal.after).length>MAX_FILE_BYTES)fail('Proposed file exceeds the 1 MiB limit.','FILE_TOO_LARGE');
    return getHandle(proposal.projectId).then(function(root){return requirePermission(root,false).then(function(){
      return resolveDir(root,parts,proposal.kind==='create').then(function(dir){
        var name=parts[parts.length-1];
        function writeHandle(fh){return fh.createWritable().then(function(w){return w.write(proposal.after).then(function(){return w.close();}).catch(function(e){return w.abort().catch(function(){ }).then(function(){throw e;});});});}
        if(proposal.kind==='create'){
          return dir.getFileHandle(name).then(function(){fail('A file now exists at this path. Review the folder and create a new proposal.','STALE_PROPOSAL');})
            .catch(function(e){if(e.code==='STALE_PROPOSAL')throw e;if(e.name!=='NotFoundError')throw e;return dir.getFileHandle(name,{create:true}).then(writeHandle);});
        }
        return dir.getFileHandle(name).then(function(fh){return readHandle(fh).then(function(now){
          if(now.content!==proposal.before)fail('The file changed after this proposal was prepared. Re-read it and create a new proposal.','STALE_PROPOSAL');
          return writeHandle(fh);
        });});
      }).then(function(){return {applied:true,path:parts.join('/')};});
    });});
  }
  function createProjectFolder(projectId,name){
    projectId=projectKey(projectId);name=String(name||'').trim();
    if(!name||name.length>60||name==='.'||name==='..'||/[\\\\/:*?"<>|\\u0000-\\u001f]/.test(name))fail('Choose a folder name up to 60 characters without reserved path characters.','INVALID_FOLDER_NAME');
    if(typeof g.showDirectoryPicker!=='function')return Promise.reject(new Error('Folder access is not supported in this browser.'));
    return g.showDirectoryPicker({id:'cc-project-parent',mode:'readwrite'}).then(function(parent){
      return requirePermission(parent,false).then(function(){return parent.getDirectoryHandle(name,{create:true});}).then(function(handle){
        return dbOp('readwrite',function(s){return s.put({projectId:projectId,handle:handle,connectedAt:Date.now(),name:handle.name||name});})
          .then(function(){return {name:handle.name||name,permission:'granted'};});
      });
    });
  }
  var activeApp=null;
  function currentProjectId(){var p=activeApp&&activeApp.getProjectInfo?activeApp.getProjectInfo():null;return p&&p.id?String(p.id):'';}
  function setFolderStatus(message,error){var el=document.getElementById('projectFolderStatus');if(el){el.textContent=message||'';el.className='status'+(error?' err':'');}}
  function refreshUi(){
    var id=currentProjectId();if(!id)return Promise.resolve();
    return status(id).then(function(s){
      var connectBtn=document.getElementById('projectFolderConnect'),createBtn=document.getElementById('projectFolderCreate'),reconnectBtn=document.getElementById('projectFolderReconnect'),disconnectBtn=document.getElementById('projectFolderDisconnect');
      if(connectBtn)connectBtn.hidden=s.connected;
      if(createBtn)createBtn.hidden=s.connected;
      if(reconnectBtn)reconnectBtn.hidden=!s.connected||s.permission==='granted';
      if(disconnectBtn)disconnectBtn.hidden=!s.connected;
      if(s.connected){
        setFolderStatus(s.name+' · '+(s.permission==='granted'?'Access granted':'Reconnect to grant access'));
        if(s.permission==='granted')return list(id).then(function(items){setFolderStatus(s.name+' · Access granted · '+items.length+' supported files found');}).catch(function(e){setFolderStatus(s.name+' · '+e.message,true);});
      }else setFolderStatus('No folder connected. Choose an existing folder or create a project folder.');
    }).catch(function(e){setFolderStatus(e.message||'Could not check folder status.',true);});
  }
  function init(appRef){
    activeApp=appRef;
    var connectBtn=document.getElementById('projectFolderConnect'),createBtn=document.getElementById('projectFolderCreate'),reconnectBtn=document.getElementById('projectFolderReconnect'),disconnectBtn=document.getElementById('projectFolderDisconnect');
    if(connectBtn)connectBtn.addEventListener('click',function(){
      var id=currentProjectId();if(!id)return;
      connect(id).then(function(s){setFolderStatus(s.name+' connected.');return refreshUi();}).catch(function(e){setFolderStatus(e.message||'Folder connection failed.',true);});
    });
    if(createBtn)createBtn.addEventListener('click',function(){
      var id=currentProjectId();if(!id)return;var p=appRef.getProjectInfo(),name=g.prompt('Name for the new project folder',p.name||'Project');
      if(name===null)return;
      createProjectFolder(id,name).then(function(s){setFolderStatus(s.name+' created and connected.');return refreshUi();}).catch(function(e){setFolderStatus(e.message||'Could not create project folder.',true);});
    });
    if(reconnectBtn)reconnectBtn.addEventListener('click',function(){var id=currentProjectId();if(!id)return;reconnect(id).then(refreshUi).catch(function(e){setFolderStatus(e.message||'Could not reconnect folder.',true);});});
    if(disconnectBtn)disconnectBtn.addEventListener('click',function(){var id=currentProjectId();if(!id)return;if(!g.confirm('Disconnect this folder from the project? The folder and its contents will not be deleted.'))return;disconnect(id).then(refreshUi).catch(function(e){setFolderStatus(e.message||'Could not disconnect folder.',true);});});
    refreshUi();
  }
  function refresh(){return refreshUi();}
  g.CCProjectFolders={init:init,refresh:refresh,connect:connect,createProjectFolder:createProjectFolder,reconnect:reconnect,status:status,disconnect:disconnect,list:list,read:read,search:search,proposeWrite:proposeWrite,applyProposal:applyProposal,validatePath:validatePath,limits:{maxFileBytes:MAX_FILE_BYTES,maxFiles:MAX_FILES,maxDepth:MAX_DEPTH,maxResults:MAX_RESULTS,maxSearchBytes:MAX_SEARCH_BYTES}};
})(window);
