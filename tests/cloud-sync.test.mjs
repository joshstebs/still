import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Miniflare } from 'miniflare';
import { handleWorkspace } from '../lib/workspace.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB'],compatibilityDate:'2026-05-15',cf:false});
try{
 const db=await mf.getD1Database('DB');
 await db.exec(fs.readFileSync(new URL('../drizzle/0000_chilly_ravenous.sql',import.meta.url),'utf8').replaceAll('\n',' '));
 const user={userId:'alice',displayName:'Alice',email:'alice@example.test'},other={userId:'bob',displayName:'Bob',email:'bob@example.test'};
 const state={version:1,tasks:[{id:'task-one',title:'A little test',done:false,category:'Personal',priority:'High',due:'2026-10-15'}],notes:[],sessions:[],duration:25,projects:[],habits:[],trash:[],draft:''};
 const request=(method,body,origin='https://still.test')=>new Request('https://still.test/api/workspace',{method,headers:body?{'content-type':'application/json',origin}:{},body:body?JSON.stringify(body):undefined});
 assert.equal((await handleWorkspace(request('GET'),db,null)).status,401);
 let r=await handleWorkspace(request('GET'),db,user);assert.equal((await r.json()).state,null);
 assert.equal((await handleWorkspace(request('PUT',{state,revision:0},'https://evil.test'),db,user)).status,403);
 r=await handleWorkspace(request('PUT',{state,revision:0}),db,user);assert.equal(r.status,200);assert.equal((await r.json()).revision,1);
 r=await handleWorkspace(request('GET'),db,other);assert.equal((await r.json()).state,null);
 r=await handleWorkspace(request('GET'),db,user);const saved=await r.json();assert.equal(saved.state.tasks[0].title,'A little test');assert.equal(saved.revision,1);assert.match(r.headers.get('cache-control'),/no-store/);
 r=await handleWorkspace(request('PUT',{state,revision:0}),db,user);assert.equal(r.status,409);assert.equal((await r.json()).revision,1);
 const edits=[{...state,draft:'first device'},{...state,draft:'second device'}];const writes=await Promise.all(edits.map(state=>handleWorkspace(request('PUT',{state,revision:1}),db,user)));assert.deepEqual(writes.map(r=>r.status).sort(),[200,409]);
 r=await handleWorkspace(request('GET'),db,user);assert.equal((await r.json()).revision,2);
 assert.equal((await handleWorkspace(request('PUT',{state:{...state,tasks:[{id:'broken'}]},revision:2}),db,user)).status,400);
 assert.equal((await handleWorkspace(request('PUT',{state,revision:-1}),db,user)).status,400);
 assert.equal((await handleWorkspace(request('PUT',{state:{...state,draft:'x'.repeat(4000001)},revision:2}),db,user)).status,413);
 assert.equal((await handleWorkspace(request('GET'),null,user)).status,503);
 console.log('PASS: real D1 create/read, user isolation, no anonymous access, cross-origin write rejection, atomic revision checks, simultaneous-device conflicts, invalid data rejection, payload limit, no-cache responses, unavailable storage.');
}finally{await mf.dispose()}
