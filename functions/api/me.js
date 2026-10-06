/* GET /api/me  校验令牌并返回当前用户 */
import { json, authUser } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  const u = await authUser(request, env);
  if (!u) return json({ error: '未登录或登录已过期' }, 401);
  return json({ email: u.email });
}
