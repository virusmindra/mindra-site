// src/app/api/web-chat/route.ts
import { prisma } from "@/server/db/prisma";
import { canUsePremiumVoice, debitPremiumVoice } from "@/lib/voice/debit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";
import { limitReply } from "@/lib/limits/messages";
import crypto from "crypto";

export const runtime = "nodejs";

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

function hashContent(kind: string, content: string) {
  return crypto
    .createHash("sha256")
    .update(`${kind}:${content}`.toLowerCase())
    .digest("hex");
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
    const pricingUrl = new URL(`/${locale}/pricing`, baseUrl).toString();

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

    if (
      (ent as any).textDailyLimitEnabled &&
      (ent as any).textDailyMessagesUsed >= (ent as any).textDailyLimitMessages
    ) {
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

    // =========================
    // MEMORY RECALL (before fetch)
    // =========================
    let memoryContext: any = null;

    if (authedUserId) {
      try {
        const profile = await prisma.userProfile.findUnique({
          where: { userId: authedUserId },
        });

        const memories =
          (await (prisma as any).memoryItem?.findMany?.({
            where: { userId: authedUserId },
            orderBy: [{ salience: "desc" }, { updatedAt: "desc" }],
            take: 12,
            select: { kind: true, content: true, salience: true, updatedAt: true },
          })) ?? [];

        const now = Date.now();
        const scored = (Array.isArray(memories) ? memories : [])
          .map((m: any) => {
            const days = m?.updatedAt ? (now - new Date(m.updatedAt).getTime()) / 86400000 : 0;
            const sal = Number(m?.salience ?? 1) || 1;
            const score = sal * 10 - days;
            return { ...m, score };
          })
          .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 8)
          .map((m: any) => ({
            kind: String(m.kind ?? "note"),
            content: String(m.content ?? ""),
            salience: Number(m.salience ?? 1) || 1,
          }));

        memoryContext = {
          profile: profile
            ? {
                name: profile.displayName ?? null,
                about: profile.about ?? null,
                style: profile.style ?? null,
              }
            : null,
          memories: scored,
        };
      } catch {
        memoryContext = null;
      }
    }

    // =========================
    // SAVE USER MESSAGE (best-effort)
    // =========================
    try {
      await prisma.chatSession.upsert({
        where: { id: sessionId },
        create: { id: sessionId, userId, title: "Chat" } as any,
        update: { userId } as any,
      });

      if (input.trim()) {
        await prisma.message.create({
          data: { sessionId, role: "user", content: input },
        });
      }
    } catch (e) {
      console.warn("[web-chat] save user msg skipped", e);
    }

    // =========================
    // upstream → Render
    // =========================
    const upstream = await fetchWithTimeout(
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
          memoryContext,
        }),
      },
      15000
    );

    const text = await upstream.text();

    const data: any = (() => {
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

    // =========================
    // SAVE ASSISTANT MESSAGE (best-effort)
    // =========================
    try {
      const replyText = String(data?.reply ?? "");
      if (replyText.trim()) {
        await prisma.message.create({
          data: { sessionId, role: "assistant", content: replyText },
        });
      }

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    } catch (e) {
      console.warn("[web-chat] save assistant msg skipped", e);
    }

    // =========================
    // MEMORY SAVE (safe, no crash)
    // =========================
    try {
      const p = data?.memoryUpdates?.profile;
      const items = data?.memoryUpdates?.memories;

      if (authedUserId && (p || (Array.isArray(items) && items.length))) {
        if (p) {
          await prisma.userProfile.upsert({
            where: { userId: authedUserId },
            create: {
              userId: authedUserId,
              displayName: p.name ?? null,
              about: p.about ?? null,
              style: p.style ?? null,
            },
            update: {
              displayName: p.name ?? undefined,
              about: p.about ?? undefined,
              style: p.style ?? undefined,
            },
          });
        }

        if (Array.isArray(items)) {
          for (const m of items.slice(0, 10)) {
            const kind = String(m?.kind ?? "note");
            const content = String(m?.content ?? "").trim();
            const salience = Number(m?.salience ?? 1) || 1;
            if (!content) continue;

            const contentHash = hashContent(kind, content);

            const existing =
              (await (prisma as any).memoryItem?.findFirst?.({
                where: { userId: authedUserId, contentHash },
                select: { id: true, salience: true },
              })) ?? null;

            if (existing?.id) {
              await (prisma as any).memoryItem.update({
                where: { id: existing.id },
                data: {
                  salience: Math.min(3, Math.max(Number(existing.salience ?? 1), salience)),
                  content,
                  kind,
                },
              });
            } else {
              await (prisma as any).memoryItem?.create?.({
                data: { userId: authedUserId, kind, content, salience, contentHash },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("[memory] save skipped", e);
    }

    // =========================
    // VOICE DEBIT
    // =========================
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
  } catch (e) {
    console.error("WEB_CHAT_FATAL", e);
    return new Response(JSON.stringify({ reply: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
