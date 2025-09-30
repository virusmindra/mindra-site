// src/lib/donations.ts
import Stripe from 'stripe';

const GOAL = 150_000; // $ — цель

// Безопасно падать в фолбэк, если нет ключа
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, {apiVersion: '2024-06-20'})
  : null;

export async function getProgress(): Promise<{raised:number; backers:number; goal:number}> {
  if (!stripe) {
    // фолбэк, чтобы страница не падала на превью/локалке
    return {raised: 12_000, backers: 127, goal: GOAL};
  }

  // Суммируем все успешные PaymentIntents (mode=payment/checkout)
  let raised = 0;
  let backers = 0;

  // auto-pagination
  for await (const pi of stripe.paymentIntents.list({limit: 100}).autoPagingIterator()) {
    if (pi.status === 'succeeded' && typeof pi.amount_received === 'number') {
      raised += pi.amount_received; // центы
      backers += 1;
    }
  }

  // Stripe хранит в центах
  return {raised: Math.round(raised / 100), backers, goal: GOAL};
}
