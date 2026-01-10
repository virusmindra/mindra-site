// src/app/api/web-chat/route.ts

import { prisma } from "@/server/prisma";
import { canUsePremiumVoice, debitPremiumVoice } from "@/lib/voice/debit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";

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

    // язык ТОЛЬКО en | es (пока так)
    const rawLang = body?.lang ?? body?.locale ?? "en";
    const lang = String(rawLang).toLowerCase().startsWith("es") ? "es" : "en";

    // ✅ хочет ли юзер премиум-голос (ElevenLabs)
    const wantVoice = Boolean(body?.wantVoice);

    // ✅ userId ТОЛЬКО из сессии (trust no client)
    const session = await getServerSession(authOptions);
    const authedUserId = (session?.user as any)?.id as string | undefined;

    // premium voice only: если нет сессии — не даём голос
    if (wantVoice && !authedUserId) {
      return new Response(
        JSON.stringify({
          reply: "Please sign in to use premium voice.",
          voiceBlocked: true,
          voiceReason: "login_required",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = authedUserId ?? "web-anon";

    // ✅ 1) GATE: если хотят ElevenLabs — проверяем лимиты ДО запроса к боту
    if (wantVoice) {
      const gate = await canUsePremiumVoice(prisma as any, userId, 15);
      if (!gate.ok) {
        return new Response(
          JSON.stringify({
            reply:
              gate.reason === "monthly_exhausted"
                ? "Your premium voice minutes for this month are finished. You can continue in text or upgrade/buy more minutes."
                : gate.reason === "daily_limit"
                  ? "Daily voice limit reached. You can continue in text or change daily limits in settings."
                  : "Premium voice is not available right now.",
            voiceBlocked: true,
            voiceReason: gate.reason,
            voiceLeftSeconds: "left" in gate ? gate.left : undefined,
            dailyLeftSeconds: (gate as any).dailyLeft ?? undefined,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ✅ 2) Запрос к боту (Render)
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
            wantVoice, // ✅ сигнал на Render: делать ElevenLabs или нет
          }),
        },
        15000
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

    // ✅ 3) DEBIT: если реально есть премиум-аудио — списываем фактические секунды
    const audioSeconds =
      (data?.tts?.provider === "elevenlabs" ? Number(data?.tts?.seconds) : NaN) ||
      Number(data?.audioSeconds);

    if (wantVoice && Number.isFinite(audioSeconds) && audioSeconds > 0) {
      try {
        await debitPremiumVoice(prisma as any, {
          userId,
          seconds: Math.ceil(audioSeconds),
          type: "TTS_CHAT",
          sessionId,
          meta: { source: "web-chat", feature, lang },
        });
        data.voiceDebited = true;
      } catch {
        data.voiceDebited = false;
        data.voiceDebitError = "debit_failed";
      }
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
