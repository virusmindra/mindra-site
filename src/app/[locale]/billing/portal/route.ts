// src/app/[locale]/billing/portal/route.ts
export const runtime = "nodejs"; // Stripe SDK нужен Node runtime

import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth"; // сейчас будет стаб
import { db } from "@/lib/db";               // сейчас будет стаб

export async function GET(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
  }

  // ⬇️ Без apiVersion — пусть берётся из настроек Stripe-аккаунта
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // локаль из URL /{locale}/billing/portal
  const [, locale] = req.nextUrl.pathname.split("/");
  const safeLocale = locale || "en";

  // 1) пробуем найти customerId через текущего пользователя и БД
  let customerId: string | null = null;
  try {
    const user = await getCurrentUser(); // вернёт {id, email} или null (в стабе — null)
    if (user) {
      const rec = await db.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true }
      });
      if (rec?.stripeCustomerId) customerId = rec.stripeCustomerId;
    }
  } catch {
    // игнорируем — ниже есть fallback через query
  }

  // 2) dev/fallback: разрешаем ?c=cus_... в query
  if (!customerId) {
    customerId = req.nextUrl.searchParams.get("c");
  }

  if (!customerId) {
    return new Response(
      "Stripe customer not found. Provide via session/DB or pass ?c=cus_... for dev.",
      { status: 400 }
    );
  }

  // куда вернуться из портала
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
