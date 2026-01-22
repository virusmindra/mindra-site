import { prisma } from "@/server/prisma";

const FREE_SECONDS = 3 * 60;     // ✅ 3 минуты/месяц
const PLUS_SECONDS = 120 * 60;
const PRO_SECONDS = 300 * 60;

function planToSeconds(plan: "FREE" | "PLUS" | "PRO") {
  if (plan === "PRO") return PRO_SECONDS;
  if (plan === "PLUS") return PLUS_SECONDS;
  return FREE_SECONDS; // ✅ FREE теперь тоже даём минуты
}

// ✅ границы текущего месяца по New York
function monthBoundsNY(now = new Date()) {
  // берём YYYY-MM в NY
  const ym = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
  }).format(now); // "2026-01"

  const [y, m] = ym.split("-").map(Number);

  // start = 1 число текущего месяца 00:00 NY -> Date (в UTC)
  const start = new Date(Date.UTC(y, m - 1, 1, 5, 0, 0)); // грубо: NY = UTC-5 зимой
  // end = 1 число следующего месяца 00:00 NY
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1, 5, 0, 0));

  // ⚠️ это упрощение (DST), но для “сброса раз в месяц” работает ок.
  // Если хочешь идеально — сделаем через Temporal / luxon.
  return { start, end };
}

type SyncArgs = {
  userId: string;
  plan: "FREE" | "PLUS" | "PRO";
  status?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  stripeEventId: string;
  eventType: "SUBSCRIPTION_RENEW" | "SUBSCRIPTION_CHANGE";
};

export async function syncVoiceEntitlementsFromStripe(args: SyncArgs) {
  const targetSeconds = planToSeconds(args.plan);

  const isActivePaid =
    args.status === "active" || args.status === "trialing" || args.status === "past_due";

  // ✅ FREE считаем “активным” (это наш free-пакет)
  const isActive = args.plan === "FREE" ? true : isActivePaid;

  // ✅ для FREE делаем период = текущий месяц в NY
  const freeBounds = args.plan === "FREE" ? monthBoundsNY(new Date()) : null;
  const periodStart = args.plan === "FREE" ? freeBounds!.start : (args.periodStart ?? null);
  const periodEnd = args.plan === "FREE" ? freeBounds!.end : (args.periodEnd ?? null);

  return prisma.$transaction(async (tx) => {
    const existed = await tx.billingEvent.findUnique({
      where: { stripeEventId: args.stripeEventId },
    });
    if (existed) return { ok: true, skipped: true };

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
        voicePeriodStart: periodStart,
        voicePeriodEnd: periodEnd,
      },
      update: {},
    });

    // ✅ если НЕ активна платная подписка — но план FREE, мы НЕ обнуляем до 0
    if (!isActive) {
      await tx.entitlement.update({
        where: { userId: args.userId },
        data: {
          tts: false,
          plus: false,
          pro: false,
          voiceSecondsTotal: 0,
          voiceSecondsUsed: 0,
          dailySecondsUsed: 0,
          dailyUsedAtDate: "",
          voicePeriodStart: periodStart,
          voicePeriodEnd: periodEnd,
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

    const prevEnd = ent.voicePeriodEnd?.getTime() ?? null;
    const nextEnd = periodEnd?.getTime() ?? null;

    const isNewPeriod = nextEnd !== null && (prevEnd === null || prevEnd !== nextEnd);

    await tx.entitlement.update({
      where: { userId: args.userId },
      data: {
        tts: true,
        plus: args.plan === "PLUS",
        pro: args.plan === "PRO",
        voiceSecondsTotal: targetSeconds,

        voiceSecondsUsed: isNewPeriod ? 0 : undefined,
        dailySecondsUsed: isNewPeriod ? 0 : undefined,
        dailyUsedAtDate: isNewPeriod ? "" : undefined,

        voicePeriodStart: periodStart,
        voicePeriodEnd: periodEnd,
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
          periodStart: periodStart?.toISOString() ?? null,
          periodEnd: periodEnd?.toISOString() ?? null,
        },
      },
    });

    return { ok: true, isNewPeriod };
  });
}
