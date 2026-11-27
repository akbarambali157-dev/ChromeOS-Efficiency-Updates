import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('new-tab-launcher/claude-app.html','utf8');
const css=fs.readFileSync('new-tab-launcher/claude-app.css','utf8');
const main=fs.readFileSync('new-tab-launcher/claude-app.js','utf8');
const script=fs.readFileSync('new-tab-launcher/claude-app-preview.js','utf8');
assert.match(html,/id="filePreviewToggle"[^>]*aria-pressed="false"/,'preview toggle needs a pressed state');
assert.match(html,/id="filePreview" class="file-preview" hidden/,'preview container must start hidden');
assert.match(html,/<script src="claude-app-preview\.js"><\/script>/,'preview module must be loaded');
assert.match(main,/claude-file-changed/,'file switching must notify the preview renderer');
assert.match(css,/file-preview\[hidden\].*display:none/,'hidden preview must not occupy layout');
assert.doesNotMatch(script,/\.innerHTML\s*=/,'preview must never use innerHTML');

class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.hidden=false;this.value='';this._text='';this.href='';this.target='';this.rel='';this.className='';this.tabIndex=0;this.listeners={};}
  appendChild(node){this.children.push(node);return node;}
  setAttribute(k,v){this.attributes[k]=String(v);}
  addEventListener(k,fn){this.listeners[k]=fn;}
  focus(){this.focused=true;}
  set textContent(v){this._text=String(v);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('');}
}
const nodes={filePreviewToggle:new Node('button'),editor:new Node('textarea'),filePreview:new Node('div'),tabName:new Node('span')};
const windowListeners={};const window={addEventListener(k,fn){windowListeners[k]=fn;}};
const document={getElementById(id){return nodes[id]||null;},createElement(tag){return new Node(tag);},createTextNode(text){const n=new Node('#text');n._text=String(text);return n;}};
vm.runInNewContext(script,{window,document});
const api=window.CCFilePreview;
assert.deepEqual(JSON.parse(JSON.stringify(api.parseCsv('name,notes\n"Ada, Lovelace","said ""hello"""\nsecond,line'))),[['name','notes'],['Ada, Lovelace','said "hello"'],['second','line']]);
api.render('readme.md','# Heading\nA **bold** note with `code`.\n\n- one\n- two\n\n[link](https://example.com)\n[unsafe](javascript:alert(1))');
assert.equal(nodes.filePreview.children[1].tagName,'h1');
assert.equal(nodes.filePreview.children[2].tagName,'p');
assert.equal(nodes.filePreview.children[3].tagName,'ul');
const links=[];function scan(node){if(node.tagName==='a')links.push(node);node.children.forEach(scan);}scan(nodes.filePreview);
assert.equal(links.length,1);assert.equal(links[0].href,'https://example.com');assert.equal(links[0].rel,'noopener noreferrer');
api.render('sheet.csv','col1,col2\n"A, B",2');assert.equal(nodes.filePreview.children[1].tagName,'table');assert.equal(nodes.filePreview.children[1].children[0].children[0].tagName,'th');
api.render('data.json','{"ok":true}');assert.match(nodes.filePreview.textContent,/"ok": true/);
const button=nodes.filePreviewToggle,editor=nodes.editor,preview=nodes.filePreview;
button.listeners.click();assert.equal(editor.hidden,true);assert.equal(preview.hidden,false);assert.equal(button.attributes['aria-pressed'],'true');assert.equal(button.textContent,'Edit');assert.equal(preview.focused,true);
button.listeners.click();assert.equal(editor.hidden,false);assert.equal(preview.hidden,true);assert.equal(button.attributes['aria-pressed'],'false');assert.equal(editor.focused,true);
editor.value='# Updated';windowListeners['claude-file-changed']({detail:{name:'updated.md',content:'# Updated'}});assert.equal(nodes.tabName.textContent,'updated.md');
console.log('File preview safety, Markdown, CSV/JSON rendering, bounds, toggle and file-change tests passed.');
