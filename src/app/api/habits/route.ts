// src/app/api/habits/route.ts
import { NextResponse } from 'next/server';

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

function getBase() {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  return base;
}

function getHabitsUrl() {
  return new URL('/api/habits', getBase()).toString();
}

// GET /api/habits?user_id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id') || 'web';

    const url = new URL(getHabitsUrl());
    url.searchParams.set('user_id', user_id);

    const upstream = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, habits: [], error: 'Invalid upstream response', raw: text };
    }

    return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status });
  } catch (e: any) {
    console.error('GET /api/habits error:', e);
    return NextResponse.json(
      { ok: false, habits: [], error: e?.message || 'Server error' },
      { status: 500 },
    );
  }
}

// POST /api/habits  body: { text, user_id? }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const user_id = body?.user_id || 'web';

    const url = new URL(getHabitsUrl());
    url.searchParams.set('user_id', String(user_id));

    const upstream = await fetchWithTimeout(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: 'Invalid upstream response', raw: text };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    console.error('POST /api/habits error:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'Server error' },
      { status: 500 },
    );
  }
}
