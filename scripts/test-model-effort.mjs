import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../new-tab-launcher/claude-app-providers.js',import.meta.url),'utf8');
const calls=[];
const storage={ccEffort:'medium',ccReasoningMode:'standard'};
const box={
  window:{},
  chrome:{
    storage:{local:{get(keys,callback){callback(Object.assign({},storage));}}},
    runtime:{sendMessage(message,callback){calls.push(message);callback({status:200,text:'{}'});}}
  }
};
vm.runInNewContext(source,box);
const api=box.window.CCProviders;

const opus=api.effortProfile('anthropic','claude-opus-5-5');
assert.deepEqual(Array.from(opus.supported),['low','medium','high','xhigh','max']);
assert.equal(opus.defaultEffort,'medium');
assert.equal(opus.parameter,'output_config.effort');

const sonnet=api.effortProfile('anthropic','claude-sonnet-5-5');
assert.equal(sonnet.defaultEffort,'high');
assert.deepEqual(Array.from(sonnet.supported),['low','medium','high','xhigh','max']);

const gpt=api.effortProfile('openai','gpt-6-astra');
assert.deepEqual(Array.from(gpt.supported),['low','medium','high','xhigh','max']);
assert.deepEqual(Array.from(gpt.reasoningModes),['standard','pro']);
const luna=api.effortProfile('openai','gpt-6-luna');
assert.equal(luna.supported[0],'none');
const terra=api.effortProfile('openai','gpt-6.1-terra');
assert.equal(terra.supported[0],'none');
assert.equal(api.resolveEffort('openai','gpt-6.1-sol',{effort:'none'}).effort,'medium');

const proxy=api.effortProfile('brewkeg','claude-opus-5-5');
assert.deepEqual(Array.from(proxy.supported),['low','medium','high','xhigh','max']);
assert.equal(api.resolveEffort('brewkeg','claude-opus-5-5',{effort:'max'}).effort,'max');
assert.equal(api.resolveEffort('anthropic','claude-opus-5-5',{effort:'ultracode'}).effort,'medium');

await api.request('anthropic','claude-opus-5-5',[{role:'user',content:'test'}],1024,{anthropic:'key'},{effort:'xhigh'});
assert.equal(calls[0].type,'provider.anthropic');
assert.equal(calls[0].body.output_config.effort,'xhigh');
assert.equal(calls[0].body.max_tokens,16384);
assert.equal('reasoning' in calls[0].body,false);

await api.request('openai','gpt-6-astra',[{role:'user',content:'test'}],1024,{openai:'key'},{effort:'high',reasoningMode:'pro'});
assert.equal(calls[1].type,'provider.openai');
assert.deepEqual(JSON.parse(JSON.stringify(calls[1].body.reasoning)),{effort:'high',mode:'pro'});
assert.equal('output_config' in calls[1].body,false);

await api.request('brewkeg','claude-opus-5-5',[{role:'user',content:'test'}],1024,{brewkeg:'key'},{effort:'max'});
assert.equal(calls[2].type,'provider.brewkegAnthropic');
assert.equal(calls[2].body.output_config.effort,'max');

await api.request('brewkeg','gpt-6-astra',[{role:'user',content:'test'}],1024,{brewkeg:'key'},{effort:'high'});
assert.equal(calls[3].type,'chat');
assert.equal(calls[3].body.reasoning_effort,'high');
assert.equal('reasoning' in calls[3].body,false);
assert.equal('output_config' in calls[3].body,false);

console.log('Model-specific effort capability tests passed.');
