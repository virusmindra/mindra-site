import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";
import { prisma } from "@/server/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const email = (session?.user as any)?.email as string | undefined;

  if (!userId) {
    return NextResponse.json({
      authed: false,
      userId: null,
      email: null,          // ✅ ADD
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
  const ent = await prisma.entitlement.findUnique({ where: { userId } });

  const total = ent?.voiceSecondsTotal ?? 0;
  const used = ent?.voiceSecondsUsed ?? 0;
  const left = Math.max(0, total - used);
  const canTts = Boolean(ent?.tts) && left > 0;

  let cancelAtPeriodEnd = false;
  let currentPeriodEndMs: number | null = sub?.currentPeriodEnd ? sub.currentPeriodEnd.getTime() : null;

  try {
    if (sub?.stripeSubscription) {
      const s: any = await stripe.subscriptions.retrieve(sub.stripeSubscription);
      cancelAtPeriodEnd = Boolean(s?.cancel_at_period_end);
      if (typeof s?.current_period_end === "number") {
        currentPeriodEndMs = s.current_period_end * 1000;
      }
    }
  } catch {}

  return NextResponse.json({
    authed: true,
    userId,
    email: email ?? null,  // ✅ ADD
    plan: sub?.plan ?? "FREE",
    status: sub?.status ?? "unknown",
    tts: Boolean(ent?.tts),
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
