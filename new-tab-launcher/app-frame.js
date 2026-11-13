(function(){
'use strict';
var params=new URLSearchParams(location.search),id=params.get('id'),nonce=params.get('nonce');
var $=function(x){return document.getElementById(x);},root=$('appRoot'),status=$('appStatus'),data={};
var registry={
'research-library':{name:'Research Library',desc:'Discover scholarly records. Fresh searches require an internet connection.',network:true},
'pdf-reader':{name:'PDF Reader',desc:'Read a PDF selected locally from your device.',network:false},
'citation-manager':{name:'Citation Manager',desc:'Build and save a small local bibliography.',network:false},
'focus-timer':{name:'Focus Timer',desc:'A lightweight focus timer that pauses when hidden.',network:false},
'markdown-editor':{name:'Markdown Editor',desc:'Write Markdown with a safe local preview and autosave.',network:false},
'json-studio':{name:'JSON Studio',desc:'Format, minify and validate JSON locally.',network:false}
};
function send(type,payload){parent.postMessage({channel:'my-launcher-miniapp',nonce:nonce,appId:id,type:type,payload:payload||{}},'*');}
function setStatus(s,bad){status.textContent=s;status.className='status'+(bad?' error':'');}
function node(tag,txt,cls){var n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n;}
function panel(){var p=node('section',undefined,'panel');root.appendChild(p);return p;}
function button(p,label,fn,secondary){var b=node('button',label,secondary?'secondary':'');b.type='button';b.addEventListener('click',fn);p.appendChild(b);return b;}
function field(p,label,tag){var w=node('div',undefined,'field'),l=node('label',label),i=document.createElement(tag||'input');i.id='f'+Math.random().toString(36).slice(2);l.htmlFor=i.id;w.appendChild(l);w.appendChild(i);p.appendChild(w);return i;}
var saveTimer=null;function save(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(function(){saveTimer=null;send('storage.set',{value:data});},250);}

function draw(){
root.textContent='';
if(id==='json-studio'){
var p=panel(),src=field(p,'JSON input','textarea'),out=node('pre','');p.appendChild(out);var row=node('div',undefined,'actions');p.appendChild(row);
function run(mode){try{var value=JSON.parse(src.value);out.textContent=JSON.stringify(value,null,mode==='minify'?'':2);setStatus(mode==='validate'?'Valid JSON.':'Completed.');}catch(e){out.textContent='';setStatus('Invalid JSON: '+e.message,true);}}
button(row,'Format',function(){run('format');});button(row,'Minify',function(){run('minify');},true);button(row,'Validate',function(){try{JSON.parse(src.value);setStatus('Valid JSON.');}catch(e){setStatus('Invalid JSON: '+e.message,true);}},true);button(row,'Copy output',function(){if(!out.textContent)return setStatus('Nothing to copy.',true);if(navigator.clipboard)navigator.clipboard.writeText(out.textContent).then(function(){setStatus('Copied.');},function(){setStatus('Clipboard unavailable.',true);});else setStatus('Clipboard unavailable.',true);},true);src.value=data.text||'';src.addEventListener('input',function(){data.text=src.value;save();});return;
}
if(id==='focus-timer'){
var p=panel(),clock=node('div','25:00','timer');p.appendChild(clock);var minutes=field(p,'Duration in minutes (1–120)');minutes.type='number';minutes.min='1';minutes.max='120';minutes.value=String(data.minutes||25);var left=(data.remaining||Number(minutes.value)*60),timer=null,running=false;
function show(){clock.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');}
function stop(msg){if(timer)clearInterval(timer);timer=null;running=false;if(msg)setStatus(msg);data.remaining=left;save();}
button(p,'Start / Pause',function(){if(running){stop('Paused.');return;}running=true;setStatus('Timer running.');timer=setInterval(function(){left=Math.max(0,left-1);show();if(left%5===0){data.remaining=left;save();}if(!left)stop('Session complete.');},1000);});
button(p,'Reset',function(){stop();var n=Math.max(1,Math.min(120,Number(minutes.value)||25));left=n*60;data.minutes=n;show();save();setStatus('Reset.');},true);
document.addEventListener('visibilitychange',function(){if(document.hidden&&running)stop('Paused while hidden.');});window.addEventListener('pagehide',function(){if(timer)clearInterval(timer);});show();return;
}
if(id==='markdown-editor'){
var p=panel(),src=field(p,'Markdown','textarea'),out=node('div',undefined,'preview');p.appendChild(out);
function preview(){var html='',list=false;src.value.split(/\r?\n/).forEach(function(line){var h=/^(#{1,3})\s+(.+)$/.exec(line),safe=line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');if(h){if(list){html+='</ul>';list=false;}html+='<h'+h[1].length+'>'+h[2].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</h'+h[1].length+'>';return;}if(/^\s*[-*]\s+/.test(line)){if(!list){html+='<ul>';list=true;}html+='<li>'+safe.replace(/^\s*[-*]\s+/, '')+'</li>';return;}if(list){html+='</ul>';list=false;}if(line.trim())html+='<p>'+safe+'</p>';});if(list)html+='</ul>';out.innerHTML=html;}
src.value=data.text||'';preview();src.addEventListener('input',function(){data.text=src.value;save();preview();});button(p,'Download Markdown',function(){var a=document.createElement('a'),u=URL.createObjectURL(new Blob([src.value],{type:'text/markdown'}));a.href=u;a.download='notes.md';a.click();setTimeout(function(){URL.revokeObjectURL(u);},1000);},true);return;
}
if(id==='citation-manager'){
var p=panel(),fields={};[['author','Author / organisation'],['year','Year'],['title','Title (required)'],['source','Journal / publisher'],['doi','DOI or URL']].forEach(function(x){fields[x[0]]=field(p,x[1]);});var list=node('div');p.appendChild(list);
function format(x){return(x.author||'Unknown author')+' ('+(x.year||'n.d.')+'). '+x.title+'. '+(x.source?x.source+'. ':'')+(x.doi||'');}
function render(){list.textContent='';(data.items||[]).slice().reverse().forEach(function(x){list.appendChild(node('p',format(x),'reference'));});}
button(p,'Save reference',function(){var x={};Object.keys(fields).forEach(function(k){x[k]=fields[k].value.trim().slice(0,240);});if(!x.title)return setStatus('A title is required.',true);data.items=(data.items||[]).slice(-199).concat([x]);save();render();setStatus('Reference saved locally.');});button(p,'Export references',function(){var a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(data.items||[],null,2)],{type:'application/json'}));a.href=u;a.download='references.json';a.click();setTimeout(function(){URL.revokeObjectURL(u);},1000);},true);render();return;
}
if(id==='pdf-reader'){
var p=panel(),f=field(p,'Choose PDF (maximum 40 MB)','input');f.type='file';f.accept='application/pdf,.pdf';var frame=node('iframe');frame.className='reader';frame.title='Selected PDF';frame.hidden=true;p.appendChild(frame);var url='';function release(){if(url)URL.revokeObjectURL(url);url='';frame.removeAttribute('src');}f.addEventListener('change',function(){release();var file=f.files&&f.files[0];if(!file)return;if(file.size>41943040)return setStatus('PDF exceeds 40 MB.',true);if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name))return setStatus('Choose a PDF file.',true);url=URL.createObjectURL(file);frame.src=url;frame.hidden=false;setStatus('Opened locally: '+file.name);});window.addEventListener('pagehide',release);return;
}
if(id==='research-library'){
var p=panel(),q=field(p,'Search open-access scholarly works'),results=node('div');p.appendChild(results);q.maxLength=180;button(p,'Search OpenAlex',function(){var term=q.value.trim();if(!term)return setStatus('Enter a search term.',true);results.textContent='Searching…';send('research.search',{query:term});});return;
}
setStatus('This app is not available in this runtime.',true);
}
function receive(event){var m=event.data;if(event.source!==parent||!m||m.channel!=='my-launcher-miniapp'||m.nonce!==nonce||m.appId!==id)return;
if(m.type==='theme'){var t=m.payload||{};document.documentElement.style.setProperty('--bg',t.background||'#10151c');document.documentElement.style.setProperty('--panel',t.panel||'#19222d');document.documentElement.style.setProperty('--text',t.text||'#e8eef5');document.documentElement.style.setProperty('--muted',t.muted||'#a8b6c5');document.documentElement.style.setProperty('--accent',t.accent||'#83d6bd');document.documentElement.style.colorScheme=t.colorScheme==='light'?'light':'dark';}
if(m.type==='storage.result'){data=m.payload&&m.payload.value&&typeof m.payload.value==='object'?m.payload.value:{};draw();}
if(m.type==='app.flush'){if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}send('storage.set',{value:data,flush:true});}
if(m.type==='research.results'){var list=root.querySelector('.panel');if(!list)return;var box=list.querySelector('.research-results');if(!box){box=node('div',undefined,'research-results');list.appendChild(box);}box.textContent='';if(m.payload&&m.payload.error){setStatus(m.payload.error,true);return;}(m.payload.items||[]).forEach(function(w){var item=node('article',undefined,'result'),a=node('a',w.title);var link=null;try{link=new URL(w.url);}catch(e){}a.href=link&&link.protocol==='https:'?link.href:'#';a.target='_blank';a.rel='noopener noreferrer';item.appendChild(a);item.appendChild(node('p',(w.year||'Year unknown')+' · Open access'));box.appendChild(item);});setStatus((m.payload.items||[]).length+' open-access records found.');}
}
window.addEventListener('message',receive);
if(!registry[id]||!nonce||nonce.length<20){$('appTitle').textContent='App unavailable';setStatus('Invalid app launch context.',true);return;}
$('appTitle').textContent=registry[id].name;$('appDescription').textContent=registry[id].desc;$('offlineLabel').textContent=registry[id].network?'Offline mode · search needs internet':'Works offline';
send('app.ready',{});
})();