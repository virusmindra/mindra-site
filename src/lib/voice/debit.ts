// src/lib/voice/debit.ts
import type { PrismaClient } from "@prisma/client";
import { PLAN_LIMITS, todayKeyNY, getVoiceLeftSeconds } from "./limits";

type DebitType = "TTS_CHAT" | "FACE_CALL";

const FREE_SECONDS = 180; // 3 min

function monthBoundsNY(now = new Date()) {
  // Простой и надежный способ: считаем “месяц” в America/New_York через formatToParts
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = Number(parts.find(p => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find(p => p.type === "month")?.value ?? "01"); // 1..12

  // start = 1 число текущего месяца 00:00 NY (приблизим как UTC даты по компонентам)
  // end = 1 число следующего месяца
  // (Для лимитов нам важна стабильная смена периода, абсолютная точность времени не критична)
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1, 0, 0, 0));
  return { start, end, key: `${y}-${String(m).padStart(2, "0")}` };
}

async function ensureEntitlement(prisma: PrismaClient, userId: string) {
  const { start, end } = monthBoundsNY(new Date());

  // Создаем entitlement если нет
  let ent = await prisma.entitlement.findUnique({ where: { userId } });
  if (!ent) {
    ent = await prisma.entitlement.create({
      data: {
        userId,
        // FREE старт
        tts: true,
        plus: false,
        pro: false,

        voiceSecondsTotal: 180, // 3 минуты
        voiceSecondsUsed: 0,

        dailyLimitEnabled: true,
        dailyLimitSeconds: 60, // можно поменять/убрать, если не надо daily для FREE
        dailySecondsUsed: 0,
        dailyUsedAtDate: todayKeyNY(),

        maxFaceTimeMinutes: 0,

        voicePeriodStart: start,
        voicePeriodEnd: end,
      },
    });
    return ent;
  }

  // Если ent есть — проверяем, не сменился ли месяц (период)
  const prevEnd = ent.voicePeriodEnd?.getTime() ?? null;
  const nextEnd = end.getTime();

  const isNewPeriod = prevEnd === null || prevEnd !== nextEnd;
  if (isNewPeriod) {
    ent = await prisma.entitlement.update({
      where: { userId },
      data: {
        // FREE всегда должен иметь tts=true, если ты хочешь 3 бесплатные минуты
        // (если хочешь “только после логина” — это отдельно, но entitlement пусть будет)
        tts: true,

        // На новый месяц — сброс
        voiceSecondsTotal: Math.max(ent.voiceSecondsTotal ?? 0, 180),
        voiceSecondsUsed: 0,
        dailySecondsUsed: 0,
        dailyUsedAtDate: todayKeyNY(),
        voicePeriodStart: start,
        voicePeriodEnd: end,
      },
    });
  }

  // Если почему-то total=0 — восстановим FREE минимум
  if ((ent.voiceSecondsTotal ?? 0) <= 0) {
    ent = await prisma.entitlement.update({
      where: { userId },
      data: { voiceSecondsTotal: 180, tts: true },
    });
  }

  return ent;
}


