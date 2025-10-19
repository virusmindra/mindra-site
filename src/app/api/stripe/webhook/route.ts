export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/server/prisma';
import { recomputeEntitlements } from '@/lib/entitlements';

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
      // ВАЖНО: any — чтобы обойти конфликт типов (Prisma Subscription vs Stripe Subscription)
      const s: any = event.data.object;
      const customerId = s.customer as string;

      const rec = await prisma.subscription.findFirst({
        where: { stripeCustomer: customerId },
      });
      if (!rec) return NextResponse.json({ ok: true });

      const priceId = s.items?.data?.[0]?.price?.id ?? null;
      const info = priceToInfo(priceId);

      await prisma.subscription.update({
        where: { userId: rec.userId },
        data: {
          status: s.status,
          plan: (info?.plan ?? rec.plan) as any,
          term: (info?.term ?? rec.term) ?? null,
          stripeSubscription: s.id,
          currentPeriodEnd: s.current_period_end ? new Date(s.current_period_end * 1000) : null,
        },
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

      await prisma.subscription.update({
        where: { userId: rec.userId },
        data: {
          status: 'canceled',
          currentPeriodEnd: s.ended_at ? new Date(s.ended_at * 1000) : new Date(),
        },
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

      if (session.mode === 'subscription' && session.subscription) {
        // any — чтобы не спорить с Response<Subscription>
        const sub: any = await stripe.subscriptions.retrieve(session.subscription as string);

        const priceId = sub.items?.data?.[0]?.price?.id ?? null;
        const info = priceToInfo(priceId);

        await prisma.subscription.update({
          where: { userId: rec.userId },
          data: {
            status: sub.status,
            plan: (info?.plan ?? rec.plan) as any,
            term: (info?.term ?? rec.term) ?? null,
            stripeSubscription: sub.id,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
          },
        });
        await recomputeEntitlements(rec.userId);
        return NextResponse.json({ ok: true });
      }

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
        await recomputeEntitlements(rec.userId);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true });
  }
}
