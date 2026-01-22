import { PLAN_LIMITS, todayKeyNY, getVoiceLeftSeconds } from "./limits";
import type { PrismaClient, Entitlement, Subscription } from "@prisma/client";

type DebitType = "TTS_CHAT" | "FACE_CALL";

function nextMonthPeriodNY(now = new Date()) {
  // periodStart = now, periodEnd = 1-е число следующего месяца 00:00 NY
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find(p => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find(p => p.type === "month")?.value ?? "01"); // 1..12

  // 1-е число след. месяца
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;

  // Собираем “вроде бы” UTC дату, но нам важен только факт сравнения (end > now)
  const periodEnd = new Date(Date.UTC(nextY, nextM - 1, 1, 0, 0, 0));
  return { periodStart: now, periodEnd };
}

async function ensureEntitlement(tx: PrismaClient, userId: string) {
  // Создаем entitlement с дефолтами схемы, если нет
  let ent = await tx.entitlement.findUnique({ where: { userId } });
  if (!ent) ent = await tx.entitlement.create({ data: { userId } as any });
  return ent;
}

function normalizePlan(sub?: Subscription | null) {
  const raw = String(sub?.plan ?? "FREE").toUpperCase();
  return (raw in PLAN_LIMITS ? raw : "FREE") as keyof typeof PLAN_LIMITS;
}

/**
 * FREE: 3 минуты/месяц (180 сек) по умолчанию.
 * PLUS/PRO: как выставит stripe-sync (voiceSecondsTotal), но мы не ломаем если уже стоит.
 */
export async function canUsePremiumVoice(
  prisma: PrismaClient,
  userId: string,
  wantSeconds: number
) {
  const sub = await prisma.subscription.findUnique({ where: { userId } }).catch(() => null);
  const plan = normalizePlan(sub);

  // ensure entitlement
  let ent = await ensureEntitlement(prisma as any, userId);

  // ✅ включаем tts для FREE тоже (иначе 3 минуты никогда не появятся)
  if (!ent.tts) {
    ent = await prisma.entitlement.update({
      where: { userId },
      data: { tts: true },
    });
  }

  // ✅ месячный лимит для FREE
  const freeMonthly = 180;
  const shouldForceFreeTotal = plan === "FREE" && (ent.voiceSecondsTotal ?? 0) <= 0;

  if (shouldForceFreeTotal) {
    const { periodStart, periodEnd } = nextMonthPeriodNY(new Date());
    ent = await prisma.entitlement.update({
      where: { userId },
      data: {
        voiceSecondsTotal: freeMonthly,
        voiceSecondsUsed: 0,
        voicePeriodStart: periodStart,
        voicePeriodEnd: periodEnd,
        dailySecondsUsed: 0,
        dailyUsedAtDate: "",
      },
    });
  }

  // ✅ monthly rollover (для FREE — по voicePeriodEnd)
  const now = new Date();
  if (plan === "FREE" && ent.voicePeriodEnd && now.getTime() >= ent.voicePeriodEnd.getTime()) {
    const { periodStart, periodEnd } = nextMonthPeriodNY(now);
    ent = await prisma.entitlement.update({
      where: { userId },
      data: {
        voiceSecondsUsed: 0,
        voiceSecondsTotal: freeMonthly,
        voicePeriodStart: periodStart,
        voicePeriodEnd: periodEnd,
        dailySecondsUsed: 0,
        dailyUsedAtDate: "",
      },
    });
  }

  // daily rollover
  const tk = todayKeyNY();
  let dailyUsed = ent.dailySecondsUsed;
  let dailyDate = ent.dailyUsedAtDate;

  if (dailyDate !== tk) {
    dailyUsed = 0;
    dailyDate = tk;
  }

  const left = getVoiceLeftSeconds(ent);

  const dailyLimit =
    ent.dailyLimitSeconds > 0 ? ent.dailyLimitSeconds : PLAN_LIMITS[plan].dailySecondsDefault;

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

  return { ok: true as const, left, tk, dailyUsed, dailyLimit, plan };
}

export async function debitPremiumVoice(
  prisma: PrismaClient,
  args: { userId: string; seconds: number; type: DebitType; sessionId?: string; meta?: any }
) {
  const sec = Math.max(1, Math.floor(args.seconds));
  const tk = todayKeyNY();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findUnique({ where: { userId: args.userId } }).catch(() => null);
    const plan = normalizePlan(sub);

    let ent = await ensureEntitlement(tx as any, args.userId);

    // включаем tts (FREE тоже)
    if (!ent.tts) {
      ent = await tx.entitlement.update({ where: { userId: args.userId }, data: { tts: true } });
    }

    // FREE init/rollover
    if (plan === "FREE") {
      const freeMonthly = 180;

      const needInit = (ent.voiceSecondsTotal ?? 0) <= 0;
      const expired = ent.voicePeriodEnd && now.getTime() >= ent.voicePeriodEnd.getTime();

      if (needInit || expired) {
        const { periodStart, periodEnd } = nextMonthPeriodNY(now);
        ent = await tx.entitlement.update({
          where: { userId: args.userId },
          data: {
            voiceSecondsTotal: freeMonthly,
            voiceSecondsUsed: 0,
            voicePeriodStart: periodStart,
            voicePeriodEnd: periodEnd,
            dailySecondsUsed: 0,
            dailyUsedAtDate: "",
          },
        });
      }
    }

    // daily rollover
    let dailyUsed = ent.dailySecondsUsed;
    let dailyDate = ent.dailyUsedAtDate;
    if (dailyDate !== tk) {
      dailyUsed = 0;
      dailyDate = tk;
    }

    const left = Math.max(0, ent.voiceSecondsTotal - ent.voiceSecondsUsed);
    if (left < sec) throw new Error("Not enough voice seconds");

    const dailyLimit =
      ent.dailyLimitSeconds > 0 ? ent.dailyLimitSeconds : PLAN_LIMITS[plan].dailySecondsDefault;

    if (ent.dailyLimitEnabled && dailyLimit > 0 && dailyUsed + sec > dailyLimit) {
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
