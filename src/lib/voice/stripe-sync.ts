import { prisma } from "@/server/prisma";

const PLUS_SECONDS = 120 * 60;
const PRO_SECONDS = 300 * 60;

function planToSeconds(plan: "FREE" | "PLUS" | "PRO") {
  if (plan === "PLUS") return PLUS_SECONDS;
  if (plan === "PRO") return PRO_SECONDS;
  return 0;
}

type SyncArgs = {
  userId: string;

  // текущий план/статус после того как ты апдейтнул Subscription в БД
  plan: "FREE" | "PLUS" | "PRO";
  status?: string | null;

  // из Stripe subscription: current_period_start/end
  periodStart?: Date | null;
  periodEnd?: Date | null;

  // idempotency
  stripeEventId: string;
  eventType: "SUBSCRIPTION_RENEW" | "SUBSCRIPTION_CHANGE";
};

export async function syncVoiceEntitlementsFromStripe(args: SyncArgs) {
  const targetSeconds = planToSeconds(args.plan);

  // какие статусы считать активными
  const isActive =
    args.status === "active" || args.status === "trialing" || args.status === "past_due";

  return prisma.$transaction(async (tx) => {
    // ✅ idempotency: если Stripe event уже обработан — выходим
    const existed = await tx.billingEvent.findUnique({
      where: { stripeEventId: args.stripeEventId },
    });
    if (existed) return { ok: true, skipped: true };

    // гарантируем Entitlement
    const ent = await tx.entitlement.upsert({
      where: { userId: args.userId },
      create: {
        userId: args.userId,
        plus: false,
        pro: false,
        tts: false,
        voiceSecondsTotal: 0,
        voiceSecondsUsed: 0,
        dailyLimitEnabled: true,
        dailyLimitSeconds: 0,
        dailySecondsUsed: 0,
        dailyUsedAtDate: "",
        maxFaceTimeMinutes: 0,
        voicePeriodStart: args.periodStart ?? null,
        voicePeriodEnd: args.periodEnd ?? null,
      },
      update: {},
    });

    // если FREE или неактивно — выключаем ттс и обнуляем лимит
    if (!isActive || targetSeconds === 0) {
      await tx.entitlement.update({
        where: { userId: args.userId },
        data: {
          tts: false,
          plus: false,
          pro: false,
          voiceSecondsTotal: 0,
          // used можно оставить, но логичнее обнулить
          voiceSecondsUsed: 0,
          dailySecondsUsed: 0,
          dailyUsedAtDate: "",
          voicePeriodStart: args.periodStart ?? null,
          voicePeriodEnd: args.periodEnd ?? null,
        },
      });

      await tx.billingEvent.create({
        data: {
          userId: args.userId,
          type: args.eventType,
          planFrom: null,
          planTo: args.plan,
          secondsAdded: 0,
          amountCents: 0,
          currency: "usd",
          stripeEventId: args.stripeEventId,
          meta: { status: args.status ?? null },
        },
      });

      return { ok: true, reset: true };
    }

    // ✅ определяем: новый период или нет
    const prevEnd = ent.voicePeriodEnd?.getTime() ?? null;
    const nextEnd = args.periodEnd?.getTime() ?? null;

    const isNewPeriod =
      nextEnd !== null && (prevEnd === null || prevEnd !== nextEnd);

    // ✅ обновляем entitlement
    await tx.entitlement.update({
      where: { userId: args.userId },
      data: {
        tts: true,
        plus: args.plan === "PLUS",
        pro: args.plan === "PRO",

        // total всегда актуализируем
        voiceSecondsTotal: targetSeconds,

        // used сбрасываем ТОЛЬКО при новом периоде
        voiceSecondsUsed: isNewPeriod ? 0 : undefined,

        // daily тоже сбрасываем при новом периоде
        dailySecondsUsed: isNewPeriod ? 0 : undefined,
        dailyUsedAtDate: isNewPeriod ? "" : undefined,

        voicePeriodStart: args.periodStart ?? null,
        voicePeriodEnd: args.periodEnd ?? null,
      },
    });

    await tx.billingEvent.create({
      data: {
        userId: args.userId,
        type: args.eventType,
        planFrom: null,
        planTo: args.plan,
        secondsAdded: isNewPeriod ? targetSeconds : 0,
        amountCents: 0,
        currency: "usd",
        stripeEventId: args.stripeEventId,
        meta: {
          status: args.status ?? null,
          isNewPeriod,
          periodStart: args.periodStart?.toISOString() ?? null,
          periodEnd: args.periodEnd?.toISOString() ?? null,
        },
      },
    });

    return { ok: true, isNewPeriod };
  });
}
