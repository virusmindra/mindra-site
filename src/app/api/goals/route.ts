// src/app/api/goals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";
import { limitReply } from "@/lib/limits/messages";

export const runtime = "nodejs";

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 15000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function getGoalsUrl() {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error("RENDER_BOT_URL is not set");
  return new URL("/api/goals", base).toString();
}

function nyDayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
}
function nyMonthKey() {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
}

async function getUserIdAndLang(req: Request, body: any) {
  const rawLang = body?.lang ?? body?.locale ?? "en";
  const lang: "en" | "es" = String(rawLang).toLowerCase().startsWith("es") ? "es" : "en";

  const session = await getServerSession(authOptions);
  const authedUserId = (session?.user as any)?.id as string | undefined;

  const anonUidRaw = body?.uid ?? body?.user_uid ?? body?.user_id ?? null;
  const anonUid = anonUidRaw ? String(anonUidRaw) : null;

  const userId = authedUserId ?? (anonUid ? `web:${anonUid}` : "web-anon");
  return { userId, lang };
}

async function enforceDailyTextLimit(userId: string, lang: "en" | "es") {
  const ent = await prisma.entitlement.upsert({
    where: { userId },
    create: { userId } as any,
    update: {},
  });

  const today = nyDayKey();

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
        reply: `💜 ${msg.title}\n\n${msg.message}`,
        pricingUrl: msg.pricingUrl,
        cta: msg.cta,
      },
      { status: 200 },
    );
  }

  await prisma.entitlement.update({
    where: { userId },
    data: { textDailyMessagesUsed: { increment: 1 } } as any,
  });

  return null;
}

async function enforceGoalsMonthlyLimit(userId: string, lang: "en" | "es") {
  const ent = await prisma.entitlement.upsert({
    where: { userId },
    create: { userId } as any,
    update: {},
  });

  const month = nyMonthKey();

  if ((ent as any).goalsUsedAtMonth !== month) {
    await prisma.entitlement.update({
      where: { userId },
      data: { goalsUsedAtMonth: month, goalsMonthlyUsed: 0 } as any,
    });
    (ent as any).goalsUsedAtMonth = month;
    (ent as any).goalsMonthlyUsed = 0;
  }

  if (
    (ent as any).goalsMonthlyLimitEnabled &&
    (ent as any).goalsMonthlyUsed >= (ent as any).goalsMonthlyLimit
  ) {
    const msg = limitReply("monthly_goals", lang);
    return NextResponse.json(
      {
        ok: false,
        limitBlocked: true,
        limitType: msg.kind,
        reply: `💜 ${msg.title}\n\n${msg.message}`,
        pricingUrl: msg.pricingUrl,
        cta: msg.cta,
      },
      { status: 200 },
    );
  }

  return null;
}

async function incGoalsMonthlyUsed(userId: string) {
  // safe increment (month reset already handled)
  await prisma.entitlement.update({
    where: { userId },
    data: { goalsMonthlyUsed: { increment: 1 } } as any,
  });
}

// ------------------------
// GET /api/goals (proxy list)
// ------------------------
export async function GET(req: Request) {
  try {
    const url = getGoalsUrl();
    const upstream = await fetchWithTimeout(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { goals: [] };
    }

    return new Response(JSON.stringify(data), {
      status: upstream.ok ? 200 : upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/goals error:", e);
    return new Response(JSON.stringify({ goals: [], error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ------------------------
// POST /api/goals (create goal) + limits
// ------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, lang } = await getUserIdAndLang(req, body);

    // 1) daily text limit (global 10/day)
    const blockedDaily = await enforceDailyTextLimit(userId, lang);
    if (blockedDaily) return blockedDaily;

    // 2) goals monthly limit (3/30/∞)
    const blockedGoals = await enforceGoalsMonthlyLimit(userId, lang);
    if (blockedGoals) return blockedGoals;

    // proxy to Render
    const url = getGoalsUrl();
    const upstream = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        user_id: userId, // ✅ подстрахуем, если Render читает user_id
        userId,          // ✅ и если читает userId
      }),
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: "Invalid upstream response" };
    }

    if (upstream.ok) {
      // increment monthly used only on success
      await incGoalsMonthlyUsed(userId);
    }

    return new Response(JSON.stringify(data), {
      status: upstream.ok ? upstream.status : upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("POST /api/goals error:", e);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
