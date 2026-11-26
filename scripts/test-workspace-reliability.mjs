import assert from 'node:assert/strict';
import fs from 'node:fs';

const workspace=fs.readFileSync(new URL('../new-tab-launcher/claude-app-workspaces.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../new-tab-launcher/claude-app.html',import.meta.url),'utf8');
const init=workspace.slice(workspace.indexOf('function init()'),workspace.indexOf('g.CCWorkspaces='));
assert.ok(init.includes('if(initialized)return;'),'workspace init must be idempotent');
assert.ok(init.includes('if(!app){'),'workspace init must wait for the app controller');
assert.ok(init.includes("g.addEventListener('pagehide',saveProjectNotes)"),'project notes must flush on page exit');
assert.ok(workspace.includes("if(projectNotesTimer){clearTimeout(projectNotesTimer);projectNotesTimer=null;}"),'manual and exit flushes must cancel the debounce timer');

const htmlIds=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
const initSelectors=[...init.matchAll(/\$\(['"]([A-Za-z][\w-]*)['"]\)/g)].map(m=>m[1]);
const missing=[...new Set(initSelectors)].filter(id=>!htmlIds.has(id));
assert.deepEqual(missing,[],'all selectors referenced by workspace initialization must exist in its HTML');

for(const id of ['paneProject','projectTaskForm','projectNotes','paneTeam','paneResearch','paneGitHub','paneSupabase','paneVideo','paneCreative','paneRecreation','paneFiles','workspaceBack','runTeam','cancelTeam','teamTestLead','teamTestReviewer','teamTestWorker','runResearch','ghLoad','ghSearch','ghCreateBranch','ghCreatePR','sbBrowse','sbSave','sbPAT','sbListProjects','sbProjectDetails','sbRunQuery','sbFunctions','sbBuckets','sbLogs']) {
  assert.ok(init.includes("'"+id+"'"), 'Expected event control binding: '+id);
}
const projectNotes=workspace.slice(workspace.indexOf('function saveProjectNotes'),workspace.indexOf('function editorWorkspace'));
assert.match(projectNotes,/clearTimeout\(projectNotesTimer\)/);
assert.match(projectNotes,/updateProjectMeta\(\{notes:\$\('projectNotes'\)\.value\}/);
assert.match(workspace,/flushProjectNotes:saveProjectNotes/);
assert.match(workspace,/if\(previous==='creative'/);
assert.match(workspace,/if\(previous==='recreation'/);
console.log('Stage C workspace startup, selector wiring, idempotence and project-note flush contracts passed.');
