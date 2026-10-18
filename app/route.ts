import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
import { workspaceHtml } from '../lib/workspace-html';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
 if (!await getChatGPTUser()) return Response.redirect(new URL(chatGPTSignInPath('/'),request.url),302);
 return new Response(workspaceHtml,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}
