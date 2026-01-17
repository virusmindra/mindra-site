// src/app/api/checkout/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/server/db/prisma";
import { getUserId } from "@/lib/auth";

type Plan = "PLUS" | "PRO";
type Term = "1M" | "3M" | "6M" | "12M";

const PRICE_MAP: Record<`${Plan}:${Term}`, string | undefined> = {
  "PLUS:1M": process.env.STRIPE_PRICE_PLUS_1M,
  "PLUS:3M": process.env.STRIPE_PRICE_PLUS_3M,
  "PLUS:6M": process.env.STRIPE_PRICE_PLUS_6M,
  "PLUS:12M": process.env.STRIPE_PRICE_PLUS_12M,
  "PRO:1M": process.env.STRIPE_PRICE_PRO_1M,
  "PRO:3M": process.env.STRIPE_PRICE_PRO_3M,
  "PRO:6M": process.env.STRIPE_PRICE_PRO_6M,
  "PRO:12M": process.env.STRIPE_PRICE_PRO_12M,
};

function normPlan(x: any): Plan | null {
  const v = String(x ?? "").trim().toUpperCase();
  return v === "PLUS" || v === "PRO" ? (v as Plan) : null;
}
function normTerm(x: any): Term | null {
  const v = String(x ?? "").trim().toUpperCase();
  return v === "1M" || v === "3M" || v === "6M" || v === "12M" ? (v as Term) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { plan?: unknown; term?: unknown; locale?: string; anonUid?: string }
      | null;

    const plan = normPlan(body?.plan);
    const term = normTerm(body?.term);

    const locale = String(body?.locale ?? "en").toLowerCase().startsWith("es") ? "es" : "en";
    const anonUid = String(body?.anonUid ?? "").trim() || null;

    if (!plan || !term) {
      return NextResponse.json(
        { error: `Invalid plan/term: plan=${String(body?.plan)} term=${String(body?.term)}` },
        { status: 400 }
      );
    }

    const key = `${plan}:${term}` as const;
    const priceId = (PRICE_MAP[key] ?? "").trim();
    if (!priceId) {
      const missing = Object.entries(PRICE_MAP)
        .filter(([, v]) => !String(v ?? "").trim())
        .map(([k]) => k);

      return NextResponse.json(
        { error: `Missing Stripe price env for ${key}. Missing: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const userId = await getUserId(); // может быть null для guest

    // base urls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
    const success_url = `${baseUrl}/account?checkout=success&locale=${locale}`;
    const cancel_url = `${baseUrl}/${locale}/pricing?checkout=cancel`;

    // ---------- AUTHED FLOW (как раньше) ----------
    if (userId) {
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

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: userId,
        metadata: { userId, plan, term, locale, anonUid: anonUid ?? "" },
        subscription_data: { metadata: { userId, plan, term, locale, anonUid: anonUid ?? "" } },
        line_items: [{ price: priceId, quantity: 1 }],
        success_url,
        cancel_url,
      });

      return NextResponse.json({ url: session.url }, { status: 200 });
    }

    // ---------- GUEST FLOW ----------
    // Не создаем Subscription в БД (userId нет). Stripe соберет email.
    // ---------- GUEST FLOW ----------
const guestCustomer = await stripe.customers.create({
  metadata: { anonUid: anonUid ?? "" },
});

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: guestCustomer.id,
  metadata: { plan, term, locale, anonUid: anonUid ?? "" },
  subscription_data: { metadata: { plan, term, locale, anonUid: anonUid ?? "" } },
  line_items: [{ price: priceId, quantity: 1 }],
  success_url,
  cancel_url,
});

return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (e: any) {
    console.error("CHECKOUT_500:", e?.message, e);
    return NextResponse.json(
      { error: "checkout_500", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
