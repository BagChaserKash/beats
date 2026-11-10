import Stripe from 'stripe';

// SERVER ONLY.
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set in Vercel environment variables.');
    client = new Stripe(key.trim());
  }
  return client;
}

export function siteUrl() {
  return (process.env.SITE_URL ?? 'https://bagchaserkash.com').trim().replace(/\/$/, '');
}
