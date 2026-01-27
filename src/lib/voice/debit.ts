// src/lib/voice/debit.ts
import type { PrismaClient } from "@prisma/client";
import { todayKeyNY } from "./limits";

type DebitType = "TTS_CHAT" | "FACE_CALL";

const PLAN_SECONDS = {
  FREE: 180,        // 3 min / month
  PLUS: 120 * 60,   // 120 min / month
  PRO: 300 * 60,    // 300 min / month
} as const;

function monthBoundsNY(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = Number(parts.find(p => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find(p => p.type === "month")?.value ?? "01"); // 1..12

  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1, 0, 0, 0));
  return { start, end, key: `${y}-${String(m).padStart(2, "0")}` };
}

async function getPlan(prisma: PrismaClient, userId: string): Promise<keyof typeof PLAN_SECONDS> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const raw = String(sub?.plan ?? "FREE").toUpperCase();
  if (raw === "PLUS" || raw === "PRO") return raw;
  return "FREE";
}

async function ensureEntitlement(prisma: PrismaClient, userId: string) {
  const { start, end } = monthBoundsNY(new Date());
  const plan = await getPlan(prisma, userId);
  const desiredTotal = PLAN_SECONDS[plan];

  let ent = await prisma.entitlement.findUnique({ where: { userId } });

  // CREATE
  if (!ent) {
    ent = await prisma.entitlement.create({
      data: {
        userId,

        // голос включен; если хочешь выключать — делай это отдельным флагом UI, но entitlement пусть будет валидный
        tts: true,

        plus: plan === "PLUS",
        pro: plan === "PRO",

        voiceSecondsTotal: desiredTotal,
        voiceSecondsUsed: 0,

        // ✅ УБРАЛИ daily-limit
        dailyLimitEnabled: false,
        dailyLimitSeconds: 0,
        dailySecondsUsed: 0,
        dailyUsedAtDate: todayKeyNY(),

        maxFaceTimeMinutes: 0,

        voicePeriodStart: start,
        voicePeriodEnd: end,
      } as any,
    });
    return ent;
  }

  // PERIOD ROLLOVER
  const prevEnd = ent.voicePeriodEnd?.getTime() ?? null;
  const nextEnd = end.getTime();
  const isNewPeriod = prevEnd === null || prevEnd !== nextEnd;

  // Также обновим total если сменился план (или раньше был неверный total)
  const needTotalFix = (ent.voiceSecondsTotal ?? 0) !== desiredTotal;

  if (isNewPeriod || needTotalFix) {
    ent = await prisma.entitlement.update({
      where: { userId },
      data: {
        tts: true,
        plus: plan === "PLUS",
        pro: plan === "PRO",

        // ✅ total = по плану
        voiceSecondsTotal: desiredTotal,

        // ✅ если новый месяц — сброс used
        ...(isNewPeriod ? { voiceSecondsUsed: 0 } : {}),

        // ✅ daily-limit отключён всегда
        dailyLimitEnabled: false,
        dailyLimitSeconds: 0,
        ...(isNewPeriod ? { dailySecondsUsed: 0 } : {}),
        dailyUsedAtDate: todayKeyNY(),

        voicePeriodStart: start,
        voicePeriodEnd: end,
      } as any,
    });
  }

  // Если почему-то tts=false — оставим как есть? (тут ты можешь решать).
  // Сейчас делаем: entitlement всегда tts=true (иначе будут ложные блоки).
  if (!ent.tts) {
    ent = await prisma.entitlement.update({
      where: { userId },
      data: { tts: true } as any,
    });
  }

  return ent;
}

export async function canUsePremiumVoice(prisma: PrismaClient, userId: string, wantSeconds: number) {
  // ✅ Единая истина
  const ent = await ensureEntitlement(prisma, userId);

  const total = ent.voiceSecondsTotal ?? 0;
  const used = ent.voiceSecondsUsed ?? 0;
  const left = Math.max(0, total - used);

  if (!ent.tts) return { ok: false as const, reason: "tts_disabled" as const, left };
  if (left <= 0) return { ok: false as const, reason: "monthly_exhausted" as const, left };
  if (wantSeconds > left) return { ok: false as const, reason: "insufficient_left" as const, left };

  // ✅ daily-limit удалён
  return { ok: true as const, left };
}

export async function debitPremiumVoice(
  prisma: PrismaClient,
  args: { userId: string; seconds: number; type: DebitType; sessionId?: string; meta?: any }
) {
  const sec = Math.max(1, Math.floor(args.seconds));
  const tk = todayKeyNY();

  return prisma.$transaction(async (tx) => {
    const ent0 = await ensureEntitlement(tx as any, args.userId);

    if (!ent0.tts) throw new Error("TTS disabled");

    const left = Math.max(0, (ent0.voiceSecondsTotal ?? 0) - (ent0.voiceSecondsUsed ?? 0));
    if (left < sec) throw new Error("Not enough voice seconds");

    // ✅ daily-limit removed

    await tx.entitlement.update({
      where: { userId: args.userId },
      data: {
        voiceSecondsUsed: { increment: sec },
        dailySecondsUsed: { set: 0 },
        dailyUsedAtDate: { set: tk },
      } as any,
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
