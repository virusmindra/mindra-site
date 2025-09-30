// src/lib/donations.ts
import Stripe from 'stripe';

export type Progress = {
  raisedCents: number;
  raised: string;
  backers: number;
  goalCents: number;
  goal: string;
};

const DEFAULT_GOAL_CENTS = 150_000 * 100;
const usd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', {maximumFractionDigits: 2})}`;

export async function getProgress(): Promise<Progress> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is missing (.env.local)');

  const stripe = new Stripe(key);

  let raisedCents = 0;
  let backers = 0;

  // --- Ручная пагинация (совместимо с любыми типами Stripe) ---
  let starting_after: string | undefined = undefined;

  while (true) {
    const page: Stripe.Response<Stripe.ApiList<Stripe.PaymentIntent>> =
        await stripe.paymentIntents.list({ limit: 100, starting_after });

    for (const pi of page.data) {
      if (pi.status === 'succeeded' && typeof pi.amount_received === 'number') {
       raisedCents += pi.amount_received;
       backers += 1;
    }
  }

  if (!page.has_more) break;
  starting_after = page.data[page.data.length - 1]?.id;
    }

  const goalCents = DEFAULT_GOAL_CENTS;

  return {
    raisedCents,
    raised: usd(raisedCents),
    backers,
    goalCents,
    goal: usd(goalCents)
  };
}
