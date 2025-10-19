import Stripe from 'stripe';

// самый простой и правильный вариант — без apiVersion:
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
