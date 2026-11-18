/* 4.0 provider abstraction. Fixed provider endpoints are relayed by the MV3
   worker; this module never accepts a user-supplied endpoint URL. */
(function (g) {
  'use strict';
  var MODELS = {
    brewkeg: ['claude-sonnet-5-5','claude-haiku-5-5','claude-opus-5-5','gpt-5.5','gpt-5.6','gpt-5'],
    openai: ['gpt-5.5','gpt-5.6','gpt-5'],
    anthropic: ['claude-sonnet-5-5','claude-haiku-5-5','claude-opus-5-5']
  };
  var STORAGE = ['ccProvider','ccModel','ccKey','ccOpenAIKey','ccAnthropicKey'];
  function readSettings() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(STORAGE, function (d) {
        resolve({ provider: d.ccProvider || 'brewkeg', model: d.ccModel || 'claude-sonnet-5-5',
          keys: { brewkeg: d.ccKey || '', openai: d.ccOpenAIKey || '', anthropic: d.ccAnthropicKey || '' } });
      });
    });
  }
  function keyFor(settings, provider) { return settings.keys[provider] || ''; }
  function relay(type, key, body) {
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({ type: type, key: key, body: body }, function (res) {
        if (chrome.runtime.lastError || !res) return reject(new Error((chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Provider relay did not respond.'));
        resolve(res);
      });
    });
  }
  function request(provider, model, messages, maxTokens, keys) {
    provider = MODELS[provider] ? provider : 'brewkeg';
    var key = keys && keys[provider] || '';
    if (!key) return Promise.reject(new Error('Add a key for ' + provider + ' in Settings.'));
    var body = { model: String(model || MODELS[provider][0]), messages: messages, max_tokens: Math.max(1, Math.min(8192, Number(maxTokens) || 2048)) };
    if (provider === 'anthropic') {
      var sys = messages.filter(function (m) { return m.role === 'system'; }).map(function (m) { return m.content; }).join('\n\n');
      body.system = sys;
      body.messages = messages.filter(function (m) { return m.role !== 'system'; });
      return relay('provider.anthropic', key, body);
    }
    return relay(provider === 'openai' ? 'provider.openai' : 'chat', key, body);
  }
  function populate(select, provider, selected) {
    if (!select) return;
    select.textContent = '';
    (MODELS[provider] || MODELS.brewkeg).forEach(function (m) {
      var o = document.createElement('option'); o.value = m; o.textContent = m; select.appendChild(o);
    });
    if (selected && Array.prototype.some.call(select.options, function (o) { return o.value === selected; })) select.value = selected;
  }
  g.CCProviders = Object.freeze({ models: MODELS, readSettings: readSettings, request: request, populate: populate });
})(window);
