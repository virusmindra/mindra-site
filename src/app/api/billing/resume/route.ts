export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/server/prisma";
import { getUserId } from "@/lib/auth";

export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeSubscription) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  const updated: any = await stripe.subscriptions.update(sub.stripeSubscription, {
    cancel_at_period_end: false,
  });

  const cpe =
    typeof updated?.current_period_end === "number" ? updated.current_period_end : null;

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: String(updated?.status ?? sub.status ?? "active"),
      currentPeriodEnd: cpe ? new Date(cpe * 1000) : sub.currentPeriodEnd,
    },
  });

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: Boolean(updated?.cancel_at_period_end),
    currentPeriodEnd: cpe,
  });
}
