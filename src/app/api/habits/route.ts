// src/app/api/habits/route.ts

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

function getHabitsUrl() {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  return new URL('/api/habits', base).toString();
}

export async function GET() {
  try {
    const url = getHabitsUrl();
    const upstream = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { habits: [] };
    }

    return new Response(JSON.stringify(data), {
      status: upstream.ok ? 200 : upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('GET /api/habits error:', e);
    return new Response(JSON.stringify({ habits: [], error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = getHabitsUrl();

    const upstream = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    console.error('POST /api/habits error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
