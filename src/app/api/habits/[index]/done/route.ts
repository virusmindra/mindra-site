// src/app/api/habits/[index]/done/route.ts

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

function getDoneUrl(index: string) {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  return new URL(`/api/habits/${index}/done`, base).toString();
}

export async function POST(
  _req: Request,
  { params }: { params: { index: string } },
) {
  try {
    const url = getDoneUrl(params.index);

    const upstream = await fetchWithTimeout(url, {
      method: 'POST',
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
    console.error('POST /api/habits/[index]/done error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
