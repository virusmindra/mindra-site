// src/app/api/checkout/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/server/db/prisma";
import { getUserId } from "@/lib/auth";

type Plan = "PLUS" | "PRO";
type Term = "1M" | "3M" | "6M" | "12M";

const PRICE_MAP: Record<`${Plan}:${Term}`, string> = {
  "PLUS:1M": process.env.STRIPE_PRICE_PLUS_1M!,
  "PLUS:3M": process.env.STRIPE_PRICE_PLUS_3M!,
  "PLUS:6M": process.env.STRIPE_PRICE_PLUS_6M!,
  "PLUS:12M": process.env.STRIPE_PRICE_PLUS_12M!,

  "PRO:1M": process.env.STRIPE_PRICE_PRO_1M!,
  "PRO:3M": process.env.STRIPE_PRICE_PRO_3M!,
  "PRO:6M": process.env.STRIPE_PRICE_PRO_6M!,
  "PRO:12M": process.env.STRIPE_PRICE_PRO_12M!,
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { plan?: Plan; term?: Term; locale?: string } | null;
  const plan = body?.plan;
  const term = body?.term;
  const locale = String(body?.locale ?? "en").toLowerCase().startsWith("es") ? "es" : "en";

  if (!plan || !term) return NextResponse.json({ error: "Missing plan/term" }, { status: 400 });

  const key = `${plan}:${term}` as const;
  const priceId = PRICE_MAP[key];
  if (!priceId) return NextResponse.json({ error: "Unknown plan/term" }, { status: 400 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ensure customer
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  let customerId = sub?.stripeCustomer ?? null;

  if (!customerId) {
    const c = await stripe.customers.create({ metadata: { userId } });
    customerId = c.id;

    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, stripeCustomer: customerId, status: "incomplete", plan: "FREE" as any },
      update: { stripeCustomer: customerId },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;

  // ✅ у тебя нет /[locale]/account, есть /account
  const success_url = `${baseUrl}/account?checkout=success&locale=${locale}`;
  const cancel_url = `${baseUrl}/${locale}/pricing?checkout=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    metadata: { userId, plan, term, locale },
    subscription_data: { metadata: { userId, plan, term, locale } },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url,
    cancel_url,
    allow_promotion_codes: false,
  });

  return NextResponse.json({ url: session.url }, { status: 200 });
}
