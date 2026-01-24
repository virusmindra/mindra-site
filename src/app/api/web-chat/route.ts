// src/app/api/web-chat/route.ts

import { prisma } from "@/server/db/prisma"; // ✅ важно
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

    if (!warmed) {
      warmed = true;
      const warmUrl = new URL("/", URL_FULL).toString();
      fetch(warmUrl, { cache: "no-store" }).catch(() => {});
    }

    const body = await req.json().catch(() => ({} as any));

    const input = String(body?.input ?? "");
    const sessionId = String(body?.sessionId ?? "default");
    const feature = String(body?.feature ?? "default");

    const rawLang = body?.lang ?? body?.locale ?? "en";
    const lang: "en" | "es" = String(rawLang).toLowerCase().startsWith("es") ? "es" : "en";
    const locale = lang;

    const wantVoice = Boolean(body?.wantVoice);

    const session = await getServerSession(authOptions);
    const authedUserId = (session?.user as any)?.id as string | undefined;

    const anonUidRaw = body?.uid ?? body?.user_uid ?? body?.user_id ?? null;
    const anonUid = anonUidRaw ? String(anonUidRaw) : null;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
    const pricingUrl = new URL(`/${locale}/pricing`, baseUrl).toString(); // ✅ кликабельная

    const userId = authedUserId ?? (anonUid ? `web:${anonUid}` : "web-anon");

    // voice требует login (даже FREE 3 min)
    if (wantVoice && !authedUserId) {
      const msg = limitReply("monthly_voice", lang);
      return new Response(
        JSON.stringify({
          reply:
            lang === "es"
              ? `💜 Inicia sesión para usar voz.\n\n${msg.message} 💜`
              : `💜 Please sign in to use voice.\n\n${msg.message} 💜`,
          voiceBlocked: true,
          voiceReason: "login_required",
          pricingUrl,
          cta: msg.cta,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // DAILY TEXT LIMIT (общий)
    const ent = await prisma.entitlement.upsert({
      where: { userId },
      create: { userId } as any,
      update: {},
    });

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    if ((ent as any).textDailyUsedAtDate !== today) {
      await prisma.entitlement.update({
        where: { userId },
        data: { textDailyUsedAtDate: today, textDailyMessagesUsed: 0 } as any,
      });
      (ent as any).textDailyMessagesUsed = 0;
    }

    if ((ent as any).textDailyLimitEnabled && (ent as any).textDailyMessagesUsed >= (ent as any).textDailyLimitMessages) {
      const msg = limitReply("daily_text", lang);
      return new Response(
        JSON.stringify({
          reply: `💜 ${msg.title}\n\n${msg.message} 💜`,
          limitBlocked: true,
          limitType: msg.kind,
          pricingUrl,
          cta: msg.cta,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.entitlement.update({
      where: { userId },
      data: { textDailyMessagesUsed: { increment: 1 } } as any,
    });

    // VOICE GATE
    if (wantVoice) {
      const gate = await canUsePremiumVoice(prisma as any, userId, 15);
      if (!gate.ok) {
        const msg = limitReply("monthly_voice", lang);
        return new Response(
          JSON.stringify({
            reply: `💜 ${msg.title}\n\n${msg.message} 💜`,
            voiceBlocked: true,
            voiceReason: gate.reason,
            voiceLeftSeconds: "left" in gate ? (gate as any).left : undefined,
            dailyLeftSeconds: (gate as any).dailyLeft ?? undefined,
            pricingUrl,
            cta: msg.cta,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // upstream
    const upstream = await fetchWithTimeout(
      URL_FULL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId, input, feature, lang, source: "web", wantVoice }),
      },
      15000
    );

    const text = await upstream.text();
  const data = (() => {
  try {
    return JSON.parse(text);
  } catch {
    return { reply: text || "Empty response" };
  }
})();

if (!upstream.ok) {
  return new Response(JSON.stringify(data), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}

// after data parsed and upstream.ok
try {
  const profile = data?.memoryUpdates?.profile;
  const items = data?.memoryUpdates?.memories;

  if (authedUserId && (profile || (Array.isArray(items) && items.length))) {
    // profile upsert
    if (profile) {
      await prisma.userProfile.upsert({
        where: { userId: authedUserId },
        create: {
          userId: authedUserId,
          displayName: profile.name ?? null,
          about: profile.about ?? null,
          style: profile.style ?? null,
        },
        update: {
          displayName: profile.name ?? undefined,
          about: profile.about ?? undefined,
          style: profile.style ?? undefined,
        },
      });
    }

    // memories insert (простая версия без дедупа)
    // важно: модель MemoryItem должна существовать в schema.prisma
    if (Array.isArray(items) && items.length) {
      for (const m of items.slice(0, 10)) {
        const kind = String(m.kind ?? "note");
        const content = String(m.content ?? "").trim();
        const salience = Number(m.salience ?? 1) || 1;
        if (!content) continue;

        await (prisma as any).memoryItem.create({
          data: { userId: authedUserId, kind, content, salience },
        });
      }
    }
  }
} catch {
  // не ломаем чат если память не сохранилась
}

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
    } catch (err) {
    console.error("[WEB-CHAT] fatal error", err);
    return new Response(
      JSON.stringify({ reply: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
