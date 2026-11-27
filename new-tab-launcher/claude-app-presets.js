/* Workspace presets are small, reversible size profiles. */
(function(){
  'use strict';
  var select=document.getElementById('ccWorkspacePreset');
  if(!select||typeof window==='undefined'||typeof chrome==='undefined'||!chrome.storage||!chrome.storage.local)return;
  var sizes={balanced:250,code:160,chat:380};
  function setCustom(){select.value='custom';chrome.storage.local.set({ccWorkspacePreset:'custom'});}
  function applyPreset(value,save){
    var height=sizes[value];
    if(!height)return;
    var max=Math.max(180,window.innerHeight-170);
    height=Math.max(120,Math.min(max,height));
    window.dispatchEvent(new CustomEvent('cc-workspace-preset-change',{detail:{height:height}});
    if(save)chrome.storage.local.set({ccWorkspacePreset:value});
  }
  select.addEventListener('change',function(){
    if(select.value==='custom'){setCustom();return;}
    applyPreset(select.value,true);
  });
  var grip=document.getElementById('chatGrip');
  if(grip){
    grip.addEventListener('pointerup',setCustom);grip.addEventListener('pointercancel',setCustom);
    grip.addEventListener('keydown',function(event){if(event.key==='ArrowUp'||event.key==='ArrowDown')setCustom();});
  }
  chrome.storage.local.get(['ccWorkspacePreset'],function(data){
    var value=data&&data.ccWorkspacePreset;
    if(value==='balanced'||value==='code'||value==='chat'){select.value=value;applyPreset(value,false);}
    else select.value='custom';
  });
})();
