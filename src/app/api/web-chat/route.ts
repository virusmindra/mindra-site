// src/app/api/web-chat/route.ts

import { prisma } from "@/server/prisma";
import { canUsePremiumVoice, debitPremiumVoice } from "@/lib/voice/debit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";
import { limitReply } from "@/lib/limits/messages";

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

    // warm Render once
    if (!warmed) {
      warmed = true;
      const warmUrl = new URL("/", URL_FULL).toString();
      fetch(warmUrl, { cache: "no-store" }).catch(() => {});
    }

    // safe body
    const body = await req.json().catch(() => ({} as any));

    const input = String(body?.input ?? "");
    const sessionId = String(body?.sessionId ?? "default");
    const feature = String(body?.feature ?? "default");

    // lang only en|es
    const rawLang = body?.lang ?? body?.locale ?? "en";
    const lang: "en" | "es" = String(rawLang).toLowerCase().startsWith("es") ? "es" : "en";

    // wants premium voice (ElevenLabs)
    const wantVoice = Boolean(body?.wantVoice);

    // session userId (ONLY trusted for authed)
    const session = await getServerSession(authOptions);
    const authedUserId = (session?.user as any)?.id as string | undefined;

    // anon uid (ONLY for guests)
    const anonUidRaw = body?.uid ?? body?.user_uid ?? body?.user_id ?? null;
    const anonUid = anonUidRaw ? String(anonUidRaw) : null;

    // ✅ stable userId
    // authed -> real userId
    // guest -> web:<uid>
    // fallback -> web-anon
    const userId = authedUserId ?? (anonUid ? `web:${anonUid}` : "web-anon");

    // premium voice only: no session -> block voice (even FREE voice minutes require login)
    if (wantVoice && !authedUserId) {
      const msg = limitReply("monthly_voice", lang); // reuse upgrade copy
      return new Response(
        JSON.stringify({
          reply:
            lang === "es"
              ? `💜 Inicia sesión para usar voz.\n\n${msg.message}`
              : `💜 Please sign in to use voice.\n\n${msg.message}`,
          voiceBlocked: true,
          voiceReason: "login_required",
          pricingUrl: msg.pricingUrl,
          cta: msg.cta,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ TEXT LIMIT: общий на все фичи (FREE: 10/day)
    const ent = await prisma.entitlement.upsert({
      where: { userId },
      create: { userId } as any,
      update: {},
    });

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD

    // reset daily counter on new day
    if ((ent as any).textDailyUsedAtDate !== today) {
      await prisma.entitlement.update({
        where: { userId },
        data: { textDailyUsedAtDate: today, textDailyMessagesUsed: 0 } as any,
      });
      (ent as any).textDailyUsedAtDate = today;
      (ent as any).textDailyMessagesUsed = 0;
    }

    if (
      (ent as any).textDailyLimitEnabled &&
      (ent as any).textDailyMessagesUsed >= (ent as any).textDailyLimitMessages
    ) {
      const msg = limitReply("daily_text", lang);
      return new Response(
        JSON.stringify({
          reply: `💜 ${msg.title}\n\n${msg.message}`,
          limitBlocked: true,
          limitType: msg.kind,
          pricingUrl: msg.pricingUrl,
          cta: msg.cta,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // increment BEFORE upstream call (counts any message in any feature)
    await prisma.entitlement.update({
      where: { userId },
      data: { textDailyMessagesUsed: { increment: 1 } } as any,
    });

    // ✅ 1) VOICE GATE: check limits BEFORE bot call
    if (wantVoice) {
      const gate = await canUsePremiumVoice(prisma as any, userId, 15);
      if (!gate.ok) {
        if (gate.reason === "monthly_exhausted") {
          const msg = limitReply("monthly_voice", lang);
          return new Response(
            JSON.stringify({
              reply: `💜 ${msg.title}\n\n${msg.message}`,
              voiceBlocked: true,
              voiceReason: gate.reason,
              voiceLeftSeconds: "left" in gate ? (gate as any).left : undefined,
              dailyLeftSeconds: (gate as any).dailyLeft ?? undefined,
              pricingUrl: msg.pricingUrl,
              cta: msg.cta,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // daily voice limit or other reasons (also suggest pricing)
        const msg = limitReply("monthly_voice", lang);
        return new Response(
          JSON.stringify({
            reply:
              gate.reason === "daily_limit"
                ? lang === "es"
                  ? `💜 Límite diario de voz alcanzado.\n\nPuedes seguir en texto o actualizar tu plan. 💜\n\n👉 Pricing: ${msg.pricingUrl}`
                  : `💜 Daily voice limit reached.\n\nYou can continue in text or upgrade your plan. 💜\n\n👉 Pricing: ${msg.pricingUrl}`
                : lang === "es"
                  ? `💜 La voz premium no está disponible ahora.\n\n👉 Pricing: ${msg.pricingUrl}`
                  : `💜 Premium voice is not available right now.\n\n👉 Pricing: ${msg.pricingUrl}`,
            voiceBlocked: true,
            voiceReason: gate.reason,
            voiceLeftSeconds: "left" in gate ? (gate as any).left : undefined,
            dailyLeftSeconds: (gate as any).dailyLeft ?? undefined,
            pricingUrl: msg.pricingUrl,
            cta: msg.cta,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ✅ 2) Call Render bot
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
            wantVoice,
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

    // ✅ 3) DEBIT voice seconds if ElevenLabs audio returned
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
