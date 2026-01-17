import { prisma } from "@/server/db/prisma";

export async function getEntitlements(userId: string) {
  let e = await prisma.entitlement.findUnique({ where: { userId } });
  if (!e) e = await prisma.entitlement.create({ data: { userId } as any });
  return e;
}

const MIN = 60;

const PLAN_CFG = {
  FREE: {
    plus: false,
    pro: false,
    tts: false,
    maxFace: 0,

    textDailyEnabled: true,
    textDaily: 10,

    voiceMonthlySeconds: 3 * MIN, // 3 minutes / month

    goalsMonthlyEnabled: true,
    goalsMonthly: 3,

    habitsMonthlyEnabled: true,
    habitsMonthly: 3,

    remindersMonthlyEnabled: true,
    remindersMonthly: 3,
  },
  PLUS: {
    plus: true,
    pro: false,
    tts: true,
    maxFace: 30,

    textDailyEnabled: false, // unlimited
    textDaily: 0,

    voiceMonthlySeconds: 120 * MIN, // 120 minutes / month

    goalsMonthlyEnabled: true,
    goalsMonthly: 30,

    habitsMonthlyEnabled: true,
    habitsMonthly: 30,

    remindersMonthlyEnabled: false, // unlimited
    remindersMonthly: 0,
  },
  PRO: {
    plus: true,
    pro: true,
    tts: true,
    maxFace: 9999,

    textDailyEnabled: false, // unlimited
    textDaily: 0,

    voiceMonthlySeconds: 300 * MIN, // 300 minutes / month

    goalsMonthlyEnabled: false, // unlimited
    goalsMonthly: 0,

    habitsMonthlyEnabled: false, // unlimited
    habitsMonthly: 0,

    remindersMonthlyEnabled: false, // unlimited
    remindersMonthly: 0,
  },
} as const;

export async function recomputeEntitlements(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const plan = (sub?.plan ?? "FREE") as keyof typeof PLAN_CFG;

  const cfg = PLAN_CFG[plan] ?? PLAN_CFG.FREE;

  await prisma.entitlement.upsert({
    where: { userId },
    update: {
      // plan flags
      plus: cfg.plus,
      pro: cfg.pro,
      tts: cfg.tts,
      maxFaceTimeMinutes: cfg.maxFace,

      // voice monthly total (used/period stays handled elsewhere)
      voiceSecondsTotal: cfg.voiceMonthlySeconds,

      // text
      textDailyLimitEnabled: cfg.textDailyEnabled,
      textDailyLimitMessages: cfg.textDaily,

      // goals/habits/reminders monthly limits
      goalsMonthlyLimitEnabled: cfg.goalsMonthlyEnabled,
      goalsMonthlyLimit: cfg.goalsMonthly,

      habitsMonthlyLimitEnabled: cfg.habitsMonthlyEnabled,
      habitsMonthlyLimit: cfg.habitsMonthly,

      remindersMonthlyLimitEnabled: cfg.remindersMonthlyEnabled,
      remindersMonthlyLimit: cfg.remindersMonthly,

      // ✅ НЕ трогаем:
      // voiceSecondsUsed / voicePeriodStart / voicePeriodEnd
      // daily voice counters
      // text/goals/habits/reminders "used" counters и date/month keys
    } as any,
    create: {
      userId,

      // plan flags
      plus: cfg.plus,
      pro: cfg.pro,
      tts: cfg.tts,
      maxFaceTimeMinutes: cfg.maxFace,

      // voice monthly total
      voiceSecondsTotal: cfg.voiceMonthlySeconds,

      // text
      textDailyLimitEnabled: cfg.textDailyEnabled,
      textDailyLimitMessages: cfg.textDaily,

      // goals/habits/reminders monthly limits
      goalsMonthlyLimitEnabled: cfg.goalsMonthlyEnabled,
      goalsMonthlyLimit: cfg.goalsMonthly,

      habitsMonthlyLimitEnabled: cfg.habitsMonthlyEnabled,
      habitsMonthlyLimit: cfg.habitsMonthly,

      remindersMonthlyLimitEnabled: cfg.remindersMonthlyEnabled,
      remindersMonthlyLimit: cfg.remindersMonthly,

      // used/date keys остаются дефолтами из Prisma
    } as any,
  });
}
