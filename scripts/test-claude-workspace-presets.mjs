import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('new-tab-launcher/claude-app.html','utf8');
const css=fs.readFileSync('new-tab-launcher/claude-app.css','utf8');
const main=fs.readFileSync('new-tab-launcher/claude-app.js','utf8');
const script=fs.readFileSync('new-tab-launcher/claude-app-presets.js','utf8');
assert.match(html,/id="ccWorkspacePreset"[^>]*aria-label="Workspace preset"/,'preset selector needs accessible name');
assert.match(html,/<script src="claude-app\.js"><\/script><script src="claude-app-presets\.js"><\/script>/,'presets must initialize after chat sizing handlers');
assert.match(main,/cc-workspace-preset-change/,'chat size manager must receive preset events');
assert.match(css,/\.workspace-preset:focus-visible/,'preset selector needs keyboard focus styling');
assert.match(css,/@media\(max-width:520px\)/,'preset selector must fit narrow displays');

const listeners={};const select={value:'custom',addEventListener(type,fn){listeners['select:'+type]=fn;}};
const gripListeners={};const grip={addEventListener(type,fn){gripListeners[type]=fn;}};
const events=[];const saved=[];
const window={innerHeight:720,dispatchEvent(event){events.push(event);return true;},addEventListener(type,fn){listeners['window:'+type]=fn;}};
const chrome={storage:{local:{get(keys,fn){fn({ccWorkspacePreset:'chat'});},set(obj){saved.push(obj);}}}};
const document={getElementById(id){return id==='ccWorkspacePreset'?select:id==='chatGrip'?grip:null;}};
class CustomEvent{constructor(type,options){this.type=type;this.detail=options.detail;}}
vm.runInNewContext(script,{window,document,chrome,CustomEvent});
assert.equal(select.value,'chat');assert.equal(events.length,1);assert.equal(events[0].detail.height,380,'saved Chat focus preset must apply');
select.value='code';listeners['select:change']();assert.equal(events.at(-1).detail.height,160);assert.equal(saved.at(-1).ccWorkspacePreset,'code');
select.value='balanced';listeners['select:change']();assert.equal(events.at(-1).detail.height,250);assert.equal(saved.at(-1).ccWorkspacePreset,'balanced');
gripListeners.pointerup();assert.equal(select.value,'custom');assert.equal(saved.at(-1).ccWorkspacePreset,'custom');
select.value='chat';listeners['select:change']();gripListeners.keydown({key:'ArrowDown'});assert.equal(select.value,'custom');assert.equal(saved.at(-1).ccWorkspacePreset,'custom');
console.log('Workspace preset persistence, apply, size bounds, manual-resize reset and accessible markup tests passed.');
