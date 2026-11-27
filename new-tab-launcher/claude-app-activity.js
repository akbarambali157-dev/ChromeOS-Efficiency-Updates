/* Ida activity centerpiece — honest task status, elapsed time, accessible detail toggle. */
(function(g){
  'use strict';
  var timer=null, started=0, base='Thinking', task='', agentName='', active=false, continuing=false, detailOpen=false;
  function $(id){return document.getElementById(id);}
  function elapsed(){return Math.max(0,Math.floor((Date.now()-started)/1000));}
  function fmt(sec){return sec<60?sec+'s':Math.floor(sec/60)+'m '+(sec%60)+'s';}
  function render(){
    if(!active)return;
    var sec=elapsed(), label=continuing?'Finishing your response…':base;
    if(!continuing){if(sec>=30)label='Still working through this…';else if(sec>=15)label='Taking a little longer to reason through this…';else if(sec>=6)label='Working through your request…'; }
    if(agentName)label=agentName+' · '+label;
    var title=$('activityTitle'),detail=$('activityDetail'),time=$('activityTime'),box=$('activityIndicator'),panel=$('activityDetails'),toggle=$('activityExpand'),taskLine=$('activityTaskDetail'),stateLine=$('activityStateDetail'),elapsedLine=$('activityElapsedDetail');
    if(title)title.textContent=label;
    if(detail)detail.textContent=task||'';
    if(time)time.textContent=fmt(sec);
    if(taskLine)taskLine.textContent=task||'No task description supplied.';
    if(stateLine)stateLine.textContent=label;
    if(elapsedLine)elapsedLine.textContent=fmt(sec);
    if(box){box.hidden=false;box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.classList.toggle('continuing',continuing);box.classList.toggle('agent-active',!!agentName);}
    if(panel)panel.hidden=!detailOpen;
    if(toggle){toggle.hidden=false;toggle.setAttribute('aria-expanded',detailOpen?'true':'false');toggle.textContent=detailOpen?'Hide details':'Details';}
  }
  document.addEventListener('DOMContentLoaded',function(){var expandButton=$('activityExpand');if(expandButton)expandButton.addEventListener('click',toggleDetails);});
  function startTimer(){if(timer||!active||document.hidden)return;timer=setInterval(render,1000);}
  function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
  function begin(title,detail){end();active=true;continuing=false;started=Date.now();base=title||'Thinking';task=detail||'';agentName='';detailOpen=false;render();startTimer();}
  function phase(title,detail){if(!active)begin(title,detail);else{base=title||base;task=detail||task;agentName='';continuing=/finishing your response/i.test(base);render();}}
  function agent(title,detail){if(!active)begin('Agent working',detail);continuing=false;agentName=title||'Agent';base='Working on delegated task';task=detail||'';render();}
  function end(){active=false;continuing=false;detailOpen=false;stopTimer();var box=$('activityIndicator'),panel=$('activityDetails'),toggle=$('activityExpand');if(box){box.hidden=true;box.classList.remove('continuing','agent-active');}if(panel)panel.hidden=true;if(toggle){toggle.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Details';}agentName='';task='';}
  function toggleDetails(){if(!active)return;detailOpen=!detailOpen;render();}
  document.addEventListener('visibilitychange',function(){if(document.hidden)stopTimer();else if(active){render();startTimer();}});
  g.CCActivity={begin:begin,phase:phase,agent:agent,end:end,isActive:function(){return active;},toggleDetails:toggleDetails};
})(window);
