import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { handleWorkspace } from '../../../lib/workspace.mjs';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
 try {return await handleWorkspace(request,env.DB,await getChatGPTUser());}
 catch {return Response.json({error:'Cloud sync is unavailable. Your local changes are kept on this device.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export { handle as GET, handle as PUT };
