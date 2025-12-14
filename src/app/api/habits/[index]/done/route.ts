// src/app/api/habits/[habitId]/done/route.ts
import { NextResponse } from 'next/server';

function getBase() {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error('RENDER_BOT_URL is not set');
  return base;
}

export async function POST(
  req: Request,
  { params }: { params: { habitId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id') || 'web';

    const url = new URL(`/api/habits/${encodeURIComponent(params.habitId)}/done`, getBase());
    url.searchParams.set('user_id', user_id);

    const r = await fetch(url.toString(), { method: 'POST' });
    const data = await r.json().catch(() => null);

    return NextResponse.json(data ?? { ok: false }, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'route error' },
      { status: 500 },
    );
  }
}
