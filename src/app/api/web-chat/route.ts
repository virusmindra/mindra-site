// src/app/api/web-chat/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth'; // <- используем эту функцию

export async function POST(req: NextRequest) {
  const RENDER_BOT_URL = process.env.RENDER_BOT_URL;
  if (!RENDER_BOT_URL) {
    return NextResponse.json({ reply: 'Server is not configured.' }, { status: 500 });
  }

  // читаем тело
  const { input, sessionId } = await req.json();

  // берём userId из твоей заглушки (dev-user/кука) или ставим дефолт
  const user = await getCurrentUser();
  const userId = user?.id ?? 'web-anon';

  // проксируем запрос на Render FastAPI
  const resp = await fetch(RENDER_BOT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sessionId: sessionId ?? 'default',
      input: input ?? '',
    }),
  });

  // отдаём ответ 1:1 (если FastAPI не упал)
  const data = await resp.json().catch(() => ({ reply: 'Ошибка ответа бота' }));
  return NextResponse.json(data, { status: 200 });
}
