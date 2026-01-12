export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/server/prisma";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" as any });

  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rec = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeCustomer: true },
  });

  if (!rec?.stripeCustomer) {
    return NextResponse.json({ error: "Stripe customer not found" }, { status: 400 });
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/account`;

  const session = await stripe.billingPortal.sessions.create({
    customer: rec.stripeCustomer,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url }, { status: 200 });
}
