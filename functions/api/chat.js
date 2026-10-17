
const MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

const SYSTEM_PROMPT = `You are Danken AI, a helpful, friendly, honest assistant. Answer clearly and naturally. If you are unsure, say so. Do not claim to have browsed the web or performed actions you have not performed. For medical, legal, financial, or safety topics, provide careful general information and encourage appropriate professional help when needed.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.AI || typeof env.AI.run !== 'function') {
    return json({
      error: 'Danken AI is not connected yet. The site owner must enable the Workers AI binding named AI in Cloudflare Pages settings.'
    }, 503);
  }

  let body;

  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 40000) {
      return json({ error: 'That message is too large. Please shorten it and try again.' }, 413);
    }
    body = await request.json();
  } catch {
    return json({ error: 'Please send a valid chat message.' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: 'Type a message before sending.' }, 400);
  }

  const messages = body.messages.slice(-12).map((message) => {
    if (!message ||
        !['user', 'assistant'].includes(message.role) ||
        typeof message.content !== 'string') return null;

    const content = message.content.trim();
    if (!content || content.length > 8000) return null;

    return { role: message.role, content };
  });

  if (
    messages.some((message) => message === null) ||
    messages[messages.length - 1]?.role !== 'user'
  ) {
    return json({
      error: 'Some messages were invalid. Please start a new chat and try again.'
    }, 400);
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 700,
      temperature: 0.6,
    });

    const answer = typeof result?.response === 'string'
      ? result.response.trim()
      : '';

    if (!answer) {
      return json({ error: 'The AI returned an empty answer. Please try again.' }, 502);
    }

    return json({ answer });
  } catch (error) {
    const detail = String(error?.message || '');

    if (/limit|quota|neuron|billing|exceed/i.test(detail)) {
      return json({
        error: 'Danken AI has reached its free AI allowance for now. Please try again after the free quota resets.'
      }, 429);
    }

    return json({
      error: 'Danken AI could not answer right now. Please try again shortly.'
    }, 502);
  }
        }
