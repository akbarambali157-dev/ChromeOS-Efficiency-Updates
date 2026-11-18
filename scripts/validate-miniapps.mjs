#!/usr/bin/env node
'use strict';

// Dependency-free repository contract checks for My Launcher 5.0.0.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const unique = (items) => new Set(items).size === items.length;

const local = json('new-tab-launcher/miniapps/registry.json').apps;
const remote = json('marketplace/catalogue/index.json').apps;
const manifest = json('new-tab-launcher/manifest.json');
const appsJs = read('new-tab-launcher/apps.js');
const frameJs = read('new-tab-launcher/app-frame.js');
const extendedJs = read('new-tab-launcher/miniapps/extended-apps.js');
const frameHtml = read('new-tab-launcher/app-frame.html');
const filesJs = read('new-tab-launcher/files.js');
const filesHtml = read('new-tab-launcher/files.html');
const readme = read('README.md');
const claudeHtml = read('new-tab-launcher/claude-app.html');
const claudeApp = read('new-tab-launcher/claude-app.js');
const claudeActivity = read('new-tab-launcher/claude-app-activity.js');
const claudeProviders = read('new-tab-launcher/claude-app-providers.js');
const claudeWorkspaces = read('new-tab-launcher/claude-app-workspaces.js');
const claudeVideo = read('new-tab-launcher/claude-app-video-studio.js');
const background = read('new-tab-launcher/background.js');

