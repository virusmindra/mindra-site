// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/server/db/prisma'
import { getUserId } from '@/lib/auth'


const PRICE_MAP: Record<string, string> = {
  // PLUS
  'PLUS:1M': process.env.STRIPE_PRICE_PLUS_1M!,
  'PLUS:3M': process.env.STRIPE_PRICE_PLUS_3M!,
  'PLUS:6M': process.env.STRIPE_PRICE_PLUS_6M!,
  'PLUS:12M': process.env.STRIPE_PRICE_PLUS_12M!,
  'PLUS:LIFETIME': process.env.STRIPE_PRICE_PLUS_LIFETIME!,
  // PRO (если используешь)
  'PRO:1M': process.env.STRIPE_PRICE_PRO_1M ?? '',
  'PRO:3M': process.env.STRIPE_PRICE_PRO_3M ?? '',
  'PRO:6M': process.env.STRIPE_PRICE_PRO_6M ?? '',
  'PRO:12M': process.env.STRIPE_PRICE_PRO_12M ?? '',
  'PRO:LIFETIME': process.env.STRIPE_PRICE_PRO_LIFETIME ?? '',
}

export async function POST(req: NextRequest) {
  const { plan, term } = await req.json() as { plan: 'PLUS'|'PRO', term: '1M'|'3M'|'6M'|'12M'|'LIFETIME' }
  const key = `${plan}:${term}`
  const priceId = PRICE_MAP[key]
  if (!priceId) return NextResponse.json({error:'Unknown plan/term'}, { status: 400 })

  const userId = await getUserId()
  if (!userId) return NextResponse.json({error:'unauthorized'}, { status: 401 })

  // customer
  let sub = await prisma.subscription.findUnique({ where:{ userId } })
  let customerId = sub?.stripeCustomer
  if (!customerId) {
    const c = await stripe.customers.create({ metadata:{ userId } })
    customerId = c.id
    await prisma.subscription.upsert({
      where:{ userId },
      create:{ userId, stripeCustomer: customerId, status:'incomplete', plan:'FREE' as any },
      update:{ stripeCustomer: customerId },
    })
  }

  // режим: подписка или разовая оплата для Lifetime
  const isLifetime = term === 'LIFETIME'
  const session = await stripe.checkout.sessions.create({
    mode: isLifetime ? 'payment' : 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
  })

  return NextResponse.json({ url: session.url })
}
