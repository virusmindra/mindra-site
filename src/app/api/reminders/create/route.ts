// src/app/api/reminds/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";
import { limitReply } from "@/lib/limits/messages";

export const runtime = "nodejs";

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
        message: `💜 ${msg.title}\n\n${msg.message}`,
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

async function enforceRemindersMonthlyLimit(userId: string, lang: "en" | "es") {
  const ent = await prisma.entitlement.upsert({
    where: { userId },
    create: { userId } as any,
    update: {},
  });

  const month = nyMonthKey();

  if ((ent as any).remindersUsedAtMonth !== month) {
    await prisma.entitlement.update({
      where: { userId },
      data: { remindersUsedAtMonth: month, remindersMonthlyUsed: 0 } as any,
    });
    (ent as any).remindersUsedAtMonth = month;
    (ent as any).remindersMonthlyUsed = 0;
  }

  if (
    (ent as any).remindersMonthlyLimitEnabled &&
    (ent as any).remindersMonthlyUsed >= (ent as any).remindersMonthlyLimit
  ) {
    const msg = limitReply("monthly_reminders", lang);
    return NextResponse.json(
      {
        ok: false,
        limitBlocked: true,
        limitType: msg.kind,
        message: `💜 ${msg.title}\n\n${msg.message}`,
        pricingUrl: msg.pricingUrl,
        cta: msg.cta,
      },
      { status: 200 },
    );
  }

  return null;
}

async function incRemindersMonthlyUsed(userId: string) {
  await prisma.entitlement.update({
    where: { userId },
    data: { remindersMonthlyUsed: { increment: 1 } } as any,
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);

  const rawLang = body?.lang ?? body?.locale ?? "en";
  const lang: "en" | "es" = String(rawLang).toLowerCase().startsWith("es") ? "es" : "en";

  const text = String(body?.text || "").trim();
  const dueInMin = Number(body?.dueInMin);

  if (!text) {
    return NextResponse.json({ ok: false, error: "Missing text" }, { status: 400 });
  }
  if (!Number.isFinite(dueInMin) || dueInMin < 0 || dueInMin > 60 * 24 * 365) {
    return NextResponse.json({ ok: false, error: "Invalid dueInMin" }, { status: 400 });
  }

  // 1) daily text limit (global 10/day)
  const blockedDaily = await enforceDailyTextLimit(userId, lang);
  if (blockedDaily) return blockedDaily;

  // 2) monthly reminders limit
  const blockedRem = await enforceRemindersMonthlyLimit(userId, lang);
  if (blockedRem) return blockedRem;

  const dueUtc = new Date(Date.now() + dueInMin * 60_000);

  const r = await prisma.reminder.create({
    data: {
      userId,
      text,
      dueUtc,
      status: "scheduled",
    } as any,
  });

  await incRemindersMonthlyUsed(userId);

  return NextResponse.json({
    ok: true,
    reminder: { id: r.id.toString(), dueUtc: r.dueUtc, text: r.text },
  });
}
