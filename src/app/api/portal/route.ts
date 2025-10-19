export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/prisma';

export async function GET(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return new Response('Missing STRIPE_SECRET_KEY', { status: 500 });

  const stripe = new Stripe(secret);
  const returnUrl = `${req.nextUrl.origin}/account`;

  let customerId: string | undefined = req.nextUrl.searchParams.get('c') ?? undefined;

  if (!customerId) {
    const user = await getCurrentUser();
    if (!user?.id) return new Response('Unauthorized', { status: 401 });

    const rec = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { stripeCustomer: true },
    });
    if (rec?.stripeCustomer) customerId = rec.stripeCustomer;
  }

  if (!customerId) {
    return new Response('Stripe customer not found. Pass ?c=cus_... for dev.', { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId as string,
    return_url: returnUrl,
  });

  return Response.redirect(session.url, 302);
}
