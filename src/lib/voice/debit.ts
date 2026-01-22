import { PLAN_LIMITS, todayKeyNY, getVoiceLeftSeconds } from "./limits";
import type { PrismaClient } from "@prisma/client";

type DebitType = "TTS_CHAT" | "FACE_CALL";

async function ensureEntitlement(prisma: PrismaClient, userId: string) {
  let ent = await prisma.entitlement.findUnique({ where: { userId } });

  if (!ent) {
    // ✅ FREE старт: 3 минуты = 180 секунд
    ent = await prisma.entitlement.create({
      data: {
        userId,
        tts: true,                 // важно: без этого canUse будет "tts_disabled"
        voiceSecondsTotal: 180,
        voiceSecondsUsed: 0,

        dailyLimitEnabled: true,
        dailyLimitSeconds: 60,     // можешь поставить 180 если хочешь free 3 min/day
        dailySecondsUsed: 0,
        dailyUsedAtDate: todayKeyNY(),
      } as any,
    });
  }

  return ent;
}

export async function canUsePremiumVoice(
  prisma: PrismaClient,
  userId: string,
  wantSeconds: number
) {
  // ✅ sub теперь НЕ обязателен
  const [sub, ent0] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    ensureEntitlement(prisma, userId),
  ]);

  let ent = ent0;

  if (!ent.tts) return { ok: false as const, reason: "tts_disabled" as const };

  const tk = todayKeyNY();

  // daily rollover
  let dailyUsed = ent.dailySecondsUsed ?? 0;
  let dailyDate = ent.dailyUsedAtDate ?? tk;

  if (dailyDate !== tk) {
    dailyUsed = 0;
    dailyDate = tk;
  }

  const rawPlan = String(sub?.plan ?? "FREE").toUpperCase();
  const plan = (rawPlan in PLAN_LIMITS ? rawPlan : "FREE") as keyof typeof PLAN_LIMITS;

  const left = getVoiceLeftSeconds(ent);

  const dailyLimit =
    (ent.dailyLimitSeconds ?? 0) > 0
      ? (ent.dailyLimitSeconds as number)
      : PLAN_LIMITS[plan].dailySecondsDefault;

  if (left <= 0)
    return { ok: false as const, reason: "monthly_exhausted" as const, left };

  if (wantSeconds > left)
    return { ok: false as const, reason: "insufficient_left" as const, left };

  if (ent.dailyLimitEnabled && dailyLimit > 0 && dailyUsed + wantSeconds > dailyLimit) {
    return {
      ok: false as const,
      reason: "daily_limit" as const,
      left,
      dailyLeft: Math.max(0, dailyLimit - dailyUsed),
    };
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
    // ✅ ensure entitlement inside transaction too
    let ent = await tx.entitlement.findUnique({ where: { userId: args.userId } });
    if (!ent) {
      ent = await tx.entitlement.create({
        data: {
          userId: args.userId,
          tts: true,
          voiceSecondsTotal: 180,
          voiceSecondsUsed: 0,
          dailyLimitEnabled: true,
          dailyLimitSeconds: 60,
          dailySecondsUsed: 0,
          dailyUsedAtDate: tk,
        } as any,
      });
    }

    const sub = await tx.subscription.findUnique({ where: { userId: args.userId } });

    if (!ent.tts) throw new Error("TTS disabled");

    // daily rollover
    let dailyUsed = ent.dailySecondsUsed ?? 0;
    let dailyDate = ent.dailyUsedAtDate ?? tk;

    if (dailyDate !== tk) {
      dailyUsed = 0;
      dailyDate = tk;
    }

    const rawPlan = String(sub?.plan ?? "FREE").toUpperCase();
    const plan = (rawPlan in PLAN_LIMITS ? rawPlan : "FREE") as keyof typeof PLAN_LIMITS;

    const left = Math.max(0, ent.voiceSecondsTotal - ent.voiceSecondsUsed);
    if (left < sec) throw new Error("Not enough voice seconds");

    const dailyLimit =
      (ent.dailyLimitSeconds ?? 0) > 0
        ? (ent.dailyLimitSeconds as number)
        : PLAN_LIMITS[plan].dailySecondsDefault;

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
