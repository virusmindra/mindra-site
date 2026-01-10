export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/server/prisma';
import { recomputeEntitlements } from '@/lib/entitlements';
import { syncVoiceEntitlementsFromStripe } from '@/lib/voice/stripe-sync';

// price_id -> план/срок
const PRICE_TO_PLAN: Record<
  string,
  { plan: 'PLUS' | 'PRO'; term: '1M' | '3M' | '6M' | '12M' | 'LIFETIME' }
> = {
  [process.env.STRIPE_PRICE_PLUS_1M ?? '']: { plan: 'PLUS', term: '1M' },
  [process.env.STRIPE_PRICE_PLUS_3M ?? '']: { plan: 'PLUS', term: '3M' },
  [process.env.STRIPE_PRICE_PLUS_6M ?? '']: { plan: 'PLUS', term: '6M' },
  [process.env.STRIPE_PRICE_PLUS_12M ?? '']: { plan: 'PLUS', term: '12M' },
  [process.env.STRIPE_PRICE_PLUS_LIFETIME ?? '']: { plan: 'PLUS', term: 'LIFETIME' },

  [process.env.STRIPE_PRICE_PRO_1M ?? '']: { plan: 'PRO', term: '1M' },
  [process.env.STRIPE_PRICE_PRO_3M ?? '']: { plan: 'PRO', term: '3M' },
  [process.env.STRIPE_PRICE_PRO_6M ?? '']: { plan: 'PRO', term: '6M' },
  [process.env.STRIPE_PRICE_PRO_12M ?? '']: { plan: 'PRO', term: '12M' },
  [process.env.STRIPE_PRICE_PRO_LIFETIME ?? '']: { plan: 'PRO', term: 'LIFETIME' },
};

function priceToInfo(priceId?: string | null) {
  return priceId ? PRICE_TO_PLAN[priceId] : undefined;
}

function eventTypeForSubscriptionEvent(eType: string): 'SUBSCRIPTION_RENEW' | 'SUBSCRIPTION_CHANGE' {
  // created/resumed/updated считаем "change", а renew определяем по смене periodEnd внутри sync (isNewPeriod)
  // Но для аналитики: updated -> change, created/resumed -> change.
  if (eType === 'customer.subscription.updated') return 'SUBSCRIPTION_CHANGE';
  return 'SUBSCRIPTION_CHANGE';
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Missing signature or secret', { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e: any) {
    return new NextResponse(`Webhook Error: ${e.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.resumed': {
      const s: any = event.data.object;
      const customerId = s.customer as string;

      const rec = await prisma.subscription.findFirst({
        where: { stripeCustomer: customerId },
      });
      if (!rec) return NextResponse.json({ ok: true });

      const priceId = s.items?.data?.[0]?.price?.id ?? null;
      const info = priceToInfo(priceId);

      const plan = (info?.plan ?? rec.plan) as any;
      const term = (info?.term ?? rec.term) ?? null;

      const periodStart = s.current_period_start ? new Date(s.current_period_start * 1000) : null;
      const periodEnd = s.current_period_end ? new Date(s.current_period_end * 1000) : null;

      await prisma.subscription.update({
        where: { userId: rec.userId },
        data: {
          status: s.status,
          plan,
          term,
          stripeSubscription: s.id,
          currentPeriodEnd: periodEnd,
        },
      });

      await syncVoiceEntitlementsFromStripe({
        userId: rec.userId,
        plan,
        status: s.status,
        periodStart,
        periodEnd,
        stripeEventId: event.id,
        eventType: eventTypeForSubscriptionEvent(event.type),
      });

      await recomputeEntitlements(rec.userId);
      return NextResponse.json({ ok: true });
    }

    case 'customer.subscription.deleted': {
      const s: any = event.data.object;
      const customerId = s.customer as string;

      const rec = await prisma.subscription.findFirst({
        where: { stripeCustomer: customerId },
      });
      if (!rec) return NextResponse.json({ ok: true });

      const endedAt = s.ended_at ? new Date(s.ended_at * 1000) : new Date();

      await prisma.subscription.update({
        where: { userId: rec.userId },
        data: {
          status: 'canceled',
          plan: 'FREE' as any,
          term: null,
          stripeSubscription: null,
          currentPeriodEnd: endedAt,
        },
      });

      // при удалении подписки отключаем голос/минуты
      await syncVoiceEntitlementsFromStripe({
        userId: rec.userId,
        plan: 'FREE',
        status: 'canceled',
        periodStart: null,
        periodEnd: null,
        stripeEventId: event.id,
        eventType: 'SUBSCRIPTION_CHANGE',
      });

      await recomputeEntitlements(rec.userId);
      return NextResponse.json({ ok: true });
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;

      const rec = await prisma.subscription.findFirst({
        where: { stripeCustomer: customerId },
      });
      if (!rec) return NextResponse.json({ ok: true });

      // subscription checkout -> подтянем subscription из Stripe (фоллбек)
      if (session.mode === 'subscription' && session.subscription) {
        const sub: any = await stripe.subscriptions.retrieve(session.subscription as string);

        const priceId = sub.items?.data?.[0]?.price?.id ?? null;
        const info = priceToInfo(priceId);

        const plan = (info?.plan ?? rec.plan) as any;
        const term = (info?.term ?? rec.term) ?? null;

        const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : null;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

        await prisma.subscription.update({
          where: { userId: rec.userId },
          data: {
            status: sub.status,
            plan,
            term,
            stripeSubscription: sub.id,
            currentPeriodEnd: periodEnd,
          },
        });

        await syncVoiceEntitlementsFromStripe({
          userId: rec.userId,
          plan,
          status: sub.status,
          periodStart,
          periodEnd,
          stripeEventId: event.id,
          eventType: 'SUBSCRIPTION_CHANGE',
        });

        await recomputeEntitlements(rec.userId);
        return NextResponse.json({ ok: true });
      }

      // one-time payment (lifetime)
      if (session.mode === 'payment') {
        await prisma.subscription.update({
          where: { userId: rec.userId },
          data: {
            status: 'active',
            term: 'LIFETIME',
            stripeSubscription: null,
            currentPeriodEnd: null,
          },
        });

        // если lifetime = PRO/PLUS у тебя по price mapping — можно расширить.
        // Сейчас просто пересчитываем энтайтлменты по твоей логике.
        await recomputeEntitlements(rec.userId);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true });
  }
}
