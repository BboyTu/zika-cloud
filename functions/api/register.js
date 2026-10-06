/* POST /api/register  邮箱+密码注册 */
import { json, hashPassword, randomHex, validEmail, validPassword, createSession } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: '请求格式错误' }, 400); }
  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();
  if (!validEmail(email)) return json({ error: '邮箱格式不正确' }, 400);
  if (!validPassword(password)) return json({ error: '密码需 6-64 位' }, 400);
  const salt = randomHex(16);
  const pw_hash = await hashPassword(password, salt);
  let id;
  try {
    const res = await env.DB.prepare('INSERT INTO users (email, pw_hash, salt) VALUES (?, ?, ?)')
      .bind(email, pw_hash, salt).run();
    id = res.meta.last_row_id;
  } catch (e) {
    if (String(e.message || '').includes('UNIQUE')) return json({ error: '该邮箱已注册' }, 409);
    return json({ error: '服务器错误，请稍后再试' }, 500);
  }
  const token = await createSession(env, id, email);
  return json({ token, email }, 201);
}
