/* 生字本云端同步
   GET /api/sync  拉取当前用户的生字本 {chars:{字:true}}
   PUT /api/sync  推送全量生字本（与云端取并集后保存，返回合并结果）
*/
import { json, authUser } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  const u = await authUser(request, env);
  if (!u) return json({ error: '未登录或登录已过期' }, 401);
  const row = await env.DB.prepare('SELECT chars, updated_at FROM wrong_chars WHERE user_id = ?').bind(u.uid).first();
  if (!row) return json({ chars: {}, updated_at: null });
  let chars = {};
  try { chars = JSON.parse(row.chars) || {}; } catch (e) { chars = {}; }
  return json({ chars, updated_at: row.updated_at });
}
export async function onRequestPut({ request, env }) {
  const u = await authUser(request, env);
  if (!u) return json({ error: '未登录或登录已过期' }, 401);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: '请求格式错误' }, 400); }
  const incoming = body && typeof body.chars === 'object' && body.chars !== null ? body.chars : {};
  // 与云端取并集：保证多设备各自新增的字不丢失
  let merged = {};
  const row = await env.DB.prepare('SELECT chars FROM wrong_chars WHERE user_id = ?').bind(u.uid).first();
  if (row) { try { merged = JSON.parse(row.chars) || {}; } catch (e) { merged = {}; } }
  for (const k of Object.keys(incoming)) merged[k] = true;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await env.DB.prepare(
    'INSERT INTO wrong_chars (user_id, chars, updated_at) VALUES (?, ?, ?) ' +
    'ON CONFLICT(user_id) DO UPDATE SET chars = excluded.chars, updated_at = excluded.updated_at'
  ).bind(u.uid, JSON.stringify(merged), now).run();
  return json({ chars: merged, updated_at: now });
}
