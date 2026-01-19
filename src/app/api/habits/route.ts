// src/app/api/habits/route.ts
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

function getHabitsUrl() {
  const base = process.env.RENDER_BOT_URL;
  if (!base) throw new Error("RENDER_BOT_URL is not set");
  return new URL("/api/habits", base).toString();
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

async function enforceHabitsMonthlyLimit(userId: string, lang: "en" | "es") {
  const ent = await prisma.entitlement.upsert({
    where: { userId },
    create: { userId } as any,
    update: {},
  });

  const month = nyMonthKey();

  if ((ent as any).habitsUsedAtMonth !== month) {
    await prisma.entitlement.update({
      where: { userId },
      data: { habitsUsedAtMonth: month, habitsMonthlyUsed: 0 } as any,
    });
    (ent as any).habitsUsedAtMonth = month;
    (ent as any).habitsMonthlyUsed = 0;
  }

  if (
    (ent as any).habitsMonthlyLimitEnabled &&
    (ent as any).habitsMonthlyUsed >= (ent as any).habitsMonthlyLimit
  ) {
    const msg = limitReply("monthly_habits", lang);
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

async function incHabitsMonthlyUsed(userId: string) {
  await prisma.entitlement.update({
    where: { userId },
    data: { habitsMonthlyUsed: { increment: 1 } } as any,
  });
}

// GET /api/habits?user_id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id") || "web";

    const url = new URL(getHabitsUrl());
    url.searchParams.set("user_id", user_id);

    const upstream = await fetchWithTimeout(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, habits: [], error: "Invalid upstream response", raw: text };
    }

    return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status });
  } catch (e: any) {
    console.error("GET /api/habits error:", e);
    return NextResponse.json(
      { ok: false, habits: [], error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}

// POST /api/habits  body: { text, user_id?, uid? }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, lang } = await getUserIdAndLang(req, body);

    // 1) daily text limit (global 10/day)
    const blockedDaily = await enforceDailyTextLimit(userId, lang);
    if (blockedDaily) return blockedDaily;

    // 2) habits monthly limit
    const blockedHabits = await enforceHabitsMonthlyLimit(userId, lang);
    if (blockedHabits) return blockedHabits;

    // proxy to Render
    const url = new URL(getHabitsUrl());
    url.searchParams.set("user_id", userId);

    const upstream = await fetchWithTimeout(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        user_id: userId,
        userId,
      }),
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: "Invalid upstream response", raw: text };
    }

    if (upstream.ok) {
      await incHabitsMonthlyUsed(userId);
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    console.error("POST /api/habits error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
