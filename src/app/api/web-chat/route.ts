// src/app/api/web-chat/route.ts

let warmed = false;

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
      return new Response(JSON.stringify({ reply: "Server is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!warmed) {
      warmed = true;
      const warmUrl = new URL("/", URL_FULL).toString();
      fetch(warmUrl, { cache: "no-store" }).catch(() => {});
    }

// читаем body безопасно
const body = await req.json().catch(() => ({}));

const input = body?.input ?? "";
const sessionId = body?.sessionId ?? "default";
const feature = body?.feature ?? "default";

// реальный uid
const userId = body?.user_id ?? "web-anon";

// язык ТОЛЬКО en | es
const rawLang = body?.lang ?? body?.locale ?? "en";
const lang = String(rawLang).toLowerCase().startsWith("es") ? "es" : "en";

    let upstream: Response;
    try {
      upstream = await fetchWithTimeout(
        URL_FULL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            sessionId,
            input,
            feature,
            lang,
            source: "web",
          }),
        },
        15000,
      );
    } catch {
      return new Response(JSON.stringify({ reply: "Upstream timeout" }), {
        status: 504,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text = await upstream.text();

    if (!upstream.ok) {
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { reply: "Upstream error" };
      }
      return new Response(JSON.stringify(payload), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { reply: text || "Empty response" };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ reply: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
