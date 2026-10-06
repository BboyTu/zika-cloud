/* CORS 中间件 + OPTIONS 预检，覆盖全部 /api/* 路由 */
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
export async function onRequest(context) {
  const { request, next } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  const response = await next();
  const h = new Headers(response.headers);
  if (!h.has('access-control-allow-origin')) h.set('access-control-allow-origin', '*');
  return new Response(response.body, { status: response.status, headers: h });
}
