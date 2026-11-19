/* 5.0 activity UI: truthful elapsed-time states, no fake model introspection. */
(function(g){
  'use strict';
  var timer=null, started=0, base='Thinking', task='', agentName='', active=false, continuing=false;
  function $(id){return document.getElementById(id);}
  function elapsed(){return Math.max(0,Math.floor((Date.now()-started)/1000));}
  function render(){
    if(!active)return;
    var sec=elapsed(), label=continuing?'Finishing your response…':base;
    if(!continuing){if(sec>=30)label='Still working through this…';
    else if(sec>=15)label='Taking a little longer to reason through this…';
    else if(sec>=6)label='Reasoning through your request…';}
    if(agentName)label=agentName+' · '+label;
    var title=$('activityTitle'), detail=$('activityDetail'), time=$('activityTime'), box=$('activityIndicator');
    if(title)title.textContent=label;
    if(detail)detail.textContent=task||'';
    if(time)time.textContent=sec+'s';
    if(box){box.hidden=false;box.setAttribute('aria-live','polite');box.classList.toggle('continuing',continuing);}
  }
  function begin(title,detail){
    end();active=true;continuing=false;started=Date.now();base=title||'Thinking';task=detail||'';agentName='';
    render();timer=setInterval(render,1000);
  }
  function phase(title,detail){if(!active)begin(title,detail);else{base=title||base;task=detail||task;agentName='';continuing=/finishing your response/i.test(base);render();}}
  function agent(title,detail){if(!active)begin('Agent working',detail);continuing=false;agentName=title||'Agent';base='Working on delegated task';task=detail||'';render();}
  function end(){active=false;continuing=false;if(timer){clearInterval(timer);timer=null;}var box=$('activityIndicator');if(box){box.hidden=true;box.classList.remove('continuing');}agentName='';task='';}
  g.CCActivity={begin:begin,phase:phase,agent:agent,end:end,isActive:function(){return active;}};
})(window);