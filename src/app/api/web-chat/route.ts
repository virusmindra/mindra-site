// src/app/api/web-chat/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

function withTimeout<T>(p: Promise<T>, ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  // @ts-ignore
  p.signal = ac.signal;
  // обёртка, чтобы очистить таймер, когда промис завершится
  return {
    signal: ac.signal,
    done: p.finally(() => clearTimeout(t)),
  };
}

export async function POST(req: NextRequest) {
  try {
    const URL_FULL = process.env.RENDER_BOT_URL;
    if (!URL_FULL) {
      console.error('RENDER_BOT_URL is missing');
      return NextResponse.json({ reply: 'Server is not configured.' }, { status: 500 });
    }

    const { input, sessionId } = await req.json();
    const user = await getCurrentUser();
    const userId = user?.id ?? 'web-anon';

    // 1) быстрый ПРОГРЕВ (GET /) — не блокирующий
    try {
      const origin = new URL(URL_FULL);
      const warmUrl = `${origin.origin}/`;
      const warm = fetch(warmUrl, { cache: 'no-store' });
      const { signal, done } = withTimeout(warm, 3000);
      await fetch(warmUrl, { cache: 'no-store', signal });
      await done;
    } catch (_) {
      // игнор — это лишь прогрев
    }

    // 2) ОСНОВНОЙ запрос на Render c явным таймаутом
    const post = fetch(URL_FULL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        userId,
        sessionId: sessionId ?? 'default',
        input: input ?? '',
      }),
    });
    const { signal, done } = withTimeout(post, 15000); // 15s таймаут
    let resp: Response;
    try {
      resp = await fetch(URL_FULL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal,
        body: JSON.stringify({
          userId,
          sessionId: sessionId ?? 'default',
          input: input ?? '',
        }),
      });
    } catch (e: any) {
      console.error('Fetch to Render failed:', e?.name || e?.message || e);
      return NextResponse.json({ reply: 'Upstream timeout' }, { status: 504 });
    } finally {
      await done;
    }

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { reply: text || 'Empty response' }; }

    if (!resp.ok) {
      console.error('Render replied not OK:', resp.status, text.slice(0, 500));
      return NextResponse.json({ reply: 'Upstream error' }, { status: 502 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error('web-chat route error:', e?.message || e);
    return NextResponse.json({ reply: 'Server error' }, { status: 500 });
  }
}
