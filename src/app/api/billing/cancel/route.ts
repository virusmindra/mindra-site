export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/server/db/prisma"; // ✅ FIX
import { getUserId } from "@/lib/auth";
// import { recomputeEntitlements } from "@/lib/entitlements"; // optional

export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });

  // Lifetime / free / no stripe sub
  if (!sub?.stripeSubscription) {
    return NextResponse.json(
      { error: sub?.term === "LIFETIME" ? "lifetime_cannot_cancel" : "no_subscription" },
      { status: 400 }
    );
  }

  const updated: any = await stripe.subscriptions.update(sub.stripeSubscription, {
    cancel_at_period_end: true,
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

  // optional: чтобы UI сразу обновлялся, а не ждать webhook
  // await recomputeEntitlements(userId);

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: Boolean(updated?.cancel_at_period_end),
    currentPeriodEnd: cpe,
  });
}
