#!/usr/bin/env node
'use strict';

// Dependency-free repository contract checks for My Launcher 3.8.0.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
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

const localIds = local.map((app) => app.id);
const remoteIds = remote.map((app) => app.id);
const bundledIds = [...appsJs.matchAll(/'([a-z][a-z0-9-]+)':'1\.0\.0'/g)].map((m) => m[1]);
const frameIds = [...frameJs.matchAll(/^'([a-z][a-z0-9-]+)':\{name:/gm)].map((m) => m[1]);
const extendedIds = [...extendedJs.matchAll(/if\(id==='([a-z][a-z0-9-]+)'\)/g)].map((m) => m[1]);

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
check(manifest.version === '3.8.0', 'Manifest version must be 3.8.0.');
check(manifest.minimum_chrome_version === '103', 'Minimum Chrome version must remain 103.');
check(frameHtml.includes("default-src 'none'") && frameHtml.includes("connect-src 'none'") && frameHtml.includes("script-src 'self'"), 'Mini-app frame CSP has weakened or is missing.');
check(!/eval\s*\(|new Function\s*\(/.test(extendedJs), 'Extended mini-app runtime must not use eval or Function.');
check(!/f\.parent\.removeEntry\s*\(/.test(filesJs), 'Files page must never delete scanned source files.');
check(filesJs.includes('copyOne') && !filesJs.includes('moveOne'), 'Files page must use the copy-only flow.');
check(filesHtml.includes('Nothing is moved or deleted') && filesHtml.includes('originals stay in place'), 'Files page must clearly disclose non-destructive behaviour.');
check(readme.includes('leaves originals untouched'), 'README must describe the current copy-only Files behaviour.');

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
