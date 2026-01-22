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

    // form data (сначала!)
    const form = await req.formData();
    const wantVoice = form.get("wantVoice") === "1";

    // auth
    const session = await getServerSession(authOptions);
    const authedUserId = (session?.user as any)?.id as string | undefined;

    // guest uid (если вдруг call вызывается без логина)
    const anonUidRaw =
      (form.get("uid") as string) ||
      (form.get("user_id") as string) ||
      (form.get("user_uid") as string) ||
      null;

    const anonUid = anonUidRaw ? String(anonUidRaw) : null;

    // stable userId
    const userId = authedUserId ?? (anonUid ? `web:${anonUid}` : "web-anon");

    // Call voice only when authed
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

    // ✅ voice minutes gate (call) — 15 сек запрос для проверки
    if (wantVoice) {
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
  } catch (e: any) {
    console.log("[call/turn] error:", e?.message ?? e);
    return NextResponse.json({ ok: false, error: "Proxy error" }, { status: 200 });
  }
}