const localIds = local.map((app) => app.id);
const remoteIds = remote.map((app) => app.id);
const bundledIds = [...appsJs.matchAll(/'([a-z][a-z0-9-]+)':'1\.0\.0'/g)].map((m) => m[1]);
const frameIds = [...frameJs.matchAll(/'([a-z][a-z0-9-]+)':\{name:/g)].map((m) => m[1]);
const extendedIds = [...new Set([...extendedJs.matchAll(/id==='([a-z][a-z0-9-]+)'/g)].map((m) => m[1]))];

check(local.length === 40, `Local registry must contain 40 apps (found ${local.length}).`);
check(remote.length === 40, `Remote catalogue must contain 40 apps (found ${remote.length}).`);
check(unique(localIds), 'Local registry contains duplicate app IDs.');
check(unique(remoteIds), 'Remote catalogue contains duplicate app IDs.');
check(unique(bundledIds), 'Bundled install map contains duplicate app IDs.');
check(unique(frameIds), 'Runtime registry contains duplicate app IDs.');
check(localIds.every((id) => remoteIds.includes(id)) && remoteIds.every((id) => localIds.includes(id)), 'Local and remote catalogue IDs do not match.');
check(localIds.every((id) => bundledIds.includes(id)) && bundledIds.every((id) => localIds.includes(id)), 'Bundled install map does not exactly match the local registry.');
check(localIds.every((id) => frameIds.includes(id)) && frameIds.every((id) => localIds.includes(id)), 'Runtime registry does not exactly match the local registry.');

const baseRuntimeIds = new Set(['research-library','pdf-reader','citation-manager','focus-timer','markdown-editor','json-studio','quick-notes','mini-kanban','study-planner','flashcard-studio','advanced-calculator','colour-studio']);
const extendedSet = new Set(extendedIds);
for (const id of localIds) {
  check(baseRuntimeIds.has(id) || extendedSet.has(id), `No extended runtime handler found for ${id}.`);
}
for (const id of extendedIds) check(localIds.includes(id), `Extended runtime has an unregistered app: ${id}.`);

const localById = new Map(local.map((app) => [app.id, app]));
for (const app of remote) {
  const localApp = localById.get(app.id);
  check(Boolean(localApp), `Remote app has no local bundle: ${app.id}.`);
  if (!localApp) continue;
  check(app.version === localApp.version, `Version mismatch for ${app.id}.`);
  check(Array.isArray(app.network) && app.network.every((host) => typeof host === 'string' && host.length > 0), `Invalid network disclosure for ${app.id}.`);
  check(Array.isArray(localApp.network), `Local network declaration missing for ${app.id}.`);
  if (Array.isArray(localApp.network)) {
    check([...app.network].sort().join('|') === [...localApp.network].sort().join('|'), `Local/remote network disclosure mismatch for ${app.id}.`);
  }
  check(Number.isFinite(app.ramMb) && app.ramMb > 0 && app.ramMb <= 512, `Invalid RAM estimate for ${app.id}.`);
  check(typeof app.data === 'string' && app.data.length > 0, `Missing data-handling disclosure for ${app.id}.`);
}
check(manifest.manifest_version === 3, 'Extension must remain Manifest V3.');
check(/^\d+\.\d+\.\d+$/.test(manifest.version) && readme.includes('**Version ' + manifest.version + '**'), 'Manifest version must match the README release version.');
check(manifest.minimum_chrome_version === '103', 'Minimum Chrome version must remain 103.');
check(frameHtml.includes("default-src 'none'") && frameHtml.includes("connect-src 'none'") && frameHtml.includes("script-src 'self'"), 'Mini-app frame CSP has weakened or is missing.');
check(!/eval\s*\(|new Function\s*\(/.test(extendedJs), 'Extended mini-app runtime must not use eval or Function.');
check(!/f\.parent\.removeEntry\s*\(/.test(filesJs), 'Files page must never delete scanned source files.');
check(filesJs.includes('copyOne') && !filesJs.includes('moveOne'), 'Files page must use the copy-only flow.');
check(filesHtml.includes('Nothing is moved or deleted') && filesHtml.includes('originals stay in place'), 'Files page must clearly disclose non-destructive behaviour.');
check(readme.includes('leaves originals untouched'), 'README must describe the current copy-only Files behaviour.');


// 4.0 AI Development Workspace contract and syntax checks.
const workspaceScripts = ['claude-app-providers.js','claude-app-activity.js','claude-app-workspaces.js','claude-app-video-studio.js','claude-app.js'];
check(workspaceScripts.every((file) => claudeHtml.includes('src="' + file + '"')), 'AI workspace scripts must be loaded from the HTML.');
check(claudeHtml.indexOf('claude-app-providers.js') < claudeHtml.indexOf('claude-app-activity.js') && claudeHtml.indexOf('claude-app-activity.js') < claudeHtml.indexOf('claude-app-workspaces.js') && claudeHtml.indexOf('claude-app-workspaces.js') < claudeHtml.indexOf('claude-app-video-studio.js') && claudeHtml.indexOf('claude-app-video-studio.js') < claudeHtml.indexOf('claude-app.js'), 'Provider, activity and workspace modules must load before the app controller.');
for (const id of ['ccProvider','ccModel','openAIKeyIn','anthropicKeyIn','insertCode','teamTask','teamProvider','reviewProvider','workerProvider','researchQuery','ghRepo','ghCreateBranch','ghCreatePR','sbPAT','sbRunQuery','videoCanvas','videoExport','projectSel','newProject','projectManage','dlgProject','projectName','projectInstructions','projectSave','projectDelete','paneProject','projectWorkspace','projectTaskForm','projectTaskInput','projectTaskList','projectNotes','activityIndicator','activityTitle','activityDetail','activityTime']) {
  check(claudeHtml.includes('id="' + id + '"'), 'AI workspace control missing: ' + id + '.');
}
check(claudeProviders.includes('provider.openai') && claudeProviders.includes('provider.anthropic'), 'Provider abstraction must route direct OpenAI and Anthropic requests.');
check(background.includes('https://api.openai.com/v1/responses') && background.includes('https://api.anthropic.com/v1/messages'), 'Direct provider relays must use fixed HTTPS endpoints.');
check(background.includes('supabase.management') && background.includes('relaySupabaseManagement') && background.includes('read-only'), 'Supabase Management relay must be present and restricted to read-only SQL.');
check(claudeWorkspaces.includes('function createGithubBranch') && claudeWorkspaces.includes('function createGithubPR'), 'GitHub branch and pull-request workflows must exist.');
check(claudeVideo.includes('function exportWebm') && claudeVideo.includes('MediaRecorder'), 'Video Studio 4.5 export workflow must exist.');
check(claudeVideo.includes('Writers’ Room') && claudeVideo.includes('function runRoom') && claudeVideo.includes('claude-haiku-5-5'), 'Video Studio 4.5 Writers’ Room must include writer/reviewer/editor roles.');
check(claudeVideo.includes('function drawChar') && claudeVideo.includes('bobble') && claudeVideo.includes('storybook'), 'Video Studio 4.5 renderer must support its advertised 2D styles.');
check(!claudeVideo.toLowerCase().includes('roblox') && !claudeHtml.includes('value="roblox"'), 'Roblox mode must be removed from the Video Studio 4.5 UI and renderer.');
check(claudeApp.includes('function importLocalFiles') && claudeApp.includes('1048576') && claudeApp.includes('4194304'), 'Local file import must retain per-file and aggregate bounds.');
check(claudeApp.includes('ccProjectData') && claudeApp.includes('function loadProject') && claudeHtml.includes('id="projectSel"'), 'AI workspace must persist and switch isolated project files and conversations.');
check(claudeApp.includes('Project-specific instructions') && claudeApp.includes('instructions') && claudeApp.includes('function openProjectSettings'), 'Projects must support scoped instructions and project management.');
check(claudeWorkspaces.includes('function refreshProject') && claudeWorkspaces.includes('function addProjectTask') && claudeWorkspaces.includes('function saveProjectNotes'), 'Version 5.0 project dashboard must provide task and notes persistence.');
check(claudeApp.includes('Project notes') && claudeApp.includes('Project task list') && claudeWorkspaces.includes('flushProjectNotes'), 'Project notes and task list must be available to AI context and flush safely before project switches.');
check(claudeApp.includes('MAX_PROJECT_DATA_BYTES') && claudeApp.includes('4.3 * 1024 * 1024') && claudeApp.includes('projectDataBytes'), 'Project storage must remain bounded and report quota failures.');
check(claudeHtml.includes('id="contextManager"') && claudeHtml.includes('id="dlgContext"') && claudeHtml.includes('id="planMode"') && claudeApp.includes('getContextDetails') && claudeApp.includes('setFileAttached') && claudeApp.includes('PLAN MODE'), 'Version 5.0 context manager and plan mode must be present and wired.');
check(claudeActivity.includes('Taking a little longer to reason through this') && claudeActivity.includes('Still working through this') && claudeActivity.includes('function agent'), 'Activity indicator must expose truthful elapsed-time states and delegated-agent status.');
check(claudeWorkspaces.includes('Single-agent concurrency limit') && !claudeWorkspaces.slice(claudeWorkspaces.indexOf('function runTeam()'),claudeWorkspaces.indexOf('function extract(res)')).includes('Promise.all'), 'AI Team must keep a single delegated agent active at a time.');
check(!/eval\s*\(|new Function\s*\(/.test(claudeApp + claudeProviders + claudeWorkspaces + background), 'AI workspace code must not use eval or Function.');
for (const [name, source] of [['background.js',background],['claude-app.js',claudeApp],['claude-app-providers.js',claudeProviders],['claude-app-activity.js',claudeActivity],['claude-app-workspaces.js',claudeWorkspaces],['claude-app-video-studio.js',claudeVideo]]) {
  try { new Function(source); } catch (error) { failures.push(name + ' syntax error: ' + error.message); }
}

if (failures.length) {
  console.error('My Launcher validation FAILED:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exitCode = 1;
} else {
  console.log('My Launcher validation passed.');
  console.log(` - ${local.length} unique apps across local registry, remote catalogue, install map and runtime registry`);
  console.log(` - ${extendedIds.length} extended runtime handlers checked`);
  console.log(' - local/remote versions, network and data disclosures checked');
  console.log(' - MV3 / Chrome 103 / sandbox CSP / copy-only Files safety checked');
}
