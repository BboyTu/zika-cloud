/* zika 后端公共库：JSON 响应 / 密码哈希 / 会话 */
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
  });
}
export function bufToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return bufToHex(a);
}
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  return bufToHex(bits);
}
export function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
export function validPassword(pw) {
  return typeof pw === 'string' && pw.length >= 6 && pw.length <= 64;
}
const SESS_TTL = 60 * 60 * 24 * 30; // 30 天
export async function createSession(env, uid, email) {
  const token = randomHex(32);
  await env.KV.put('sess_' + token, JSON.stringify({ uid, email }), { expirationTtl: SESS_TTL });
  return token;
}
export async function authUser(request, env) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const raw = await env.KV.get('sess_' + m[1]);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
