
export async function onRequestGet({ env }) {
  const connected = Boolean(env.AI && typeof env.AI.run === 'function');

  return new Response(JSON.stringify({
    name: 'Danken AI',
    status: connected ? 'connected' : 'setup_required',
    message: connected
      ? 'Workers AI binding is configured.'
      : 'The owner still needs to configure the AI binding.'
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
