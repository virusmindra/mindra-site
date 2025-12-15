// src/app/api/habits/[index]/route.ts
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 15000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function getDeleteUrl(index: string, user_id: string) {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  const url = new URL(`/api/habits/${index}`, base);
  url.searchParams.set('user_id', user_id); // ✅ важно
  return url.toString();
}

export async function DELETE(req: Request, { params }: { params: { index: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id') || 'web';

    const url = getDeleteUrl(params.index, user_id);

    const upstream = await fetchWithTimeout(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: 'Invalid upstream response', raw: text };
    }

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('DELETE /api/habits/[index] error:', e);
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
