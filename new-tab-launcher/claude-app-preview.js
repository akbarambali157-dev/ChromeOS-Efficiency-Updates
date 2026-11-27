/* Safe, bounded file preview. All rendered content is built with DOM nodes, never innerHTML. */
(function(){
  'use strict';
  var button=document.getElementById('filePreviewToggle');
  var editor=document.getElementById('editor');
  var preview=document.getElementById('filePreview');
  var tabName=document.getElementById('tabName');
  if(!button||!editor||!preview)return;
  var previewing=false,currentName='untitled',MAX_PREVIEW=60000,MAX_ROWS=100,MAX_COLS=20;
  function textNode(text){return document.createTextNode(String(text));}
  function appendText(parent,text){parent.appendChild(textNode(text));}
  function inline(parent,text){
    var re=/\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*|\x60[^`]+`|\*[^*]+\*/g,last=0,m;
    while((m=re.exec(text))){if(m.index>last)appendText(parent,text.slice(last,m.index));var token=m[0],node;
      if(token.charAt(0)==='['){var lm=token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);if(lm){node=document.createElement('a');node.textContent=lm[1];node.href=lm[2];node.target='_blank';node.rel='noopener noreferrer';parent.appendChild(node);}else appendText(parent,token);}
      else if(token.slice(0,2)==='**'){node=document.createElement('strong');node.textContent=token.slice(2,-2);parent.appendChild(node);}
      else if(token.charAt(0)==='`'){node=document.createElement('code');node.textContent=token.slice(1,-1);parent.appendChild(node);}
      else{node=document.createElement('em');node.textContent=token.slice(1,-1);parent.appendChild(node);}
      last=re.lastIndex;
    }
    if(last<text.length)appendText(parent,text.slice(last));
  }
  function markdown(root,content){
    var lines=content.split(/\r?\n/),i=0,list=null,listType='';
    function closeList(){list=null;listType='';}
    while(i<lines.length){var line=lines[i];if(!line.trim()){closeList();i++;continue;}
      if(/^\x60\x60\x60/.test(line)){closeList();var pre=document.createElement('pre'),code=document.createElement('code');i++;while(i<lines.length&&!/^\x60\x60\x60/.test(lines[i])){appendText(code,lines[i]+'\n');i++;}if(i<lines.length)i++;pre.appendChild(code);root.appendChild(pre);continue;}
      var h=line.match(/^(#{1,3})\s+(.+)$/);if(h){closeList();var head=document.createElement('h'+h[1].length);inline(head,h[2]);root.appendChild(head);i++;continue;}
      var q=line.match(/^>\s?(.*)$/);if(q){closeList();var quote=document.createElement('blockquote'),qp=document.createElement('p');inline(qp,q[1]);quote.appendChild(qp);root.appendChild(quote);i++;continue;}
      var item=line.match(/^\s*(?:([-*])|(\d+\.))\s+(.+)$/);if(item){var type=item[2]?'ol':'ul';if(!list||listType!==type){closeList();list=document.createElement(type);listType=type;root.appendChild(list);}var li=document.createElement('li');inline(li,item[3]);list.appendChild(li);i++;continue;}
      closeList();var parts=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^#{1,3}\s|^\x60\x60\x60|^>\s?|^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])){parts.push(lines[i]);i++;}var p=document.createElement('p');inline(p,parts.join(' '));root.appendChild(p);
    }
  }
  function parseCsv(text){var rows=[],row=[],field='',quoted=false,i=0;while(i<text.length&&rows.length<MAX_ROWS){var ch=text.charAt(i++);if(quoted){if(ch==='"'&&text.charAt(i)==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;}else if(ch==='"'&&field===''){quoted=true;}else if(ch===','){row.push(field);field='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text.charAt(i)==='\n')i++;row.push(field);field='';if(row.some(function(v){return v!=='';}))rows.push(row.slice(0,MAX_COLS));row=[];}else field+=ch;}if(field!==''||row.length){row.push(field);if(row.some(function(v){return v!=='';}))rows.push(row.slice(0,MAX_COLS));}return rows.slice(0,MAX_ROWS);}
  function csvPreview(root,content){var table=document.createElement('table'),rows=parseCsv(content),i,j;if(!rows.length){appendText(root,'No CSV rows to preview.');return;}for(i=0;i<rows.length;i++){var tr=document.createElement('tr');for(j=0;j<rows[i].length;j++){var cell=document.createElement(i===0?'th':'td');appendText(cell,rows[i][j]);tr.appendChild(cell);}table.appendChild(tr);}root.appendChild(table);if(content.length>MAX_PREVIEW||rows.length>=MAX_ROWS){var note=document.createElement('p');note.className='preview-note';note.textContent='Preview limited to '+MAX_ROWS+' rows and '+MAX_COLS+' columns; open in Edit to view the full file.';root.appendChild(note);}}
  function prePreview(root,content){var pre=document.createElement('pre');pre.textContent=content;root.appendChild(pre);}
  function render(name,content){preview.textContent='';var note=document.createElement('p');note.className='preview-note';note.textContent='Safe preview · '+name;preview.appendChild(note);if(content.length>MAX_PREVIEW){var limit=document.createElement('p');limit.className='preview-note';limit.textContent='Preview is limited to the first '+MAX_PREVIEW+' characters to protect performance.';preview.appendChild(limit);content=content.slice(0,MAX_PREVIEW);}var ext=(name.split('.').pop()||'').toLowerCase();if(ext==='csv'){csvPreview(preview,content);return;}if(ext==='json'){try{content=JSON.stringify(JSON.parse(content),null,2);}catch(e){}prePreview(preview,content);return;}if(ext==='md'||ext==='markdown'){markdown(preview,content);return;}prePreview(preview,content);}
  function refresh(){if(previewing)render(currentName,editor.value);}
  function setPreview(on){previewing=!!on;editor.hidden=previewing;preview.hidden=!previewing;button.setAttribute('aria-pressed',previewing?'true':'false');button.textContent=previewing?'Edit':'Preview';button.title=previewing?'Return to editor':'Preview the current file';button.setAttribute('aria-label',previewing?'Edit current file':'Preview current file');if(previewing){refresh();preview.tabIndex=0;preview.focus();}else editor.focus();}
  button.addEventListener('click',function(){setPreview(!previewing);});
  editor.addEventListener('input',refresh);
  window.addEventListener('claude-file-changed',function(event){currentName=(event.detail&&event.detail.name)||'untitled';if(tabName)tabName.textContent=currentName;refresh();});
  if(tabName)currentName=tabName.textContent||currentName;
  window.CCFilePreview={parseCsv:parseCsv,render:render};
})();
