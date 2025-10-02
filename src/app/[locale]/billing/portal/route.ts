// src/app/[locale]/billing/portal/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import Stripe from "stripe";

// ⚠️ относительные пути (работает вне зависимости от алиасов)
import { getCurrentUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
  }

  // Не задаём apiVersion — пусть SDK берёт из настроек аккаунта Stripe.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const [, locale] = req.nextUrl.pathname.split("/");
  const safeLocale = locale || "en";

  let customerId: string | null = null;

  try {
    const user = await getCurrentUser(); // {id,email} | null
    if (user) {
      const rec = await db.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true }
      });
      if (rec?.stripeCustomerId) customerId = rec.stripeCustomerId;
    }
  } catch {
    // игнор
  }

  // Dev/fallback: разрешаем ?c=cus_... в query
  if (!customerId) {
    customerId = req.nextUrl.searchParams.get("c");
  }
  if (!customerId) {
    return new Response(
      "Stripe customer not found. Provide via session/DB or pass ?c=cus_... for dev.",
      { status: 400 }
    );
  }

  const returnUrl = `${req.nextUrl.origin}/${safeLocale}/account`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
    return Response.redirect(session.url, 302);
  } catch (err) {
    console.error("Stripe portal error:", err);
    return new Response("Failed to create portal session", { status: 500 });
  }
}
