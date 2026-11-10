import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { fulfillOrder, markCanceled, markDisputed, markRefunded } from '@/lib/fulfillment';

export const runtime = 'nodejs';
export const maxDuration = 60;

function intentId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) return new Response('Missing signature', { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const db = createAdminClient();

  // Record the event first. A duplicate delivery hits the primary key and stops here.
  const { error: dupError } = await db.from('stripe_events').insert({ event_id: event.id, type: event.type });
  if (dupError) {
    if (dupError.code === '23505') return new Response('Already handled', { status: 200 });
    return new Response('Database error', { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId && session.payment_status === 'paid') {
          await fulfillOrder({
            orderId,
            sessionId: session.id,
            paymentIntentId: intentId(session.payment_intent as string | { id: string } | null),
            amountSubtotal: session.amount_subtotal,
            amountTotal: session.amount_total,
            amountDiscount: session.total_details?.amount_discount ?? 0,
            amountTax: session.total_details?.amount_tax ?? 0,
          });
        }
        break;
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.order_id) await markCanceled(session.metadata.order_id);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const pi = intentId(charge.payment_intent as string | { id: string } | null);
        if (pi) await markRefunded(pi, charge.refunded);
        break;
      }
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        const pi = intentId(dispute.payment_intent as string | { id: string } | null);
        if (pi) await markDisputed(pi);
        break;
      }
      default:
        break;
    }
    await db.from('stripe_events').update({ processed_at: new Date().toISOString() }).eq('event_id', event.id);
    return new Response('ok', { status: 200 });
  } catch (err) {
    // Let Stripe retry: forget this event so the retry is processed.
    await db.from('stripe_events').delete().eq('event_id', event.id);
    await db.from('event_log').insert({
      type: 'webhook.error',
      data: { event_id: event.id, type: event.type, message: err instanceof Error ? err.message : String(err) },
    });
    return new Response('Handler error', { status: 500 });
  }
}
