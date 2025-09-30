// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ВАЖНО: вебхук должен работать на Node, не на Edge
export const runtime = 'nodejs';
// Чтобы Next не пытался статически пререндерить
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// Если хочешь — можно зафиксировать версию, но необязательно:
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return new NextResponse('Missing Stripe signature or webhook secret', { status: 400 });
  }

  // Для Stripe нужен «сырой» body
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Обработчики нужных событий
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        // TODO: здесь помечаем e-mail как «founder» (35%/40%),
        // обновляем БД / KV / файл — как решим хранить.
        // Пример: await markFounder(pi.receipt_email ?? pi.customer);
        break;
      }
      case 'checkout.session.completed': {
        const cs = event.data.object as Stripe.Checkout.Session;
        // Если используем Checkout — аналогично берём email: cs.customer_details?.email
        break;
      }
      default:
        // no-op
        break;
    }
  } catch (err: any) {
    // если внутри обработчика упали — вернём 500, чтобы Stripe ретрайл сделал
    return new NextResponse(`Handler Error: ${err.message}`, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
