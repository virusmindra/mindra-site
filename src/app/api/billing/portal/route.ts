export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/server/db/prisma";
import { getUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomer) {
    return NextResponse.json({ error: "no_stripe_customer" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomer,
    return_url: `${baseUrl}/account?tab=billing`,
  });

  return NextResponse.json({ url: session.url }, { status: 200 });
}
