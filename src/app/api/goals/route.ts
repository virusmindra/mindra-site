// src/app/api/goals/route.ts

// тот же helper, что и в /api/web-chat
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

function getGoalsUrl() {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  // new URL с абсолютным путём заменит /api/web-chat на /api/goals
  return new URL('/api/goals', base).toString();
}

// Список целей
export async function GET() {
  try {
    const url = getGoalsUrl();
    const upstream = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { goals: [] };
    }

    return new Response(JSON.stringify(data), {
      status: upstream.ok ? 200 : upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('GET /api/goals error:', e);
    return new Response(JSON.stringify({ goals: [], error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Создать цель
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = getGoalsUrl();

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
    console.error('POST /api/goals error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
