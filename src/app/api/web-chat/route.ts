// src/app/api/web-chat/route.ts
export const runtime = 'edge'; // быстрый старт, ближе к пользователю

// греем Render ровно один раз на первом запросе
let warmed = false;

// утилита таймаута для fetch на edge
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 15000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request) {
  try {
    const URL_FULL = process.env.RENDER_BOT_URL;
    if (!URL_FULL) {
      return new Response(JSON.stringify({ reply: 'Server is not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // прогрев (неглотает ошибку, выполняется фоном)
    if (!warmed) {
      warmed = true;
      const warmUrl = new URL('/', URL_FULL).toString();
      fetch(warmUrl, { cache: 'no-store' }).catch(() => {});
    }

    // читаем тело
    const { input, sessionId } = await req.json();

    // основной запрос к FastAPI на Render
    let upstream: Response;
    try {
      upstream = await fetchWithTimeout(URL_FULL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // cache: 'no-store' — на edge не обязательно, но можно оставить
        body: JSON.stringify({
          userId: 'web-anon',                 // на edge не дергаем getCurrentUser
          sessionId: sessionId ?? 'default',
          input: input ?? '',
        }),
      }, 15000); // 15s таймаут
    } catch (e) {
      // таймаут/сеть
      return new Response(JSON.stringify({ reply: 'Upstream timeout' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = await upstream.text();
    // если Render ответил ошибкой — прокинем «красиво»
    if (!upstream.ok) {
      // попробуем отдать тело как есть, но с нашим сообщением
      let payload: any;
      try { payload = JSON.parse(text); }
      catch { payload = { reply: 'Upstream error' }; }
      return new Response(JSON.stringify(payload), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // успешный ответ
    // (FastAPI отдает { reply: string }, но на всякий — парсим/нормализуем)
    let data: any;
    try { data = JSON.parse(text); }
    catch { data = { reply: text || 'Empty response' }; }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ reply: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
