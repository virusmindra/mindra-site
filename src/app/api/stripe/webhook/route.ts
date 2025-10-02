// src/app/[locale]/billing/portal/route.ts
export const runtime = "nodejs";       // Stripe SDK требует Node.js runtime
export const dynamic = "force-dynamic";

import {NextRequest} from "next/server";
import Stripe from "stripe";
import {getCurrentUser} from "@/lib/auth"; // твой стаб: возвращает {id,email} | null
import {db} from "@/lib/db";               // твой стаб с user.findUnique (и возможно upsert)

export async function GET(req: NextRequest) {
  // 1) Проверяем секрет
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
  }

  // 2) Stripe клиент (без жёсткого apiVersion — меньше шансов на типовые варнинги)
  const stripe = new Stripe(secret);

  // 3) Локаль из пути /{locale}/billing/portal
  const [, locale] = req.nextUrl.pathname.split("/");
  const safeLocale = locale || "en";

  // 4) Источник customerId:
  //    а) query ?c=cus_... (для дев-тестов)
  //    б) из сессии пользователя + БД (если внедришь авторизацию)
  let customerId = req.nextUrl.searchParams.get("c");

  if (!customerId) {
    try {
      const user = await getCurrentUser(); // {id,email}|null
      if (user?.id) {
        const record = await db.user.findUnique({
          where: { id: user.id },
          select: { stripeCustomerId: true }
        });
        if (record?.stripeCustomerId) {
          customerId = record.stripeCustomerId;
        }
      }
    } catch {
      // молча игнорируем — ниже вернём понятную подсказку
    }
  }

  if (!customerId) {
    // дружелюбная подсказка для теста
    return new Response(
      "Stripe customer not found. Provide via session/DB or pass ?c=cus_... for dev.",
      { status: 400 }
    );
  }

  // 5) Куда вернёмся из Customer Portal
  const returnUrl = `${req.nextUrl.origin}/${safeLocale}/account`;

  // 6) Создаём сессию портала и редиректим
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return Response.redirect(session.url, 302);
}
