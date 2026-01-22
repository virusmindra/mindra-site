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
    tts: true,
    maxFace: 0,

    textDailyEnabled: true,
    textDaily: 10,

    voiceMonthlySeconds: 3 * MIN, // 3 min/mo (только после логина — это rule в web-chat)
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

    voiceMonthlySeconds: 120 * MIN,
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

    voiceMonthlySeconds: 300 * MIN,
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
  const plan = ((sub?.plan ?? "FREE") as keyof typeof PLAN_CFG) ?? "FREE";
  const cfg = PLAN_CFG[plan] ?? PLAN_CFG.FREE;

  await prisma.entitlement.upsert({
    where: { userId },
    update: {
      plus: cfg.plus,
      pro: cfg.pro,
      tts: cfg.tts,
      maxFaceTimeMinutes: cfg.maxFace,

      // voice monthly total
      voiceSecondsTotal: cfg.voiceMonthlySeconds,

      // text daily (общий на все фичи)
      textDailyLimitEnabled: cfg.textDailyEnabled,
      textDailyLimitMessages: cfg.textDaily,

      // monthly create limits
      goalsMonthlyLimitEnabled: cfg.goalsMonthlyEnabled,
      goalsMonthlyLimit: cfg.goalsMonthly,

      habitsMonthlyLimitEnabled: cfg.habitsMonthlyEnabled,
      habitsMonthlyLimit: cfg.habitsMonthly,

      remindersMonthlyLimitEnabled: cfg.remindersMonthlyEnabled,
      remindersMonthlyLimit: cfg.remindersMonthly,

      // НЕ трогаем used/date/month keys и voice used/period*
    } as any,
    create: {
      userId,
      plus: cfg.plus,
      pro: cfg.pro,
      tts: cfg.tts,
      maxFaceTimeMinutes: cfg.maxFace,

      voiceSecondsTotal: cfg.voiceMonthlySeconds,

      textDailyLimitEnabled: cfg.textDailyEnabled,
      textDailyLimitMessages: cfg.textDaily,

      goalsMonthlyLimitEnabled: cfg.goalsMonthlyEnabled,
      goalsMonthlyLimit: cfg.goalsMonthly,

      habitsMonthlyLimitEnabled: cfg.habitsMonthlyEnabled,
      habitsMonthlyLimit: cfg.habitsMonthly,

      remindersMonthlyLimitEnabled: cfg.remindersMonthlyEnabled,
      remindersMonthlyLimit: cfg.remindersMonthly,
    } as any,
  });
}
