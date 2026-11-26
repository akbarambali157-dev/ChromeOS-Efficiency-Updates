import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../new-tab-launcher/claude-app-project-folders.js',import.meta.url),'utf8');
const box={window:{}};
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
console.log('Project folder path, privacy and bounded-operation tests passed.');
