import { PLAN_LIMITS, todayKeyNY, getVoiceLeftSeconds } from "./limits";
import type { PrismaClient } from "@prisma/client";

type DebitType = "TTS_CHAT" | "FACE_CALL";

export async function canUsePremiumVoice(prisma: PrismaClient, userId: string, wantSeconds: number) {
  const ent = await prisma.entitlement.findUnique({ where: { userId } });
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!ent || !sub) return { ok: false as const, reason: "no_entitlement" as const };
  if (!ent.tts) return { ok: false as const, reason: "tts_disabled" as const };

  const tk = todayKeyNY();

  // daily rollover
  let dailyUsed = ent.dailySecondsUsed;
  let dailyDate = ent.dailyUsedAtDate;

  if (dailyDate !== tk) {
    dailyUsed = 0;
    dailyDate = tk;
  }

  const plan = sub.plan; // FREE|PLUS|PRO
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

  return { ok: true as const, left, tk, dailyUsed, dailyLimit };
}

export async function debitPremiumVoice(
  prisma: PrismaClient,
  args: { userId: string; seconds: number; type: DebitType; sessionId?: string; meta?: any }
) {
  const sec = Math.max(1, Math.floor(args.seconds));
  const tk = todayKeyNY();

  return prisma.$transaction(async (tx) => {
    const ent = await tx.entitlement.findUnique({ where: { userId: args.userId } });
    const sub = await tx.subscription.findUnique({ where: { userId: args.userId } });

    if (!ent || !sub) throw new Error("No entitlement/subscription");
    if (!ent.tts) throw new Error("TTS disabled");

    // daily rollover
    let dailyUsed = ent.dailySecondsUsed;
    let dailyDate = ent.dailyUsedAtDate;
    if (dailyDate !== tk) {
      dailyUsed = 0;
      dailyDate = tk;
    }

    const plan = sub.plan;
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
