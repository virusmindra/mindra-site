// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";
import { prisma } from "@/server/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const FREE_SECONDS = 3 * 60; // ✅ 3 минуты

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const email = (session?.user as any)?.email as string | undefined;

  if (!userId) {
    return NextResponse.json({
      authed: false,
      userId: null,
      email: null,
      plan: "FREE",
      tts: false,
      canTts: false,
      voiceSecondsTotal: 0,
      voiceSecondsUsed: 0,
      voiceSecondsLeft: 0,
      voiceMinutesUsed: 0,
      voiceMinutesLeft: 0,
      status: "anon",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });

  // ✅ Гарантируем entitlement (иначе Settings всегда 0/0)
  const ent = await prisma.entitlement.upsert({
    where: { userId },
    create: {
      userId,
      // FREE дефолты
      tts: true,               // ✅ чтобы FREE мог юзать 3 минуты
      plus: false,
      pro: false,
      voiceSecondsTotal: FREE_SECONDS,
      voiceSecondsUsed: 0,
      dailyLimitEnabled: true,
      dailyLimitSeconds: 60,   // можешь поставить 0 если daily не нужен
      dailySecondsUsed: 0,
      dailyUsedAtDate: "",
      maxFaceTimeMinutes: 0,
      voicePeriodStart: null,
      voicePeriodEnd: null,
    } as any,
    update: {},
  });

  // ✅ total/used/left — всегда корректно
  const total = (ent?.voiceSecondsTotal ?? 0) > 0 ? (ent.voiceSecondsTotal ?? 0) : FREE_SECONDS;
  const used = ent?.voiceSecondsUsed ?? 0;
  const left = Math.max(0, total - used);

  // ✅ FREE: tts должен быть true
  const plan = (sub?.plan ?? "FREE") as "FREE" | "PLUS" | "PRO";
  const tts = plan === "FREE" ? true : Boolean(ent?.tts);

  // ✅ canTts: есть tts и остались секунды
  const canTts = Boolean(tts) && left > 0;

  let cancelAtPeriodEnd = false;
  let currentPeriodEndMs: number | null =
    sub?.currentPeriodEnd ? sub.currentPeriodEnd.getTime() : null;

  try {
    if (sub?.stripeSubscription) {
      const s: any = await stripe.subscriptions.retrieve(sub.stripeSubscription);
      cancelAtPeriodEnd = Boolean(s?.cancel_at_period_end);
      if (typeof s?.current_period_end === "number") {
        currentPeriodEndMs = s.current_period_end * 1000;
      }
    }
  } catch {
    // ignore stripe errors
  }

  return NextResponse.json({
    authed: true,
    userId,
    email: email ?? null,

    plan,
    status: sub?.status ?? "unknown",

    tts,
    canTts,

    voiceSecondsTotal: total,
    voiceSecondsUsed: used,
    voiceSecondsLeft: left,
    voiceMinutesUsed: Math.floor(used / 60),
    voiceMinutesLeft: Math.floor(left / 60),

    currentPeriodEnd: currentPeriodEndMs,
    cancelAtPeriodEnd,
  });
}
