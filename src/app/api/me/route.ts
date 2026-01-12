import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";
import { prisma } from "@/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({
      authed: false,
      userId: null,
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
    });
  }

  // subscription + entitlement from DB
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const ent = await prisma.entitlement.findUnique({ where: { userId } });

  const total = ent?.voiceSecondsTotal ?? 0;
  const used = ent?.voiceSecondsUsed ?? 0;
  const left = Math.max(0, total - used);

  const canTts = Boolean(ent?.tts) && left > 0;

  return NextResponse.json({
    authed: true,
    userId,
    plan: sub?.plan ?? "FREE",
    status: sub?.status ?? "unknown",
    tts: Boolean(ent?.tts),
    canTts,
    voiceSecondsTotal: total,
    voiceSecondsUsed: used,
    voiceSecondsLeft: left,
    voiceMinutesUsed: Math.floor(used / 60),
    voiceMinutesLeft: Math.floor(left / 60),
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
  });
}
