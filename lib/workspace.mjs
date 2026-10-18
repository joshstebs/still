import { z } from 'zod';
const id=z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/), date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/), str=z.string();
const task=z.object({id,title:str.min(1).max(180),category:z.enum(['Personal','Work','Projects','Wellbeing']),priority:z.enum(['Normal','High','Low']),due:z.union([date,z.literal('')]),done:z.boolean(),project:str.max(100).optional()});
const note=z.object({id,title:str.max(120),body:str.max(100000),updated:z.number().finite()});
const session=z.object({id,date,minutes:z.number().positive().max(120),taskId:id.nullable().optional()});
const project=z.object({id,name:str.min(1).max(70),description:str.max(300),color:z.enum(['sage','clay','lavender','blue'])});
const habit=z.object({id,name:str.min(1).max(70),days:z.array(date).max(20000)});
const trash=z.discriminatedUnion('type',[
 z.object({type:z.literal('task'),item:task}),z.object({type:z.literal('note'),item:note}),
 z.object({type:z.literal('project'),item:project}),z.object({type:z.literal('habit'),item:habit})
]);
const deleted=z.intersection(z.object({id,index:z.number().int().nonnegative(),deletedAt:z.number().finite()}),trash);
export const workspaceSchema=z.object({version:z.literal(1),tasks:z.array(task).max(20000),notes:z.array(note).max(10000),sessions:z.array(session).max(50000),duration:z.union([z.literal(15),z.literal(25),z.literal(45),z.literal(60)]),projects:z.array(project).max(1000),habits:z.array(habit).max(1000),trash:z.array(deleted).max(20000),draft:str.max(100000).optional()});
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
export async function handleWorkspace(request,db,user){
 if(!user?.userId)return json({error:'Sign in to sync your workspace.'},401);
 if(!db)return json({error:'Cloud storage is temporarily unavailable.'},503);
 const userInfo={id:user.userId,name:user.displayName,email:user.email};
 if(request.method==='GET'){
  const row=await db.prepare('SELECT payload, revision, updated_at FROM workspaces WHERE user_id = ?').bind(user.userId).first();
  return json({user:userInfo,state:row?JSON.parse(row.payload):null,revision:row?.revision||0,updatedAt:row?.updated_at||null});
 }
 if(request.method!=='PUT')return json({error:'Method not allowed.'},405);
 const origin=request.headers.get('origin');
 if(!origin||origin!==new URL(request.url).origin)return json({error:'Invalid request origin.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
 if(Number(request.headers.get('content-length')||0)>4000000)return json({error:'Workspace exceeds the 4 MB sync limit. Export a backup.'},413);
 const raw=await request.text();if(new TextEncoder().encode(raw).length>4000000)return json({error:'Workspace exceeds the 4 MB sync limit. Export a backup.'},413);
 let input;try{input=JSON.parse(raw)}catch{return json({error:'Invalid JSON.'},400)}
 if(!Number.isSafeInteger(input.revision)||input.revision<0)return json({error:'Invalid revision.'},400);
 const parsed=workspaceSchema.safeParse(input.state);if(!parsed.success)return json({error:'Workspace data is invalid. Your local copy has been kept.'},400);
 const payload=JSON.stringify(parsed.data),updatedAt=new Date().toISOString();
 const result=input.revision===0
 ?await db.prepare('INSERT INTO workspaces (user_id, payload, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,payload,updatedAt).run()
 :await db.prepare('UPDATE workspaces SET payload = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?').bind(payload,updatedAt,user.userId,input.revision).run();
 if(!result.meta?.changes){const current=await db.prepare('SELECT payload, revision, updated_at FROM workspaces WHERE user_id = ?').bind(user.userId).first();return json({error:'This workspace changed on another device.',state:current?JSON.parse(current.payload):null,revision:current?.revision||0,updatedAt:current?.updated_at||null},409)}
 return json({revision:input.revision+1,updatedAt});
}
