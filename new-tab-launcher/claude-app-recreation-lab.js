/* Lazy, local-first Recreation Lab. It sends only explicitly approved text metadata. */
(function(g){
'use strict';
var root=null,app=null,active=false,generation=0,refs=[],profiles=[],experiments=[],selectedId='',selectedRefs=[];
function el(tag,value,cls){var n=document.createElement(tag);if(value!==undefined&&value!==null)n.textContent=value;if(cls)n.className=cls;return n;}
function button(value,cls){var n=el('button',value,cls||'ghost');n.type='button';return n;}
function field(labelText,tag,placeholder){var wrap=el('label',undefined,'rl-field'),label=el('span',labelText),input=document.createElement(tag||'input');if(placeholder)input.placeholder=placeholder;input.className='workspace-input';wrap.appendChild(label);wrap.appendChild(input);return{wrap:wrap,input:input};}
function setStatus(message,bad){if(ui&&ui.status){ui.status.textContent=message||'';ui.status.className='rl-status'+(bad?' err':'');}}
var ui=null;
function criteriaList(value){return String(value||'').split(/\n|,/).map(function(x){return x.trim().slice(0,120);}).filter(Boolean).slice(0,8);}
function cleanReference(a){return{id:String(a.id||''),name:String(a.name||'').slice(0,120),type:String(a.type||'file').slice(0,20),description:String(a.description||'').slice(0,700),tags:Array.isArray(a.tags)?a.tags.slice(0,8).map(function(x){return String(x).slice(0,32);}):[],analysis:String(a.analysis||'').slice(0,1000)};}
function build(){
 root.textContent='';ui={};
 var shell=el('div',undefined,'rl-shell'),head=el('div',undefined,'rl-head'),intro=el('div');
 intro.appendChild(el('h2','Recreation Lab'));intro.appendChild(el('p','Run structured, repeatable creative experiments using your local references and style profiles.'));
 head.appendChild(intro);shell.appendChild(head);
 shell.appendChild(el('p','Provider requests contain only your brief, selected style guidance, reference names/types/descriptions/tags and saved text analysis. Original files, images, videos and PDFs remain on this device. Each AI run requires confirmation.','rl-privacy'));
 var saved=el('section',undefined,'rl-panel'),savedHead=el('div',undefined,'rl-panel-head');savedHead.appendChild(el('h3','Saved experiments'));ui.saved=document.createElement('select');ui.saved.className='workspace-input';ui.saved.setAttribute('aria-label','Load saved experiment');savedHead.appendChild(ui.saved);ui.delete=button('Delete','mini');savedHead.appendChild(ui.delete);saved.appendChild(savedHead);shell.appendChild(saved);
 var form=el('section',undefined,'rl-panel');form.appendChild(el('h3','Design an experiment'));
 var title=field('Experiment name','input','e.g. Editorial poster recreation'),brief=field('Creative brief','textarea','What are you trying to recreate, explore or improve?'),profile=field('Style profile','select'),criteria=field('Comparison criteria (one per line)','textarea','e.g. clarity\nvisual hierarchy\nvoice consistency\naccessibility');
 title.input.maxLength=100;brief.input.maxLength=3000;brief.input.rows=4;criteria.input.maxLength=1200;criteria.input.rows=4;ui.title=title.input;ui.brief=brief.input;ui.profile=profile.input;ui.criteria=criteria.input;
 form.appendChild(title.wrap);form.appendChild(brief.wrap);form.appendChild(profile.wrap);form.appendChild(criteria.wrap);
 var refPanel=el('div',undefined,'rl-ref-panel');refPanel.appendChild(el('h4','Choose up to five references'));ui.refs=el('div',undefined,'rl-ref-list');refPanel.appendChild(ui.refs);form.appendChild(refPanel);
 var actions=el('div',undefined,'rl-actions');ui.generate=button('Generate experiment plan','primary');ui.save=button('Save experiment','ghost');actions.appendChild(ui.generate);actions.appendChild(ui.save);form.appendChild(actions);shell.appendChild(form);
 var results=el('section',undefined,'rl-panel');results.appendChild(el('h3','Experiment workspace'));
 var columns=el('div',undefined,'rl-columns'),plan=el('div',undefined,'rl-result-card'),notes=el('div',undefined,'rl-result-card');
 plan.appendChild(el('h4','AI experiment plan'));ui.output=el('pre','Your generated plan will appear here.','rl-output');plan.appendChild(ui.output);
 var resultNotes=field('Your result / observations','textarea','Record what you created or observed…'),comparison=field('Comparison and decision notes','textarea','Compare the result against your chosen criteria…');
 resultNotes.input.rows=5;comparison.input.rows=5;resultNotes.input.maxLength=4000;comparison.input.maxLength=4000;ui.resultNotes=resultNotes.input;ui.comparison=comparison.input;
 notes.appendChild(resultNotes.wrap);notes.appendChild(comparison.wrap);columns.appendChild(plan);columns.appendChild(notes);results.appendChild(columns);shell.appendChild(results);
 ui.status=el('div','','rl-status');ui.status.setAttribute('role','status');ui.status.setAttribute('aria-live','polite');shell.appendChild(ui.status);root.appendChild(shell);
 ui.saved.addEventListener('change',function(){loadExperiment(ui.saved.value);});
 ui.delete.addEventListener('click',deleteExperiment);ui.generate.addEventListener('click',generate);ui.save.addEventListener('click',saveCurrent);
}
function renderReferences(){
 ui.refs.textContent='';
 if(!refs.length){ui.refs.appendChild(el('p','No references yet. Import images, videos, text or PDFs in Creative Library first.','rl-empty'));return;}
 refs.forEach(function(ref){
  var label=el('label',undefined,'rl-ref'),check=document.createElement('input');check.type='checkbox';check.value=ref.id;check.checked=selectedRefs.indexOf(ref.id)>=0;check.disabled=!check.checked&&selectedRefs.length>=5;
  check.addEventListener('change',function(){if(check.checked){if(selectedRefs.length>=5){check.checked=false;return setStatus('Choose no more than five references.',true);}selectedRefs.push(ref.id);}else selectedRefs=selectedRefs.filter(function(id){return id!==ref.id;});renderReferences();});
  var body=el('span',undefined,'rl-ref-copy');body.appendChild(el('strong',ref.name));body.appendChild(el('small',ref.type.toUpperCase()+' · '+(ref.description||'No description yet')+(ref.tags.length?' · '+ref.tags.join(', '):'')));
  label.appendChild(check);label.appendChild(body);ui.refs.appendChild(label);
 });
}
function renderProfiles(selected){
 ui.profile.textContent='';var blank=el('option','No style profile');blank.value='';ui.profile.appendChild(blank);
 profiles.forEach(function(p){var o=el('option',p.name);o.value=p.id;ui.profile.appendChild(o);});ui.profile.value=selected||'';
}
function renderSaved(){
 var keep=ui.saved.value;ui.saved.textContent='';var blank=el('option','New experiment');blank.value='';ui.saved.appendChild(blank);
 experiments.slice().sort(function(a,b){return(b.updatedAt||0)-(a.updatedAt||0);}).forEach(function(x){var o=el('option',x.title||'Untitled experiment');o.value=x.id;ui.saved.appendChild(o);});
 ui.saved.value=experiments.some(function(x){return x.id===keep;})?keep:'';
 ui.delete.disabled=!ui.saved.value;
}
function refresh(){
 var run=++generation;
 return g.CCCreativeLibrary.openCatalog().then(function(catalog){
  if(!active||run!==generation)return;
  refs=(catalog.references||[]).map(cleanReference).slice(0,500);profiles=(catalog.profiles||[]).slice(0,100);experiments=(catalog.experiments||[]).slice(0,100);
  selectedRefs=selectedRefs.filter(function(id){return refs.some(function(r){return r.id===id;});});
  renderProfiles(ui.profile.value);renderReferences();renderSaved();
 });
}
function currentRecord(){
 var selected=refs.filter(function(r){return selectedRefs.indexOf(r.id)>=0;}).map(cleanReference);
 var profile=profiles.filter(function(p){return p.id===ui.profile.value;})[0]||null;
 var old=experiments.filter(function(x){return x.id===selectedId;})[0]||null;
 return{id:old?old.id:uid(),title:ui.title.value.trim().slice(0,100)||'Untitled experiment',brief:ui.brief.value.slice(0,3000),profileId:profile?profile.id:'',profileName:profile?String(profile.name||'').slice(0,60):'',profilePrompt:profile?String(profile.prompt||'').slice(0,1200):'',referenceIds:selected.map(function(r){return r.id;}),references:selected,criteria:criteriaList(ui.criteria.value),generatedPlan:ui.output.textContent.slice(0,16000),resultNotes:ui.resultNotes.value.slice(0,4000),comparisonNotes:ui.comparison.value.slice(0,4000),createdAt:old?old.createdAt:Date.now(),updatedAt:Date.now()};
}
function saveCurrent(){
 if(!ui.title.value.trim()&&!ui.brief.value.trim())return setStatus('Give the experiment a name or brief before saving.',true);
 var record=currentRecord();setStatus('Saving experiment locally…');
 g.CCCreativeLibrary.saveExperiment(record).then(function(saved){selectedId=saved.id;return refresh();}).then(function(){ui.saved.value=selectedId;setStatus('Experiment saved on this device.');}).catch(function(e){setStatus('Could not save experiment: '+(e.message||e),true);});
}
function loadExperiment(id){
 var record=experiments.filter(function(x){return x.id===id;})[0];if(!record){selectedId='';ui.delete.disabled=true;ui.output.textContent='Your generated plan will appear here.';ui.resultNotes.value='';ui.comparison.value='';return;}
 selectedId=record.id;ui.title.value=record.title||'';ui.brief.value=record.brief||'';ui.criteria.value=(record.criteria||[]).join('\n');ui.output.textContent=record.generatedPlan||'No plan has been generated yet.';ui.resultNotes.value=record.resultNotes||'';ui.comparison.value=record.comparisonNotes||'';
 selectedRefs=(record.referenceIds||[]).filter(function(refId){return refs.some(function(r){return r.id===refId;});});renderProfiles(record.profileId||'');renderReferences();ui.delete.disabled=false;setStatus('Loaded saved experiment.');
}
function deleteExperiment(){
 var id=ui.saved.value;if(!id)return;var record=experiments.filter(function(x){return x.id===id;})[0];if(!record||!g.confirm('Delete saved experiment "'+record.title+'"?'))return;
 g.CCCreativeLibrary.deleteExperiment(id).then(function(){experiments=experiments.filter(function(x){return x.id!==id;});selectedId='';ui.saved.value='';renderSaved();setStatus('Experiment deleted from this device.');}).catch(function(e){setStatus('Could not delete experiment: '+e.message,true);});
}
function generate(){
 if(!app||!app.runCreativeExperiment)return setStatus('AI experiment generation is unavailable. Check the workspace provider setup.',true);
 var brief=ui.brief.value.trim();if(!brief)return setStatus('Enter a creative brief first.',true);
 var refsSelected=refs.filter(function(r){return selectedRefs.indexOf(r.id)>=0;}).map(cleanReference);
 if(!refsSelected.length)return setStatus('Choose at least one reference from your Creative Library.',true);
 var profile=profiles.filter(function(p){return p.id===ui.profile.value;})[0]||null,criteria=criteriaList(ui.criteria.value);
 var target=app.getCreativeAnalysisTarget?app.getCreativeAnalysisTarget():{},destination=String(target.provider||'selected provider')+(target.model?' · '+target.model:'');
 var disclosure='This request sends only your brief, '+(profile?'the selected style profile guidance, ':'')+'reference names, file types, descriptions, tags and saved text analysis, and comparison criteria to '+destination+'. No original image, video, PDF or other file contents are uploaded.';
 if(!g.confirm(disclosure+' Continue?'))return;
 var request={title:ui.title.value.trim().slice(0,100),brief:brief,profile:profile?{name:profile.name,prompt:profile.prompt,description:profile.description}:null,references:refsSelected,criteria:criteria};
 ui.generate.disabled=true;ui.save.disabled=true;setStatus('Preparing a structured experiment…');var run=++generation;
 app.runCreativeExperiment(request).then(function(answer){
  if(!active||run!==generation)return;
  ui.output.textContent=String(answer||'').slice(0,16000)||'The provider returned an empty experiment plan.';
  var record=currentRecord();record.generatedPlan=ui.output.textContent;
  return g.CCCreativeLibrary.saveExperiment(record).then(function(saved){selectedId=saved.id;return refresh();}).then(function(){ui.saved.value=selectedId;ui.generate.disabled=false;ui.save.disabled=false;setStatus('Experiment plan generated and saved locally. Add your result and comparison notes, then save again.');});
 }).catch(function(e){if(active&&run===generation)setStatus('Experiment generation failed: '+(e.message||e),true);}).then(function(){if(active&&run===generation){ui.generate.disabled=false;ui.save.disabled=false;}});
}
function open(appInstance){
 app=appInstance||app;root=document.getElementById('recreationLabRoot');if(!root)return Promise.reject(new Error('Recreation Lab panel is missing.'));
 active=true;if(!ui)build();ui.generate.disabled=false;ui.save.disabled=false;setStatus('Loading local references and experiments…');
 return refresh().then(function(){if(active)setStatus(refs.length+' references and '+experiments.length+' saved experiments ready.');});
}
function suspend(){active=false;generation++;}
g.CCRecreationLab=Object.freeze({open:open,suspend:suspend,test:Object.freeze({criteriaList:criteriaList,cleanReference:cleanReference,maxReferences:5,maxCriteria:8})});
})(window);
