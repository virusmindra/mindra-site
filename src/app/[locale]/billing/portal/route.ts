// src/app/[locale]/billing/portal/route.ts
import Stripe from "stripe";
import {NextRequest} from "next/server";

export async function GET(req: NextRequest) {
  // 1) Создаем клиент без apiVersion — пусть берёт из настроек аккаунта
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // 2) Берём customer (временно через query ?c=cus_...)
  const customer = req.nextUrl.searchParams.get("c");
  if (!customer) {
    return new Response("Missing Stripe customer id (?c=cus_...)", { status: 400 });
  }

  // 3) Определяем текущую локаль из пути /{locale}/billing/portal
  const [, locale] = req.nextUrl.pathname.split("/");
  const safeLocale = locale || "en";

  // 4) Создаем сессию портала
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${req.nextUrl.origin}/${safeLocale}/account`
  });

  // 5) Редиректим пользователя в Customer Portal
  return Response.redirect(session.url, 302);
}
