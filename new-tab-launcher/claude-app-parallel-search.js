(function(g){
'use strict';
function str(v,n){return typeof v==='string'?v.slice(0,n):'';}
function err(message,kind,status,raw,meta,cause){
 var e=new Error(message);meta=meta||{};e.kind=kind;e.status=status;e.requestId=str(meta.requestId||meta.request_id,160);e.contentType=str(meta.contentType,160);
 e.diagnostic='Parallel Search diagnostics\nFailure: '+kind+'\nHTTP status: '+(status||'not supplied')+'\nContent-Type: '+(e.contentType||'not supplied')+'\nRequest ID: '+(e.requestId||'not supplied')+'\nParser: '+(cause&&cause.message||'not applicable')+'\nResponse excerpt (first 2,000 characters):\n'+String(raw||'').slice(0,2000);return e;
}
function parseResponse(status,raw,meta){
 status=Number(status)||0;raw=String(raw==null?'':raw);meta=meta||{};
 if(status<200||status>=300){var d=raw.slice(0,700);try{var x=JSON.parse(raw);d=str(x.error&& (x.error.message||x.error.type)||x.message||x.detail,700)||d;}catch(ignore){}throw err('Parallel Search request failed (HTTP '+(status||'network')+'): '+(d||'No response details.'),'http_error',status,raw,meta);}
 var s=raw.replace(/^\uFEFF/,'').trim(),obj=null;
 if(!s)throw err('Parallel Search returned an empty response body.','empty',status,raw,meta);
 s=s.replace(/^\)\]\}',?\s*/,'');
 try{obj=JSON.parse(s);}catch(e){var kind=s.indexOf('<')===0?'HTML or proxy page':'non-JSON response';throw err('Parallel Search returned '+kind+' instead of JSON.','malformed_json',status,raw,meta,e);}
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw err('Parallel Search returned JSON, but the top-level response was not an object.','invalid_shape',status,raw,meta);
 var providerError=obj.error&&(obj.error.message||obj.error.type||obj.error)||obj.message||obj.detail;
 if(obj.error||(obj.detail&&!Array.isArray(obj.results)))throw err('Parallel Search returned an API error: '+str(providerError,700),'provider_error',status,raw,meta);
 var rows=Array.isArray(obj.results)?obj.results:(obj.data&&Array.isArray(obj.data.results)?obj.data.results:null);
 if(!rows)throw err('Parallel Search returned valid JSON but did not include the documented results array.','invalid_shape',status,raw,meta);
 var results=[];
 rows.slice(0,20).forEach(function(item){if(!item||typeof item!=='object')return;var url=str(item.url,2048).trim();if(!/^https?:\/\//i.test(url))return;var excerpts=Array.isArray(item.excerpts)?item.excerpts.map(function(v){return typeof v==='string'?v.slice(0,6000):(v&&typeof v==='object'?str(v.text||v.excerpt,6000):'');}).filter(Boolean):[];results.push({title:str(item.title,300)||url,url:url,excerpts:excerpts,publish_date:str(item.publish_date,80),source:str(item.source,120)});});
 if(rows.length&&!results.length)throw err('Parallel Search returned '+rows.length+' result entries, but none contained a valid HTTP(S) source URL.','invalid_results',status,raw,meta);
 return {results:results,search_id:str(obj.search_id,160),session_id:str(obj.session_id,160),warnings:Array.isArray(obj.warnings)?obj.warnings.slice(0,10):[],usage:obj.usage||null};
}
g.CCParallelSearch=Object.freeze({parseResponse:parseResponse});
})(window);
