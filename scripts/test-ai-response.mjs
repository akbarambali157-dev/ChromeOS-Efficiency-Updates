import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../new-tab-launcher/claude-app-response.js',import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(source,box);const api=box.window.CCResponse;
assert.equal(api.extract({status:200,text:JSON.stringify({choices:[{finish_reason:'stop',message:{content:'Readable answer'}}]})},'test','model'),'Readable answer');
assert.equal(api.extract({status:200,text:JSON.stringify({output_text:'Responses answer',status:'completed'})},'test','model'),'Responses answer');
assert.equal(api.extract({status:200,text:JSON.stringify({content:[{type:'text',text:'Anthropic answer'}],stop_reason:'end_turn'})},'test','model'),'Anthropic answer');
assert.equal(api.extract({status:200,text:JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'Gemini answer'}]}}]})},'test','model'),'Gemini answer');
assert.throws(()=>api.extract({status:200,text:JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[]}}]})},'test','model'),e=>e.finishReason==='length');
assert.throws(()=>api.extract({status:200,text:JSON.stringify({choices:[{finish_reason:'length',message:{content:''}}]})},'reviewer','model'),e=>e.finishReason==='length'&&/no readable text/.test(e.message)&&!!e.diagnostic);
assert.throws(()=>api.extract({status:200,text:JSON.stringify({choices:[{finish_reason:'length',message:{content:'partial'}}]})},'reviewer','model'),e=>e.partialText==='partial'&&e.finishReason==='length');
assert.throws(()=>api.extract({status:200,text:'not json'},'test','model'),e=>/invalid response JSON/.test(e.message));
assert.throws(()=>api.extract({status:429,text:'rate limited'},'test','model'),e=>e.status===429&&e.retryable);
assert.deepEqual(JSON.parse(JSON.stringify(api.parseObject('prefix\\n```json\\n{"title":"brace } safe","scenes":[]}\\n```','test'))),{title:'brace } safe',scenes:[]});
assert.throws(()=>api.parseObject('{"title":"unfinished"','Video Studio'),e=>/complete JSON/.test(e.message));
let calls=0,budgets=[];
const retryBox={window:{CCProviders:{request:(provider,model,messages,tokens)=>{calls++;budgets.push(tokens);return Promise.resolve({status:200,text:JSON.stringify(calls===1?{choices:[{finish_reason:'length',message:{content:''}}]}:{choices:[{finish_reason:'stop',message:{content:'Recovered complete answer'}}]})});}}}};
vm.runInNewContext(source,retryBox);
const recovered=await retryBox.window.CCResponse.request('brewkeg','test-model',[{role:'system',content:'system'},{role:'user',content:'task'}],4096,{},'test');
assert.equal(recovered,'Recovered complete answer');
assert.equal(calls,2);
assert.equal(budgets[1],8192);

// Automatic continuation: preserve partial output, send compact context, and append once.
let continuationCalls=0,continuationMessages=[],progressEvents=[];
const continuationBox={window:{CCProviders:{request:(provider,model,messages,tokens)=>{continuationCalls++;continuationMessages.push(messages);return Promise.resolve({status:200,text:JSON.stringify(continuationCalls===1?{choices:[{finish_reason:'length',message:{content:'First part of the answer.'}}]}:{choices:[{finish_reason:'stop',message:{content:' Second part completes it.'}}]})});}}}};
vm.runInNewContext(source,continuationBox);
const continuation=await continuationBox.window.CCResponse.request('brewkeg','test-model',[{role:'system',content:'Be precise.'},{role:'user',content:'Explain the task.'}],2048,{},'test',e=>progressEvents.push(e));
assert.equal(continuation,'First part of the answer. Second part completes it.');
assert.equal(continuationCalls,2);
assert.equal(continuationMessages[1].some(m=>m.role==='assistant'&&m.content==='First part of the answer.'),true);
assert.equal(continuationMessages[1].some(m=>m.role==='user'&&/Continue directly from its exact final character/.test(m.content)),true);
assert.equal(progressEvents.length,1);
assert.equal(progressEvents[0].stage,'continuing');
// Repeated truncation is bounded and returns the accumulated partial response.
let repeated=0;
const boundedBox={window:{CCProviders:{request:()=>{repeated++;return Promise.resolve({status:200,text:JSON.stringify({choices:[{finish_reason:'length',message:{content:'part '+repeated}}]})});}}}};
vm.runInNewContext(source,boundedBox);
await assert.rejects(()=>boundedBox.window.CCResponse.request('brewkeg','test-model',[{role:'user',content:'Long task'}],1024,{},'test'),e=>String(e.partialText||'').replace(/\\s+/g,'')==='part1part2part3'&&/could not complete/i.test(e.message));
assert.equal(repeated,3);

console.log('AI response normalization and continuation tests passed.');
