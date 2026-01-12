import { prisma } from "@/server/db/prisma";

export async function getEntitlements(userId: string) {
  let e = await prisma.entitlement.findUnique({ where: { userId } });
  if (!e) e = await prisma.entitlement.create({ data: { userId } as any });
  return e;
}

export async function recomputeEntitlements(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const plan = (sub?.plan ?? "FREE") as "FREE" | "PLUS" | "PRO";

  const map = {
    FREE: { plus: false, pro: false, tts: false, maxFace: 0 },
    PLUS: { plus: true, pro: false, tts: true, maxFace: 30 },
    PRO: { plus: true, pro: true, tts: true, maxFace: 9999 },
  };

  const cfg = map[plan];

  await prisma.entitlement.upsert({
    where: { userId },
    update: {
      plus: cfg.plus,
      pro: cfg.pro,
      tts: cfg.tts,
      maxFaceTimeMinutes: cfg.maxFace,
      // ❌ НЕ трогаем voiceSecondsTotal / voiceSecondsUsed / voicePeriod*
    } as any,
    create: {
      userId,
      plus: cfg.plus,
      pro: cfg.pro,
      tts: cfg.tts,
      maxFaceTimeMinutes: cfg.maxFace,
      // voiceSeconds* пусть создаются/синкятся в stripe-sync
    } as any,
  });
}
