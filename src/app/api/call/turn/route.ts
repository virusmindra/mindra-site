// src/app/api/call/turn/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";
import { prisma } from "@/server/prisma";
import { canUsePremiumVoice } from "@/lib/voice/debit";
import { limitReply } from "@/lib/limits/messages";

export const runtime = "nodejs";

const API_BASE = process.env.WEB_API_BASE_URL;

function pickLang(req: Request): "en" | "es" {
  const u = new URL(req.url);
  const l = (u.searchParams.get("lang") || u.searchParams.get("locale") || "en").toLowerCase();
  return l.startsWith("es") ? "es" : "en";
}

function absPricingUrl(req: Request, lang: "en" | "es") {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  return new URL(`/${lang}/pricing`, baseUrl).toString();
}

export async function POST(req: Request) {
  try {
    if (!API_BASE) {
      return NextResponse.json({ ok: false, error: "WEB_API_BASE_URL is not set" }, { status: 200 });
    }

    const lang = pickLang(req);
    const pricingUrl = absPricingUrl(req, lang);

    // auth
    const session = await getServerSession(authOptions);
    const authedUserId = (session?.user as any)?.id as string | undefined;

    // form data
    const form = await req.formData();

    // guest uid (если вдруг call вызывается без логина)
    const anonUidRaw =
      (form.get("uid") as string) ||
      (form.get("user_id") as string) ||
      (form.get("user_uid") as string) ||
      null;

    const anonUid = anonUidRaw ? String(anonUidRaw) : null;

    // stable userId (same idea as web-chat)
    const userId = authedUserId ?? (anonUid ? `web:${anonUid}` : "web-anon");

    // ✅ voice for call only when authed (even FREE)
    if (!authedUserId) {
      const msg = limitReply("monthly_voice", lang);
      return NextResponse.json(
        {
          ok: false,
          voiceBlocked: true,
          voiceReason: "login_required",
          reply:
            lang === "es"
              ? `💜 Inicia sesión para usar Call. 💜\n\n${msg.message}`
              : `💜 Please sign in to use Call. 💜\n\n${msg.message}`,
          limitBlocked: true,
          limitType: "monthly_voice",
          pricingUrl,
        },
        { status: 200 }
      );
    }

    // ✅ daily message limit blocks Call too (because you want one global daily limit)
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
      (ent as any).textDailyUsedAtDate = today;
      (ent as any).textDailyMessagesUsed = 0;
    }

    if (
      (ent as any).textDailyLimitEnabled &&
      (ent as any).textDailyMessagesUsed >= (ent as any).textDailyLimitMessages
    ) {
      const msg = limitReply("daily_text", lang);
      return NextResponse.json(
        {
          ok: false,
          limitBlocked: true,
          limitType: msg.kind,
          reply: `💜 ${msg.title}\n\n${msg.message} 💜`,
          pricingUrl,
        },
        { status: 200 }
      );
    }

    // ✅ voice minutes gate (call)
    const gate = await canUsePremiumVoice(prisma as any, userId, 15);
    if (!gate.ok) {
      const msg = limitReply("monthly_voice", lang);
      return NextResponse.json(
        {
          ok: false,
          voiceBlocked: true,
          voiceReason: gate.reason,
          reply: `💜 ${msg.title}\n\n${msg.message} 💜`,
          pricingUrl,
          voiceLeftSeconds: (gate as any).left,
          dailyLeftSeconds: (gate as any).dailyLeft,
        },
        { status: 200 }
      );
    }

    // ✅ passthrough to upstream
    const upstream = await fetch(`${API_BASE}/api/call/turn`, {
      method: "POST",
      body: form,
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Proxy error" }, { status: 200 });
  }
}
