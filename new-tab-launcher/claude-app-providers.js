/* Provider routing and model-specific effort capabilities. */
(function (g) {
  'use strict';
  var MODELS = {
    brewkeg: ['claude-sonnet-5-5','claude-haiku-5-5','claude-opus-5-5','gpt-6-astra','gpt-6.1-sol','gpt-6.1-terra','gpt-6-luna'],
    openai: ['gpt-6-astra','gpt-6.1-sol','gpt-6.1-terra','gpt-6-luna'],
    anthropic: ['claude-sonnet-5-5','claude-haiku-5-5','claude-opus-5-5']
  };
  var EFFORTS = ['low','medium','high','xhigh','max'];
  var STORAGE = ['ccProvider','ccModel','ccKey','ccOpenAIKey','ccAnthropicKey','ccEffort','ccReasoningMode'];
  function readSettings() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(STORAGE, function (d) {
        var provider=d.ccProvider||'brewkeg',model=d.ccModel||'claude-sonnet-5-5';
        resolve({ provider: provider, model: model,
          effort: d.ccEffort || effortProfile(provider,model).defaultEffort || 'medium', reasoningMode: d.ccReasoningMode || 'standard',
          keys: { brewkeg: d.ccKey || '', openai: d.ccOpenAIKey || '', anthropic: d.ccAnthropicKey || '' } });
      });
    });
  }
  function keyFor(settings, provider) { return settings.keys[provider] || ''; }
  function effortProfile(provider, model) {
    provider=String(provider||'').toLowerCase();model=String(model||'').toLowerCase();
    if((provider==='anthropic'||provider==='brewkeg') && /^claude-(opus|sonnet|haiku)-5-5$/.test(model)) {
      return {supported:EFFORTS.slice(),defaultEffort:model.indexOf('sonnet')>=0?'high':'medium',parameter:'output_config.effort',reasoningModes:[],note:'Anthropic Messages API effort control.'};
    }
    if(provider==='brewkeg' && (model==='gpt-6-astra'||model==='gpt-6.1-sol')) return {supported:EFFORTS.slice(),defaultEffort:'medium',parameter:'reasoning_effort',reasoningModes:[],note:'Brewkeg OpenAI-compatible chat endpoint; reasoning_effort is forwarded for this GPT model.'};\n    if(provider==='brewkeg' && model==='gpt-6-luna') return {supported:['none'].concat(EFFORTS),defaultEffort:'medium',parameter:'reasoning_effort',reasoningModes:[],note:'Brewkeg OpenAI-compatible chat endpoint; reasoning_effort is forwarded for this GPT model.'};\n    if(provider==='openai') {
      if(model==='gpt-6-astra'||model==='gpt-6.1-sol') return {supported:EFFORTS.slice(),defaultEffort:'medium',parameter:'reasoning.effort',reasoningModes:['standard','pro'],note:'OpenAI Responses API reasoning control.'};
      if(model==='gpt-6-luna') return {supported:['none'].concat(EFFORTS),defaultEffort:'medium',parameter:'reasoning.effort',reasoningModes:['standard','pro'],note:'OpenAI Responses API reasoning control.'};
    }
    return {supported:[],defaultEffort:'provider',parameter:'',reasoningModes:[],note:provider==='brewkeg'?'Brewkeg-compatible routing does not currently advertise a verified effort parameter; provider default is used.':'Effort support is not verified for this provider/model combination; provider default is used.'};
  }
  function resolveEffort(provider,model,options) {
    options=options||{};var profile=effortProfile(provider,model),requested=String(options.effort||'').toLowerCase();
    var effort=profile.supported.indexOf(requested)>=0?requested:(profile.supported.indexOf(profile.defaultEffort)>=0?profile.defaultEffort:null);
    var mode=profile.reasoningModes.indexOf(options.reasoningMode)>=0?options.reasoningMode:'standard';
    return {effort:effort,requested:requested,adjusted:!!(requested&&requested!==effort),reasoningMode:mode,profile:profile};
  }
  function relay(type, key, body) {
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({ type: type, key: key, body: body }, function (res) {
        if (chrome.runtime.lastError || !res) return reject(new Error((chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Provider relay did not respond.'));
        resolve(res);
      });
    });
  }
  function request(provider, model, messages, maxTokens, keys, options) {
    provider = MODELS[provider] ? provider : 'brewkeg';
    var key = keys && keys[provider] || '';
    if (!key) return Promise.reject(new Error('Add a key for ' + provider + ' in Settings.'));
    options=options||{};
    var body = { model: String(model || MODELS[provider][0]), messages: messages, max_tokens: Math.max(1, Math.min(8192, Number(maxTokens) || 2048)) };
    function send(settings) {
      var resolved=resolveEffort(provider,body.model,{
        effort:options.effort||settings.effort,
        reasoningMode:options.reasoningMode||settings.reasoningMode
      });
      if(resolved.effort) {
        if(provider==='anthropic') body.output_config={effort:resolved.effort};
        if(provider==='openai') {
          body.reasoning={effort:resolved.effort};
          if(resolved.profile.reasoningModes.length)body.reasoning.mode=resolved.reasoningMode;
        }
      }
      if(provider==='anthropic') {
        var sys = messages.filter(function (m) { return m.role === 'system'; }).map(function (m) { return m.content; }).join('\n\n');
        body.system = sys;
        body.messages = messages.filter(function (m) { return m.role !== 'system'; });
        return relay(provider==='anthropic'?'provider.anthropic':'provider.brewkegAnthropic', key, body);
      }
      return relay(provider === 'openai' ? 'provider.openai' : 'chat', key, body);
    }
    return readSettings().then(send);
  }
  function populate(control, provider, selected) {
    if (!control) return;
    var list = MODELS[provider] || MODELS.brewkeg;
    if (control.tagName === 'INPUT') {
      var listId = control.getAttribute('list'), dl = listId && document.getElementById(listId);
      if (dl) { dl.textContent = ''; list.forEach(function (m) { var o=document.createElement('option');o.value=m;dl.appendChild(o); }); }
      control.value = selected || (list.indexOf(control.value) >= 0 ? control.value : list[0]);
      return;
    }
    control.textContent = '';
    list.forEach(function (m) { var o=document.createElement('option');o.value=m;o.textContent=m;control.appendChild(o); });
    if (selected && Array.prototype.some.call(control.options,function(o){return o.value===selected;})) control.value=selected;
  }
  function populateEffort(control,provider,model,selected,includeInherit) {
    if(!control)return;
    var profile=effortProfile(provider,model),items=[];
    if(includeInherit)items.push({value:'inherit',label:'Use global setting'});
    if(!profile.supported.length)items.push({value:'',label:'Provider default (not verified)'});
    else profile.supported.forEach(function(v){items.push({value:v,label:{none:'No additional reasoning',low:'Low — faster, lower usage',medium:'Medium — balanced',high:'High — deeper analysis',xhigh:'Extra high — extended reasoning',max:'Maximum — deepest supported effort'}[v]||v});});
    control.textContent='';
    items.forEach(function(x){var o=document.createElement('option');o.value=x.value;o.textContent=x.label;control.appendChild(o);});
    var target=selected||'';
    if(!items.some(function(x){return x.value===target;}))target=includeInherit?'inherit':(profile.supported.indexOf(profile.defaultEffort)>=0?profile.defaultEffort:'');
    control.value=target;
    return profile;
  }
  g.CCProviders = Object.freeze({ models: MODELS, readSettings: readSettings, request: request, populate: populate,
    effortProfile:effortProfile,resolveEffort:resolveEffort,populateEffort:populateEffort });
})(window);
