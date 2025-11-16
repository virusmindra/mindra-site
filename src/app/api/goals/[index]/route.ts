// src/app/api/goals/[index]/route.ts

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  ms = 15000,
) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function getDeleteUrl(index: string) {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  return new URL(`/api/goals/${index}`, base).toString();
}

export async function DELETE(
  _req: Request,
  { params }: { params: { index: string } },
) {
  try {
    const url = getDeleteUrl(params.index);

    const upstream = await fetchWithTimeout(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Invalid upstream response' };
    }

    return new Response(JSON.stringify(data), {
      status: upstream.ok ? upstream.status : upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('DELETE /api/goals/[index] error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
