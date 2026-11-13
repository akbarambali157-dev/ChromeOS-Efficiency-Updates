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
'json-studio':{name:'JSON Studio',desc:'Format, minify and validate JSON locally.',network:false},
'quick-notes':{name:'Quick Notes',desc:'A private local scratchpad with autosave.',network:false},
'mini-kanban':{name:'Mini Kanban',desc:'A compact three-column personal task board.',network:false},
'study-planner':{name:'Study Planner',desc:'Plan study sessions by subject and date.',network:false},
'flashcard-studio':{name:'Flashcard Studio',desc:'Create and practise question-and-answer cards.',network:false},
'advanced-calculator':{name:'Advanced Calculator',desc:'Scientific calculations without an expression evaluator.',network:false},
'colour-studio':{name:'Colour Studio',desc:'Generate and copy colour harmonies.',network:false}
,'calendar-mini':{name:'Calendar Mini',desc:'Monthly events and deadlines stored offline.',network:false},
'habit-tracker':{name:'Habit Tracker',desc:'Track daily habits and completion history locally.',network:false},
'quiz-builder':{name:'Quiz Builder',desc:'Create multiple-choice quizzes and practise recall offline.',network:false},
'mind-map':{name:'Mind Map',desc:'Build a simple branching map of ideas and export JSON.',network:false},
'document-studio':{name:'Document Studio',desc:'Draft plain-text and Markdown documents with templates.',network:false},
'text-csv-viewer':{name:'Text & CSV Viewer',desc:'Preview local text and CSV files without uploading them.',network:false},
'file-toolkit':{name:'File Toolkit',desc:'Clean, sort and transform pasted text locally.',network:false},
'code-playground':{name:'Code Playground',desc:'Edit HTML and CSS with a sandboxed preview and a JavaScript scratchpad.',network:false},
'regex-tester':{name:'Regex Tester',desc:'Test regular expressions against bounded sample text.',network:false},
'csv-data-studio':{name:'CSV Data Studio',desc:'Filter and export small local CSV datasets.',network:false},
'diff-checker':{name:'Diff Checker',desc:'Compare two text versions line by line.',network:false},
'system-monitor':{name:'System Monitor',desc:'View browser-reported device capabilities and connection state.',network:false},
'storage-dashboard':{name:'Storage Dashboard',desc:'Estimate this app’s saved data and inspect browser storage quota.',network:false},
'unit-converter':{name:'Unit Converter',desc:'Convert common length, mass, temperature, volume and time units.',network:false},
'qr-studio':{name:'QR Studio',desc:'Save QR payloads offline and generate QR images with an optional online service.',network:true},
'image-studio':{name:'Image Studio',desc:'Adjust brightness and contrast on a local image and export PNG.',network:false},
'drawing-pad':{name:'Drawing Pad',desc:'Draw with touch or pointer and export a PNG.',network:false},
'diagram-maker':{name:'Diagram Maker',desc:'Create simple flow diagrams and export SVG.',network:false},
'svg-icon-studio':{name:'SVG Icon Studio',desc:'Create and export simple vector icons.',network:false},
'expense-tracker':{name:'Expense Tracker',desc:'Record expenses, view totals and export CSV.',network:false},
'reading-tracker':{name:'Reading Tracker',desc:'Track books by reading status.',network:false},
'bookmark-library':{name:'Bookmark Library',desc:'Save and organise HTTPS bookmarks locally.',network:false},
'daily-journal':{name:'Daily Journal',desc:'Write dated journal entries stored on this device.',network:false},
'audio-player':{name:'Audio Player',desc:'Play locally selected audio files.',network:false},
'video-library':{name:'Video Library',desc:'Play locally selected video files.',network:false},
'image-viewer':{name:'Image Viewer',desc:'Browse locally selected images.',network:false},
'text-to-speech':{name:'Text-to-Speech',desc:'Read text aloud using browser speech support.',network:false},
'accessibility-checker':{name:'Accessibility Checker',desc:'Run basic static checks on pasted HTML markup.',network:false}
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
if(window.MyLauncherMiniApps&&window.MyLauncherMiniApps({id:id,root:root,data:data,node:node,field:field,button:button,panel:panel,save:save,setStatus:setStatus,send:send}))return;
if(id==='json-studio'){
var p=panel(),src=field(p,'JSON input','textarea'),out=node('pre','');p.appendChild(out);var row=node('div',undefined,'actions');p.appendChild(row);
function run(mode){try{var value=JSON.parse(src.value);out.textContent=JSON.stringify(value,null,mode==='minify'?'':2);setStatus(mode==='validate'?'Valid JSON.':'Completed.');}catch(e){out.textContent='';setStatus('Invalid JSON: '+e.message,true);}}
button(row,'Format',function(){run('format');});button(row,'Minify',function(){run('minify');},true);button(row,'Validate',function(){try{JSON.parse(src.value);setStatus('Valid JSON.');}catch(e){setStatus('Invalid JSON: '+e.message,true);}},true);button(row,'Copy output',function(){if(!out.textContent)return setStatus('Nothing to copy.',true);if(navigator.clipboard)navigator.clipboard.writeText(out.textContent).then(function(){setStatus('Copied.');},function(){setStatus('Clipboard unavailable.',true);});else setStatus('Clipboard unavailable.',true);},true);src.value=data.text||'';src.addEventListener('input',function(){data.text=src.value;save();});return;
}
if(id==='focus-timer'){
var p=panel(),clock=node('div','25:00','timer');p.appendChild(clock);var minutes=field(p,'Duration in minutes (1–120)');minutes.type='number';minutes.min='1';minutes.max='120';minutes.value=String(data.minutes||25);var left=(Number.isFinite(data.remaining)?Math.max(0,data.remaining):Number(minutes.value)*60),timer=null,running=false;
function show(){clock.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');}
function stop(msg){if(timer)clearInterval(timer);timer=null;running=false;if(msg)setStatus(msg);data.remaining=left;save();}
button(p,'Start / Pause',function(){if(running){stop('Paused.');return;}running=true;setStatus('Timer running.');timer=setInterval(function(){left=Math.max(0,left-1);show();if(left%5===0){data.remaining=left;save();}if(!left)stop('Session complete.');},1000);});
button(p,'Reset',function(){stop();var n=Math.max(1,Math.min(120,Number(minutes.value)||25));left=n*60;data.minutes=n;show();save();setStatus('Reset.');},true);window.__miniSuspend=function(){if(running)stop('Paused while the app is minimised.');};
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
if(id==='quick-notes'){
var p=panel(),title=field(p,'Note title'),src=field(p,'Your note','textarea');title.maxLength=80;src.maxLength=12000;title.value=data.title||'';src.value=data.text||'';
title.addEventListener('input',function(){data.title=title.value;save();});src.addEventListener('input',function(){data.text=src.value;save();});button(p,'Load launcher quick note',function(){send('launcher.notes.get',{});},true);button(p,'Copy to launcher quick note',function(){send('launcher.notes.set',{text:src.value});});button(p,'Download note',function(){var a=document.createElement('a'),u=URL.createObjectURL(new Blob([('# '+(title.value||'Quick note')+'\n\n')+src.value],{type:'text/markdown'}));a.href=u;a.download='quick-note.md';a.click();setTimeout(function(){URL.revokeObjectURL(u);},1000);},true);return;
}
if(id==='mini-kanban'){
var p=panel(),name=field(p,'New task'),add=node('div',undefined,'actions');p.appendChild(add);var board=node('div');board.style.display='grid';board.style.gridTemplateColumns='repeat(auto-fit,minmax(150px,1fr))';board.style.gap='10px';p.appendChild(board);
function drawBoard(){board.textContent='';[['todo','To Do'],['doing','In Progress'],['done','Done']].forEach(function(col){var box=node('section',undefined,'panel'),h=node('strong',col[1]);box.appendChild(h);(data.items||[]).filter(function(x){return x.state===col[0];}).forEach(function(x){var row=node('div',undefined,'reference'),label=node('span',x.title);row.appendChild(label);var next=node('button',col[0]==='todo'?'→':col[0]==='doing'?'✓':'↺','secondary');next.title='Move task';next.addEventListener('click',function(){x.state=col[0]==='todo'?'doing':col[0]==='doing'?'done':'todo';save();drawBoard();});var share=node('button','Send to launcher tasks','secondary');share.addEventListener('click',function(){send('launcher.tasks.add',{title:x.title,due:''});});row.appendChild(share);var del=node('button','×','secondary');del.title='Delete task';del.addEventListener('click',function(){data.items=data.items.filter(function(y){return y.id!==x.id;});save();drawBoard();});row.appendChild(next);row.appendChild(del);box.appendChild(row);});board.appendChild(box);});}
button(add,'Add task',function(){var t=name.value.trim();if(!t)return setStatus('Enter a task.',true);data.items=(data.items||[]).slice(0,79).concat([{id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),title:t.slice(0,120),state:'todo'}]);name.value='';save();drawBoard();});drawBoard();return;
}
if(id==='study-planner'){
var p=panel(),subject=field(p,'Subject'),date=field(p,'Study date'),duration=field(p,'Duration (minutes)');date.type='date';duration.type='number';duration.min='5';duration.max='480';duration.value='30';var list=node('div');p.appendChild(list);
function drawSessions(){list.textContent='';(data.sessions||[]).slice().sort(function(a,b){return a.date.localeCompare(b.date);}).forEach(function(x){var row=node('div',undefined,'reference');row.appendChild(node('span',x.subject+' · '+x.date+' · '+x.minutes+' min'));var del=node('button','Remove','secondary');del.addEventListener('click',function(){data.sessions=data.sessions.filter(function(y){return y.id!==x.id;});save();drawSessions();});row.appendChild(del);list.appendChild(row);});}
button(p,'Add study session',function(){var s=subject.value.trim(),d=Number(duration.value);if(!s||!date.value)return setStatus('Add a subject and date.',true);if(!Number.isInteger(d)||d<5||d>480)return setStatus('Duration must be 5–480 minutes.',true);data.sessions=(data.sessions||[]).slice(-99).concat([{id:String(Date.now()),subject:s.slice(0,80),date:date.value,minutes:d}]);save();drawSessions();setStatus('Study session saved.');});drawSessions();return;
}
if(id==='flashcard-studio'){
var p=panel(),question=field(p,'Question','textarea'),answer=field(p,'Answer','textarea'),list=node('div');p.appendChild(list);var study=node('section',undefined,'panel');p.appendChild(study);var index=0,revealed=false;
function showCard(){study.textContent='';var cards=data.cards||[];if(!cards.length){study.appendChild(node('p','Create your first flashcard above.'));return;}if(index>=cards.length)index=0;study.appendChild(node('p','Card '+(index+1)+' of '+cards.length,'muted'));study.appendChild(node('h2',cards[index].q));if(revealed)study.appendChild(node('p',cards[index].a));button(study,revealed?'Hide answer':'Reveal answer',function(){revealed=!revealed;showCard();});button(study,'Next card',function(){index=(index+1)%cards.length;revealed=false;showCard();},true);}
button(p,'Add flashcard',function(){var q=question.value.trim(),a=answer.value.trim();if(!q||!a)return setStatus('Both question and answer are required.',true);data.cards=(data.cards||[]).slice(-99).concat([{q:q.slice(0,500),a:a.slice(0,1000)}]);question.value='';answer.value='';save();showCard();setStatus('Flashcard saved.');});showCard();return;
}
if(id==='advanced-calculator'){
var p=panel(),x=field(p,'First value'),y=field(p,'Second value (for binary operations)'),op=field(p,'Operation','select'),out=node('pre','Result appears here.');x.type='number';y.type='number';[['add','Add'],['subtract','Subtract'],['multiply','Multiply'],['divide','Divide'],['power','Power'],['sqrt','Square root of first value'],['sin','Sine (degrees)'],['cos','Cosine (degrees)'],['tan','Tangent (degrees)'],['log10','Log base 10'],['ln','Natural logarithm']].forEach(function(v){var o=node('option',v[1]);o.value=v[0];op.appendChild(o);});p.appendChild(out);
button(p,'Calculate',function(){var a=Number(x.value),b=Number(y.value),v,mode=op.value;if(!x.value||!Number.isFinite(a))return setStatus('Enter a valid first value.',true);if(['add','subtract','multiply','divide','power'].indexOf(mode)>=0&&!y.value)return setStatus('Enter a second value.',true);if(mode==='add')v=a+b;else if(mode==='subtract')v=a-b;else if(mode==='multiply')v=a*b;else if(mode==='divide'){if(b===0)return setStatus('Cannot divide by zero.',true);v=a/b;}else if(mode==='power')v=Math.pow(a,b);else if(mode==='sqrt')v=Math.sqrt(a);else if(mode==='sin')v=Math.sin(a*Math.PI/180);else if(mode==='cos')v=Math.cos(a*Math.PI/180);else if(mode==='tan')v=Math.tan(a*Math.PI/180);else if(mode==='log10')v=Math.log10(a);else v=Math.log(a);if(!Number.isFinite(v))return setStatus('This operation has no finite real result for that input.',true);out.textContent=String(Number(v.toPrecision(12)));setStatus('Calculated locally.');});return;
}
if(id==='colour-studio'){
var p=panel(),input=field(p,'Base HEX colour'),out=node('div');p.appendChild(out);input.value=data.hex||'#7fd1b9';
function toRgb(hex){var h=hex.replace('#','');if(!/^[0-9a-fA-F]{6}$/.test(h))return null;return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function toHsl(rgb){var r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),h=0,s=0,l=(max+min)/2;if(max!==min){var d=max-min;s=l>.5?d/(2-max-min):d/(max+min);if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return[h*360,s*100,l*100];}
function toHex(hsl){var h=hsl[0]/360,s=hsl[1]/100,l=hsl[2]/100,r,g,b;if(s===0)r=g=b=l;else{var q=l<.5?l*(1+s):l+s-l*s,p2=2*l-q;function hue(p,q2,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q2-p)*6*t;if(t<1/2)return q2;if(t<2/3)return p+(q2-p)*(2/3-t)*6;return p;}r=hue(p2,q,h+1/3);g=hue(p2,q,h);b=hue(p2,q,h-1/3);}return '#'+[r,g,b].map(function(v){return Math.round(v*255).toString(16).padStart(2,'0');}).join('');}
function drawPalette(){var rgb=toRgb(input.value);out.textContent='';if(!rgb)return setStatus('Enter a six-digit HEX value such as #7fd1b9.',true);data.hex=input.value.toLowerCase();save();var hsl=toHsl(rgb);[['Base',0],['Analogous −30',-30],['Analogous +30',30],['Complement',180],['Triadic',120]].forEach(function(v){var hex=toHex([(hsl[0]+v[1]+360)%360,hsl[1],hsl[2]]),row=node('div',undefined,'reference'),sw=node('span',v[0]+' · '+hex);sw.style.display='flex';sw.style.alignItems='center';var chip=node('span');chip.style.cssText='display:inline-block;width:22px;height:22px;border-radius:6px;margin-right:9px;background:'+hex;sw.prepend(chip);row.appendChild(sw);button(row,'Copy',function(){if(navigator.clipboard)navigator.clipboard.writeText(hex).then(function(){setStatus(hex+' copied.');},function(){setStatus('Clipboard unavailable.',true);});},true);out.appendChild(row);});setStatus('Palette generated locally.');}
button(p,'Generate palette',drawPalette);drawPalette();return;
}
setStatus('This app is not available in this runtime.',true);
}
function receive(event){var m=event.data;if(event.source!==parent||!m||m.channel!=='my-launcher-miniapp'||m.nonce!==nonce||m.appId!==id)return;
if(m.type==='theme'){var t=m.payload||{};document.documentElement.style.setProperty('--bg',t.background||'#10151c');document.documentElement.style.setProperty('--panel',t.panel||'#19222d');document.documentElement.style.setProperty('--text',t.text||'#e8eef5');document.documentElement.style.setProperty('--muted',t.muted||'#a8b6c5');document.documentElement.style.setProperty('--accent',t.accent||'#83d6bd');document.documentElement.style.colorScheme=t.colorScheme==='light'?'light':'dark';var accentParts=(t.accent||'').match(/[0-9]+/g),accentLight=accentParts&&accentParts.length>=3?((+accentParts[0]*299+ +accentParts[1]*587+ +accentParts[2]*114)/1000>145):true;document.documentElement.style.setProperty('--button-text',accentLight?'#10231e':'#ffffff');document.documentElement.setAttribute('data-text-size',['small','normal','large'].indexOf(t.textSize)>=0?t.textSize:'normal');document.documentElement.setAttribute('data-density',t.density==='compact'?'compact':'comfortable');if(t.highContrast)document.documentElement.setAttribute('data-contrast','high');else document.documentElement.removeAttribute('data-contrast');if(t.reducedMotion)document.documentElement.setAttribute('data-motion','off');else document.documentElement.removeAttribute('data-motion');}
if(m.type==='storage.result'){data=m.payload&&m.payload.value&&typeof m.payload.value==='object'?m.payload.value:{};draw();}
if(m.type==='app.suspend'){if(typeof window.__miniSuspend==='function')window.__miniSuspend();}
if(m.type==='app.flush'){if(typeof window.__miniSuspend==='function')window.__miniSuspend();if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}send('storage.set',{value:data,flush:true});}
if(m.type==='launcher.notes.result'){var noteBox=root.querySelector('textarea');if(m.payload&&m.payload.error){setStatus(m.payload.error,true);}else if(noteBox){noteBox.value=m.payload.text||'';data.text=noteBox.value;save();setStatus('Loaded the launcher quick note into this app.');}}
if(m.type==='launcher.notes.saved'){setStatus(m.payload&&m.payload.ok?'Copied into the launcher quick note.':(m.payload.error||'Could not save launcher note.'),!(m.payload&&m.payload.ok));}
if(m.type==='launcher.tasks.added'){setStatus(m.payload&&m.payload.ok?'Added to the launcher task list.':(m.payload.error||'Could not add launcher task.'),!(m.payload&&m.payload.ok));}
if(m.type==='research.results'){var list=root.querySelector('.panel');if(!list)return;var box=list.querySelector('.research-results');if(!box){box=node('div',undefined,'research-results');list.appendChild(box);}box.textContent='';if(m.payload&&m.payload.error){setStatus(m.payload.error,true);return;}(m.payload.items||[]).forEach(function(w){var item=node('article',undefined,'result'),a=node('a',w.title);var link=null;try{link=new URL(w.url);}catch(e){}a.href=link&&link.protocol==='https:'?link.href:'#';a.target='_blank';a.rel='noopener noreferrer';item.appendChild(a);item.appendChild(node('p',(w.year||'Year unknown')+' · Open access'));box.appendChild(item);});setStatus((m.payload.items||[]).length+' open-access records found.');}
}
window.addEventListener('message',receive);
if(!registry[id]||!nonce||nonce.length<20){$('appTitle').textContent='App unavailable';setStatus('Invalid app launch context.',true);return;}
$('appTitle').textContent=registry[id].name;$('appDescription').textContent=registry[id].desc;$('offlineLabel').textContent=registry[id].network?'Offline mode · search needs internet':'Works offline';
send('app.ready',{});
})();