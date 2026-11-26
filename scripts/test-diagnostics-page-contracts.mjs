import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root='new-tab-launcher';
const inventory={
  'newtab.html':['homeView','searchForm','workspaceSelect','grid','taskForm','taskList','orbFab','bkExport'],
  'apps.html':['appSearch','appCategory','installedCount','appGrid','appPanel','appContent'],
  'github.html':['repoLink','csList','csStatus','prList','prStatus','cmList','cmStatus','bdList','bdStatus','connect','tok','saveTok','rmTok'],
  'drive.html':[],
  'brewkeg.html':[],
  'sessions.html':['pickDir','pickFiles','status','stats','sN','sIO','sC','list','clear'],
  'memory.html':['gauge','memSum','bySite','tabList','refresh','suspendAll','mStatus'],
  'files.html':['pick','reconnect','scanBtn','fStatus','results','stFiles','stSize','stClean','types','groups','moveBtn','selInfo'],
  'claude-app.html':['paneChat','paneTeam','paneResearch','paneGitHub','paneSupabase','paneVideo','paneCreative','paneRecreation','editor','chatForm','chatIn'],
  'popup.html':['gDark','pOpen','pStatus'],
  'app-workspace.html':['miniFrame','closeApp','workspaceName','workspaceNotice'],
  'diagnostics.html':['runChecks','copyReport','downloadReport','runStatus','checkList']
};
const errors=[];
function fail(message){errors.push(message);}
for(const [page,required] of Object.entries(inventory)){
  const full=path.join(root,page);
  assert.ok(fs.existsSync(full),`Inventory page missing: ${page}`);
  const html=fs.readFileSync(full,'utf8');
  const ids=[...html.matchAll(/\\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
  if(duplicates.length) fail(`${page}: duplicate static IDs: ${[...new Set(duplicates)].join(', ')}`);
  for(const id of required) if(!ids.includes(id)) fail(`${page}: required contract ID "${id}" missing`);
  for(const [,ref] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    if(!ref||/^(https?:|data:|mailto:|tel:|#|chrome:)/i.test(ref)) continue;
    const clean=ref.split(/[?#]/)[0];
    if(!clean)continue;
    const resolved=path.resolve(path.dirname(full),clean);
    if(!resolved.startsWith(path.resolve(root)+path.sep)) fail(`${page}: local asset escapes page root: ${ref}`);
    else if(!fs.existsSync(resolved)) fail(`${page}: referenced local asset missing: ${ref}`);
  }
}
const nav=fs.readFileSync(path.join(root,'nav.js'),'utf8');
for(const page of Object.keys(inventory)){
  if(!nav.includes(page)) fail(`Navigation inventory does not include ${page}`);
}
if(errors.length){
  console.error('Project Atlas page/selector contracts FAILED:');
  errors.forEach(e=>console.error(' - '+e));
  process.exitCode=1;
}else{
  console.log(`Project Atlas page/selector contracts passed (${Object.keys(inventory).length} pages, duplicate-ID scan, required selectors, local assets and navigation inventory).`);
}
