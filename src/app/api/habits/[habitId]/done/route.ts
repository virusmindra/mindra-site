// src/app/api/habits/[habitId]/done/route.ts
import { NextResponse } from 'next/server';

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 15000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function getBase() {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  return base;
}

// POST /api/habits/:habitId/done?user_id=...
export async function POST(req: Request, { params }: { params: { habitId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id') || 'web';

    const url = new URL(`/api/habits/${encodeURIComponent(params.habitId)}/done`, getBase());
    url.searchParams.set('user_id', user_id);

    const upstream = await fetchWithTimeout(url.toString(), { method: 'POST' });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: 'Invalid upstream response', raw: text };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'route error' },
      { status: 500 },
    );
  }
}
