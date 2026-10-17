export async function onRequestGet({ env }) {
  const ready = Boolean(env.AI && typeof env.AI.run === 'function');
  return Response.json({ ready, provider: ready ? 'Cloudflare Workers AI' : 'Setup needed' }, {
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