export async function canUsePremiumVoice(prisma: PrismaClient, userId: string, wantSeconds: number) {
  // 1) entitlement гарантируем
  let ent = await prisma.entitlement.findUnique({ where: { userId } });
  if (!ent) {
    ent = await prisma.entitlement.create({
      data: {
        userId,
        tts: true,
        plus: false,
        pro: false,
        voiceSecondsTotal: FREE_SECONDS,
        voiceSecondsUsed: 0,

        dailyLimitEnabled: true,
        dailyLimitSeconds: 60, // можешь 0 если не хочешь daily
        dailySecondsUsed: 0,
        dailyUsedAtDate: "",

        maxFaceTimeMinutes: 0,
        voicePeriodStart: null,
        voicePeriodEnd: null,
      } as any,
    });
  }

  // 2) subscription НЕ обязателен: если нет — считаем FREE
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const rawPlan = String(sub?.plan ?? "FREE").toUpperCase();
  const plan = (rawPlan in PLAN_LIMITS ? rawPlan : "FREE") as keyof typeof PLAN_LIMITS;

  // 3) если вдруг у старых ent total=0 — даём FREE_SECONDS
  const total = ent.voiceSecondsTotal > 0 ? ent.voiceSecondsTotal : FREE_SECONDS;
  const used = ent.voiceSecondsUsed ?? 0;
  const left = Math.max(0, total - used);

  // 4) daily rollover
  const tk = todayKeyNY();
  let dailyUsed = ent.dailySecondsUsed ?? 0;
  let dailyDate = ent.dailyUsedAtDate ?? "";

  if (dailyDate !== tk) {
    dailyUsed = 0;
    dailyDate = tk;
  }

  const dailyLimit =
    (ent.dailyLimitSeconds ?? 0) > 0 ? (ent.dailyLimitSeconds as any) : PLAN_LIMITS[plan].dailySecondsDefault;

  // 5) gates
  if (!ent.tts) return { ok: false as const, reason: "tts_disabled" as const, left };
  if (left <= 0) return { ok: false as const, reason: "monthly_exhausted" as const, left };
  if (wantSeconds > left) return { ok: false as const, reason: "insufficient_left" as const, left };

  if (ent.dailyLimitEnabled && dailyLimit > 0 && dailyUsed + wantSeconds > dailyLimit) {
    return {
      ok: false as const,
      reason: "daily_limit" as const,
      left,
      dailyLeft: Math.max(0, dailyLimit - dailyUsed),
    };
  }

  // ✅ важно: если rollover — сохраним
  if ((ent.dailyUsedAtDate ?? "") !== dailyDate || (ent.dailySecondsUsed ?? 0) !== dailyUsed) {
    await prisma.entitlement.update({
      where: { userId },
      data: { dailySecondsUsed: dailyUsed, dailyUsedAtDate: dailyDate },
    });
  }

  return { ok: true as const, left, tk, dailyUsed, dailyLimit };
}

export async function debitPremiumVoice(
  prisma: PrismaClient,
  args: { userId: string; seconds: number; type: DebitType; sessionId?: string; meta?: any }
) {
  const sec = Math.max(1, Math.floor(args.seconds));
  const tk = todayKeyNY();

  return prisma.$transaction(async (tx) => {
    // важно: тоже ensure period / create
    const ent0 = await ensureEntitlement(tx as any, args.userId);

    if (!ent0.tts) throw new Error("TTS disabled");

    // daily rollover
    let dailyUsed = ent0.dailySecondsUsed ?? 0;
    let dailyDate = ent0.dailyUsedAtDate ?? "";

    if (dailyDate !== tk) {
      dailyUsed = 0;
      dailyDate = tk;
    }

    const left = Math.max(0, (ent0.voiceSecondsTotal ?? 0) - (ent0.voiceSecondsUsed ?? 0));
    if (left < sec) throw new Error("Not enough voice seconds");

    const dailyLimit = ent0.dailyLimitSeconds && ent0.dailyLimitSeconds > 0 ? ent0.dailyLimitSeconds : 0;
    if (ent0.dailyLimitEnabled && dailyLimit > 0 && dailyUsed + sec > dailyLimit) {
      throw new Error("Daily limit reached");
    }

    await tx.entitlement.update({
      where: { userId: args.userId },
      data: {
        voiceSecondsUsed: { increment: sec },
        dailySecondsUsed: { set: dailyUsed + sec },
        dailyUsedAtDate: { set: dailyDate },
      },
    });

    await tx.voiceLedger.create({
      data: {
        userId: args.userId,
        type: args.type,
        seconds: sec,
        sessionId: args.sessionId,
        meta: args.meta ?? {},
      },
    });

    return { debited: sec };
  });
}
