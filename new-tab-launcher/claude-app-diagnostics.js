/* Independent diagnostics for the Claude mini-app. Loaded before the main app so it remains usable if claude-app.js fails. */
(function(){
  'use strict';
  var errors=[];
  window.addEventListener('error',function(e){
    errors.push({type:'JavaScript error',message:e.message||'Unknown error',source:e.filename||'unknown source',line:e.lineno||0,column:e.colno||0});
  });
  window.addEventListener('unhandledrejection',function(e){
    var reason=e.reason;errors.push({type:'Unhandled promise rejection',message:String(reason&&reason.message||reason||'Unknown rejection'),source:'promise',line:0,column:0});
  });
  function $(id){return document.getElementById(id);}
  function check(name,ok,detail){return {name:name,ok:!!ok,detail:detail|| (ok?'Passed':'Failed')};}
  function run(){
    var results=[];
    results.push(check('Diagnostics tool loaded',!!window.CCWorkspaceDiagnostics,'Independent script is running.'));
    results.push(check('Main app script tag',!!document.querySelector('script[src="claude-app.js"]'),'claude-app.js is referenced by the page.'));
    results.push(check('Provider module',!!window.CCProviders||!!window.CCProvidersModule||!!window.CCProviders,'Provider module availability depends on its export.'));
    results.push(check('Workspace module',!!window.CCWorkspaces,'Workspace module export is available.'));
    var required=['paneFiles','paneChat','paneTeam','paneResearch','paneGitHub','paneSupabase','paneVideo','paneCreative','paneSet','editor','dlgSet','videoWorkspace','creativeWorkspace','teamWorkspace','researchWorkspace','githubWorkspace','supabaseWorkspace'];
    var missing=required.filter(function(id){return !$(id);});
    results.push(check('Required interface elements',missing.length===0,missing.length?('Missing IDs: '+missing.join(', ')):'All '+required.length+' required elements found.'));
    var nav=['paneFiles','paneChat','paneTeam','paneResearch','paneGitHub','paneSupabase','paneVideo','paneCreative','paneSet'];
    var navMissing=nav.filter(function(id){return !$(id)||!$(id).matches('button,a');});
    results.push(check('Navigation controls',navMissing.length===0,navMissing.length?('Missing or invalid controls: '+navMissing.join(', ')):'All navigation controls exist.'));
    results.push(check('Chrome extension storage API',!!(window.chrome&&chrome.storage&&chrome.storage.local),'chrome.storage.local is '+(window.chrome&&chrome.storage&&chrome.storage.local?'available':'unavailable')));
    results.push(check('Main app initialization',!!window.CCApp,'CCApp is created after the main app storage callback. If this is still pending, wait briefly and run diagnostics again.'));
    results.push(check('Captured runtime errors',errors.length===0,errors.length?errors.length+' error(s) captured since page load.':'No runtime errors captured.'));
    return results;
  }
  function report(results){
    var lines=['Claude Mini-App Diagnostics','Time: '+new Date().toLocaleString(),'','Checks:'];
    results.forEach(function(r){lines.push((r.ok?'PASS':'FAIL')+' — '+r.name+': '+r.detail);});
    if(errors.length){lines.push('','Captured errors:');errors.forEach(function(e){lines.push('- '+e.type+': '+e.message+' ('+e.source+':'+e.line+':'+e.column+')');});}
    lines.push('','This report does not include API keys or saved file contents.');
    return lines.join('\n');
  }
  function show(){
    var dialog=$('dlgDiagnostics'),out=$('diagOutput'),list=$('diagChecks');
    if(!dialog||!out||!list)return;
    list.textContent='';
    var results=run();
    results.forEach(function(r){var item=document.createElement('div');item.className='diag-item '+(r.ok?'ok':'bad');item.textContent=(r.ok?'✓ ':'✕ ')+r.name+' — '+r.detail;list.appendChild(item);});
    out.value=report(results);
    if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();else dialog.setAttribute('open','');
  }
  function copy(){
    var text=$('diagOutput').value;
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){$('diagCopyStatus').textContent='Report copied.';}).catch(function(){$('diagOutput').select();$('diagCopyStatus').textContent='Select the report and copy it manually.';});}
    else{$('diagOutput').select();$('diagCopyStatus').textContent='Select the report and copy it manually.';}
  }
  function init(){
    var btn=$('paneDiagnostics');
    if(btn)btn.addEventListener('click',show);
    if($('diagRun'))$('diagRun').addEventListener('click',show);
    if($('diagCopy'))$('diagCopy').addEventListener('click',copy);
    if($('diagReload'))$('diagReload').addEventListener('click',function(){location.reload();});
    if($('diagClose'))$('diagClose').addEventListener('click',function(){var d=$('dlgDiagnostics');if(d&&d.close)d.close();else d.removeAttribute('open');});
  }
  window.CCWorkspaceDiagnostics=Object.freeze({run:run,report:report,show:show,getErrors:function(){return errors.slice();}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();