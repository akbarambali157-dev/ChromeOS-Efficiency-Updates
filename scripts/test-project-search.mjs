import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../new-tab-launcher/claude-app-project-folders.js',import.meta.url),'utf8');
const box={window:{},TextEncoder};
vm.runInNewContext(source,box);
const api=box.window.CCProjectFolders;
assert.ok(api,'Project folder API must register');
assert.deepEqual(Array.from(api.validatePath('src/main.js')),['src','main.js']);
assert.deepEqual(Array.from(api.validatePath('docs/plan.md')),['docs','plan.md']);
for(const path of ['','../outside.js','src/../../outside.js','/etc/passwd','C:/private.txt','src\\\\secret.js','src//empty.js','.env','.env.local','keys/id_rsa','private/cert.pem','.git/config','node_modules/pkg/index.js','a/'.repeat(10)+'deep.js']){
  assert.throws(()=>api.validatePath(path),undefined,'Unsafe path should be rejected: '+path);
}
assert.equal(api.limits.maxFileBytes,1024*1024);
assert.equal(api.limits.maxFiles,300);
assert.equal(api.limits.maxDepth,8);
assert.equal(api.limits.maxResults,120);
assert.equal(api.limits.maxSearchBytes,12*1024*1024);
assert.equal(typeof api.proposeWrite,'function');
assert.equal(typeof api.applyProposal,'function');
assert.equal(typeof api.search,'function');
assert.equal(typeof api.read,'function');
assert.equal(typeof api.disconnect,'function');
assert.match(source,/STALE_PROPOSAL/);
assert.match(source,/createWritable\(\)/);
assert.match(source,/showDirectoryPicker/);
assert.match(source,/indexedDB\.open/);
assert.doesNotMatch(source,/chrome\.storage/);
assert.doesNotMatch(source,/removeEntry\s*\(/);
assert.doesNotMatch(source,/fetch\s*\(/);

// Run the actual search function against deterministic mock file reads.
const files=Array.from({length:15},(_,i)=>({path:'src/f'+i+'.txt'}));
let reads=0;
box.window.CCProjectFolders={list:async()=>files,read:async(_id,path)=>{reads++;return {content:'needle',size:900000};}};
const capped=await api.search('demo','needle',{});
assert.equal(capped.matches.length,13,'the 12 MiB scan budget should allow 13 × 900 KB');
assert.equal(capped.bytesRead,11700000);
assert.equal(capped.skippedFiles,1,'the next file is reported as skipped when it would exceed the budget');
assert.equal(capped.truncated,true,'budget-limited searches must be clearly marked incomplete');
assert.equal(reads,14,'search should stop after the first file that exceeds the budget');

// Stop reading after the result cap.
reads=0;
box.window.CCProjectFolders={list:async()=>files,read:async(_id,path)=>{reads++;return {content:'needle',size:10};}};
const resultLimited=await api.search('demo','needle',{maxResults:2});
assert.equal(resultLimited.matches.length,2);
assert.equal(reads,2);
assert.equal(resultLimited.truncated,true);
assert.equal(resultLimited.bytesRead,20);

// Unreadable files are skipped but the search is marked partial.
reads=0;
box.window.CCProjectFolders={list:async()=>[{path:'a.txt'},{path:'b.txt'}],read:async(_id,path)=>{reads++;if(path==='a.txt'){const e=new Error('too large');e.code='FILE_TOO_LARGE';throw e;}return {content:'needle',size:10};}};
const skipped=await api.search('demo','needle',{});
assert.equal(skipped.matches.length,1);
assert.equal(skipped.skippedFiles,1);
assert.equal(skipped.truncated,true);
assert.equal(skipped.bytesRead,10);

// Encoded text size is the fallback when File.size is not available.
box.window.CCProjectFolders={list:async()=>[{path:'fallback.txt'}],read:async()=>({content:'needle'})};
const fallback=await api.search('demo','needle',{});
assert.equal(fallback.bytesRead,6);

assert.throws(()=>api.search('demo','',{maxResults:3}),/Enter a search term/);
console.log('Project folder path, privacy, safety limits and bounded-search regression tests passed.');
