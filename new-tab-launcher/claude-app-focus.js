/* Lightweight, dependency-free focus mode for the Claude workspace. */
(function(){
  'use strict';
  var button=document.getElementById('ccFocusMode');
  if(!button||!document.body)return;
  var active=false;
  function setFocusMode(next){
    active=!!next;
    document.body.classList.toggle('cc-focus-mode',active);
    button.setAttribute('aria-pressed',active?'true':'false');
    button.setAttribute('aria-label',active?'Exit focus mode':'Enter focus mode');
    button.title=active?'Return to workspace':'Focus on chat';
    button.textContent=active?'Exit focus':'Focus';
    if(active){var input=document.getElementById('chatIn');if(input)input.focus();}
    else button.focus();
  }
  button.addEventListener('click',function(){setFocusMode(!active);});
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&active){event.preventDefault();setFocusMode(false);}
  });
})();
