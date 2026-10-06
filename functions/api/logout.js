/* POST /api/logout  注销当前会话 */
import { json } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) await env.KV.delete('sess_' + m[1]);
  return json({ ok: true });
}
