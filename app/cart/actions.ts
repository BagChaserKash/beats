'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { validateCart, type CartItemInput, type CartLine } from '@/lib/checkout';
import { latestTemplates, renderAgreement } from '@/lib/licenses';
import { stripe, siteUrl } from '@/lib/stripe';
import { formatPrice } from '@/lib/store';

export async function priceCart(items: CartItemInput[]): Promise<{
  lines: CartLine[];
  problems: { beatId: string; message: string }[];
}> {
  return validateCart(Array.isArray(items) ? items : []);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function startCheckout(input: {
  items: CartItemInput[];
  email: string;
  name: string;
  agreed: boolean;
}): Promise<{ url: string } | { error: string }> {
  const email = String(input.email ?? '').trim().toLowerCase();
  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: 'Enter a valid email address.' };
  if (name.length < 2 || name.length > 100) return { error: 'Enter the name to put on your license.' };
  if (input.agreed !== true) return { error: 'Please agree to the license terms to continue.' };

  const { lines, problems } = await validateCart(Array.isArray(input.items) ? input.items : []);
  if (problems.length > 0) return { error: problems[0].message };
  if (lines.length === 0) return { error: 'Your cart is empty.' };

  const db = createAdminClient();

  // Customer record (one per email).
  const { data: existing } = await db
    .from('customers')
    .select('id, blocked')
    .eq('email', email)
    .maybeSingle();
  if (existing?.blocked) return { error: 'This email can’t make purchases. Please contact support.' };

  let customerId = existing?.id as string | undefined;
  if (!customerId) {
    const { data: created, error } = await db
      .from('customers')
      .insert({ email, artist_name: name })
      .select('id')
      .single();
    if (error || !created) return { error: 'Couldn’t start checkout. Please try again.' };
    customerId = created.id;
  }

  // The exact agreement version for each tier, frozen into the order.
  const templates = await latestTemplates(db, lines.map((l) => l.tierId));
  if (lines.some((l) => !templates.has(l.tierId))) {
    return { error: 'License terms aren’t ready yet. Please try again later.' };
  }

  const subtotal = lines.reduce((sum, l) => sum + l.priceCents, 0);
  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({ customer_id: customerId, email, status: 'pending', subtotal_cents: subtotal, total_cents: subtotal })
    .select('id, order_number')
    .single();
  if (orderError || !order) return { error: 'Couldn’t start checkout. Please try again.' };

  const effectiveDate = new Date().toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'America/New_York' });
  const itemRows = lines.map((l) => {
    const t = templates.get(l.tierId)!;
    return {
      order_id: order.id,
      beat_id: l.beatId,
      tier_id: l.tierId,
      price_cents: l.priceCents,
      template_version_id: t.id,
      terms_snapshot: { ...t.terms, tier: l.tierName, version: t.version },
      agreement_snapshot: renderAgreement(t.agreement_body, {
        licensee_name: name,
        licensee_email: email,
        beat_title: l.beatTitle,
        order_number: order.order_number,
        effective_date: effectiveDate,
        price: formatPrice(l.priceCents),
      }),
      licensee_name: name,
    };
  });
  const { error: itemsError } = await db.from('order_items').insert(itemRows);
  if (itemsError) return { error: 'Couldn’t start checkout. Please try again.' };

  // Payment methods come from Settings (default: card + crypto).
  const { data: pm } = await db.from('settings').select('value').eq('key', 'payment_methods').maybeSingle();
  const configured = Array.isArray(pm?.value) ? (pm!.value as string[]) : ['card', 'crypto'];
  const methods = configured.filter((m) => m === 'card' || m === 'crypto');

  const base = siteUrl();
  const params = {
    mode: 'payment',
    customer_email: email,
    line_items: lines.map((l) => ({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: l.priceCents,
        product_data: {
          name: `${l.beatTitle} — ${l.tierName}`,
          description: 'Non-exclusive beat license from BAGCHASERKASH',
        },
      },
    })),
    allow_promotion_codes: true,
    metadata: { order_id: order.id, order_number: order.order_number },
    payment_intent_data: { metadata: { order_id: order.id, order_number: order.order_number } },
    success_url: `${base}/beats/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/beats/cart`,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let session: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session = await stripe().checkout.sessions.create({ ...params, payment_method_types: methods } as any);
  } catch (err) {
    // Crypto may not be approved on the Stripe account yet: fall back to cards.
    if (methods.includes('crypto')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session = await stripe().checkout.sessions.create({ ...params, payment_method_types: ['card'] } as any);
      await db.from('event_log').insert({
        type: 'checkout.crypto_unavailable',
        data: { message: err instanceof Error ? err.message : String(err) },
      });
    } else {
      throw err;
    }
  }

  await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
  if (!session.url) return { error: 'Couldn’t start checkout. Please try again.' };
  return { url: session.url as string };
}
