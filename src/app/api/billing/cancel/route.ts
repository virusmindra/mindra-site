export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
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

  // ставим отмену на конец периода
  await stripe.subscriptions.update(sub.stripeSubscription, {
    cancel_at_period_end: true,
  });

  // retrieve (и явно приводим к Stripe.Subscription)
  const fresh = (await stripe.subscriptions.retrieve(
    sub.stripeSubscription
  )) as Stripe.Subscription;

  const cpe = typeof (fresh as any).current_period_end === "number"
    ? (fresh as any).current_period_end
    : null;

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: String((fresh as any).status),
      currentPeriodEnd: cpe ? new Date(cpe * 1000) : sub.currentPeriodEnd,
    },
  });

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: Boolean((fresh as any).cancel_at_period_end),
    currentPeriodEnd: cpe,
  });
}
