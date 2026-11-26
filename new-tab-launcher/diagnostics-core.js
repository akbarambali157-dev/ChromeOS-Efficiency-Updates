(function(root){
  'use strict';

  function check(name,status,detail){
    var allowed=['pass','warn','fail','skip','unsupported','not-run'];
    if(allowed.indexOf(status)<0) status='not-run';
    return {name:String(name||'Unnamed check'),status:status,detail:String(detail||'')};
  }

  function validateIds(ids){
    var seen=Object.create(null),duplicates=[];
    (Array.isArray(ids)?ids:[]).forEach(function(id){
      if(!id) return;
      if(seen[id]) duplicates.push(id); else seen[id]=1;
    });
    return {count:Object.keys(seen).length,duplicates:duplicates};
  }

  function validateLocalLinks(links,exists){
    var broken=[];
    (Array.isArray(links)?links:[]).forEach(function(href){
      if(typeof href!=='string'||!href.trim()||/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return;
      var path=href.split(/[?#]/)[0];
      if(path&&typeof exists==='function'&&!exists(path)) broken.push(href);
    });
    return broken;
  }

  function redact(value){
    var s=String(value==null?'':value).slice(0,1200);
    s=s.replace(/(bearer\s+)[A-Za-z0-9._~+\/-]+=*/ig,'$1[REDACTED]');
    s=s.replace(/(["']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|authorization)["']?\s*[:=]\s*["']?)[^\s,;}"']+/ig,'$1[REDACTED]');
    s=s.replace(/([?&](?:key|token|secret|password|auth)=)[^&\s]+/ig,'$1[REDACTED]');
    s=s.replace(/https?:\/\/[^\s)]+/ig,function(url){
      try{var u=new URL(url);return u.origin+u.pathname;}catch(e){return '[URL REDACTED]';}
    });
    return s;
  }

  function summarize(checks){
    var summary={pass:0,warn:0,fail:0,skip:0,unsupported:0,'not-run':0};
    (Array.isArray(checks)?checks:[]).forEach(function(item){
      if(item&&Object.prototype.hasOwnProperty.call(summary,item.status)) summary[item.status]++;
    });
    return summary;
  }

  function buildReport(meta,checks,errors){
    var summary=summarize(checks);
    var lines=[
      'Project Atlas Diagnostics Report',
      'Generated: '+(meta&&meta.generated||'unknown'),
      'Version: '+(meta&&meta.version||'unknown'),
      'Page: '+(meta&&meta.page||'unknown'),
      '',
      'Summary: PASS '+summary.pass+' | WARN '+summary.warn+' | FAIL '+summary.fail+' | SKIP '+summary.skip+' | Unsupported '+summary.unsupported+' | Not run '+summary['not-run'],
      '',
      'Checks:'
    ];
    (checks||[]).forEach(function(item){
      lines.push('['+(item.status||'not-run').toUpperCase()+'] '+redact(item.name)+': '+redact(item.detail));
    });
    if(errors&&errors.length){
      lines.push('','Captured runtime errors (redacted):');
      errors.slice(0,20).forEach(function(item){
        lines.push('- '+redact(item.message)+' | '+redact(item.source)+' | line '+(item.line||0));
      });
    }
    lines.push('','Privacy: report contains diagnostic metadata only. It does not include saved data, API keys, page URLs, or project file contents.');
    return lines.join('\n').slice(0,100000);
  }


  function validatePageContract(html,requiredIds){
    var source=String(html||''),ids=[].slice.call(source.matchAll(/\\bid=["']([^"']+)["']/g)).map(function(m){return m[1];});
    var seen=Object.create(null),duplicates=[];
    ids.forEach(function(id){if(seen[id])duplicates.push(id);else seen[id]=1;});
    var required=Array.isArray(requiredIds)?requiredIds:[],missing=required.filter(function(id){return ids.indexOf(id)<0;});
    return {idCount:Object.keys(seen).length,duplicates:duplicates,missing:missing,ok:duplicates.length===0&&missing.length===0};
  }
  var api={validatePageContract:validatePageContract,check:check,validateIds:validateIds,validateLocalLinks:validateLocalLinks,redact:redact,summarize:summarize,buildReport:buildReport};
  root.AtlasDiagnosticsCore=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
