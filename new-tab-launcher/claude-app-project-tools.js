/* Bounded project-folder tool adapter. All paths are delegated to the
   project-folder security boundary; no raw filesystem path or host API escapes. */
(function(g){
'use strict';
var MAX_OUTPUT=12000;
function folders(){if(!g.CCProjectFolders)throw new Error('Project folder tools are not loaded.');return g.CCProjectFolders;}
function projectId(app){var p=app&&app.getProjectInfo?app.getProjectInfo():null;if(!p||!p.id)throw new Error('Open a project before using project folder tools.');return String(p.id);}
function clip(value){var s=typeof value==='string'?value:JSON.stringify(value);return s.length>MAX_OUTPUT?s.slice(0,MAX_OUTPUT)+'\n[Output clipped for memory safety.]':s;}
var definitions=[
{name:'project_list_files',description:'List supported text/code files in the currently selected project folder.',parameters:{type:'object',properties:{},additionalProperties:false}},
{name:'project_read_file',description:'Read one supported text/code file using a project-relative path.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path'],additionalProperties:false}},
{name:'project_grep',description:'Search file contents for a literal text query in the selected project folder.',parameters:{type:'object',properties:{query:{type:'string'},maxResults:{type:'integer',minimum:1,maximum:40}},required:['query'],additionalProperties:false}},
{name:'project_propose_file',description:'Prepare a create/edit proposal for a supported text file. This never writes; the user must review and explicitly apply the proposal.',parameters:{type:'object',properties:{path:{type:'string'},content:{type:'string'}},required:['path','content'],additionalProperties:false}}
];
function execute(app,name,args){
args=args&&typeof args==='object'?args:{};var id=projectId(app),api=folders();
if(name==='project_list_files')return api.list(id).then(clip);
if(name==='project_read_file')return api.read(id,String(args.path||'')).then(clip);
if(name==='project_grep')return api.search(id,String(args.query||''),{maxResults:Math.min(40,Math.max(1,Number(args.maxResults)||30))}).then(clip);
if(name==='project_propose_file')return api.proposeWrite(id,String(args.path||''),String(args.content===undefined?'':args.content)).then(function(proposal){return clip({status:'proposal_ready',path:proposal.path,kind:proposal.kind,before:proposal.before,after:proposal.after,createdAt:proposal.createdAt,approvalRequired:true,proposal:proposal});});
throw new Error('Unknown project tool: '+String(name));
}
g.CCProjectTools=Object.freeze({definitions:definitions,execute:execute});
})(window);
