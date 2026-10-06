/* POST /api/login  邮箱+密码登录，签发会话令牌 */
import { json, hashPassword, validEmail, createSession } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: '请求格式错误' }, 400); }
  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();
  if (!validEmail(email)) return json({ error: '邮箱格式不正确' }, 400);
  const row = await env.DB.prepare('SELECT id, pw_hash, salt FROM users WHERE email = ?').bind(email).first();
  if (!row) return json({ error: '邮箱或密码错误' }, 401);
  const h = await hashPassword(password, row.salt);
  if (h !== row.pw_hash) return json({ error: '邮箱或密码错误' }, 401);
  const token = await createSession(env, row.id, email);
  return json({ token, email });
}
