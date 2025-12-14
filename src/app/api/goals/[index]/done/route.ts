// src/app/api/goals/[index]/done/route.ts
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

export async function POST(
  req: Request,
  { params }: { params: { index: string } }, // index = goalId (UUID)
) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id') || 'web';

    const goalId = params.index; // это UUID, НЕ индекс

    const url = new URL(`/api/goals/${encodeURIComponent(goalId)}/done`, getBase());
    url.searchParams.set('user_id', user_id);

    const upstream = await fetchWithTimeout(url.toString(), { method: 'POST' });

    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { ok: false }, { status: upstream.status });
  } catch (e: any) {
    console.error('POST /api/goals/[index]/done error:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'Server error' },
      { status: 500 },
    );
  }
}
