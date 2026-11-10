import { createHash, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, escapeHtml } from '@/lib/email';
import { siteUrl } from '@/lib/stripe';
import { FILE_LABELS } from '@/lib/licenses';
import { formatPrice } from '@/lib/store';

// SERVER ONLY. Runs from the verified Stripe webhook.

type Db = ReturnType<typeof createAdminClient>;

export function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

async function setting<T>(db: Db, key: string, fallback: T): Promise<T> {
  const { data } = await db.from('settings').select('value').eq('key', key).maybeSingle();
  return (data?.value as T) ?? fallback;
}

type ItemRow = {
  id: string;
  price_cents: number;
  agreement_snapshot: string | null;
  licensee_name: string | null;
  beats: { title: string; slug: string } | null;
  license_tiers: { name: string; delivers: string[] } | null;
};

export async function fulfillOrder(input: {
  orderId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amountSubtotal: number | null;
  amountTotal: number | null;
  amountDiscount: number;
  amountTax: number;
}) {
  const db = createAdminClient();

  // Claim the order atomically: only one webhook delivery can move it
  // from pending to paid, so retries never deliver twice.
  const { data: order } = await db
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: input.paymentIntentId,
      subtotal_cents: input.amountSubtotal ?? undefined,
      total_cents: input.amountTotal ?? undefined,
      discount_cents: input.amountDiscount,
      tax_cents: input.amountTax,
    })
    .eq('id', input.orderId)
    .eq('stripe_session_id', input.sessionId)
    .eq('status', 'pending')
    .select('id, order_number, email, total_cents')
    .maybeSingle();
  if (!order) return;

  let items: ItemRow[] = [];
  let hours = 72;
  const emailItems: { title: string; tier: string; price: number; links: { label: string; url: string }[]; agreement: string }[] = [];
  const base = siteUrl();

  try {
    const { data: itemData } = await db
      .from('order_items')
      .select('id, price_cents, agreement_snapshot, licensee_name, beats ( title, slug ), license_tiers ( name, delivers )')
      .eq('order_id', order.id);
    items = (itemData ?? []) as unknown as ItemRow[];
    if (items.length === 0) throw new Error('Order has no items.');

    hours = Number(await setting(db, 'download_link_hours', 72)) || 72;
    const maxUses = Number(await setting(db, 'download_max_uses', 5)) || 5;
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();


    for (const item of items) {
      const kinds = item.license_tiers?.delivers ?? [];
      const { data: ents, error: entError } = await db
        .from('entitlements')
        .insert(kinds.map((k) => ({ order_item_id: item.id, file_kind: k })))
        .select('id, file_kind');
      if (entError) throw new Error(`Entitlements: ${entError.message}`);

      const links: { label: string; url: string }[] = [];
      for (const ent of (ents ?? []) as { id: string; file_kind: string }[]) {
        const raw = randomBytes(32).toString('base64url');
        const { error: tokenError } = await db.from('download_tokens').insert({
          token_hash: hashToken(raw),
          entitlement_id: ent.id,
          expires_at: expiresAt,
          max_uses: maxUses,
        });
        if (tokenError) throw new Error(`Download token: ${tokenError.message}`);
        links.push({ label: FILE_LABELS[ent.file_kind] ?? ent.file_kind, url: `${base}/beats/download/${raw}` });
      }

      emailItems.push({
        title: item.beats?.title ?? 'Beat',
        tier: item.license_tiers?.name ?? 'License',
        price: item.price_cents,
        links,
        agreement: item.agreement_snapshot ?? '',
      });
    }

  } catch (err) {
    // Undo so Stripe's retry can deliver cleanly.
    const ids = items.map((it) => it.id);
    if (ids.length) await db.from('entitlements').delete().in('order_item_id', ids);
    await db.from('orders').update({ status: 'pending' }).eq('id', order.id).eq('status', 'paid');
    throw err;
  }

  const orderPage = `${base}/beats/order/${order.id}?session_id=${encodeURIComponent(input.sessionId)}`;

  try {
    await sendEmail({
      to: order.email,
      subject: `Your BAGCHASERKASH beats: order ${order.order_number}`,
      html: buyerHtml(order.order_number, order.total_cents, emailItems, orderPage, hours),
      text: buyerText(order.order_number, order.total_cents, emailItems, orderPage, hours),
    });
    await db.from('orders').update({ status: 'fulfilled' }).eq('id', order.id).eq('status', 'paid');
  } catch (err) {
    await db.from('event_log').insert({
      type: 'email.delivery_failed',
      data: { order_id: order.id, message: err instanceof Error ? err.message : String(err) },
    });
  }

  await notifyAdmin(
    `Sale: ${formatPrice(order.total_cents)} (order ${order.order_number})`,
    `${order.email} bought:\n${emailItems.map((i) => `- ${i.title}: ${i.tier} (${formatPrice(i.price)})`).join('\n')}`
  );
}

export async function notifyAdmin(subject: string, body: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (!to) return;
  try {
    await sendEmail({
      to,
      subject,
      text: body,
      html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(body)}</pre>`,
    });
  } catch {
    // Notifications are best effort.
  }
}

async function revokeOrder(db: Db, orderId: string) {
  const { data: items } = await db.from('order_items').select('id').eq('order_id', orderId);
  const ids = ((items ?? []) as { id: string }[]).map((i) => i.id);
  if (ids.length) await db.from('entitlements').update({ revoked: true }).in('order_item_id', ids);
}

export async function markRefunded(paymentIntentId: string, full: boolean) {
  const db = createAdminClient();
  const { data: order } = await db
    .from('orders')
    .update({ status: full ? 'refunded' : 'partially_refunded' })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select('id, order_number, email')
    .maybeSingle();
  if (!order) return;
  if (full) await revokeOrder(db, order.id);
  await notifyAdmin(
    `${full ? 'Refund' : 'Partial refund'}: order ${order.order_number}`,
    `Order ${order.order_number} (${order.email}) was ${full ? 'fully refunded. Downloads are now disabled and the license has ended.' : 'partially refunded.'}`
  );
}

export async function markDisputed(paymentIntentId: string) {
  const db = createAdminClient();
  const { data: order } = await db
    .from('orders')
    .update({ status: 'disputed' })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select('id, order_number, email')
    .maybeSingle();
  if (!order) return;
  await revokeOrder(db, order.id);
  await notifyAdmin(
    `Dispute opened: order ${order.order_number}`,
    `The buyer (${order.email}) opened a chargeback on order ${order.order_number}. Downloads are disabled. Respond in your Stripe dashboard.`
  );
}

export async function markCanceled(orderId: string) {
  const db = createAdminClient();
  await db.from('orders').update({ status: 'canceled' }).eq('id', orderId).eq('status', 'pending');
}

// ---------- email bodies ----------

function buyerHtml(
  orderNumber: string,
  total: number,
  items: { title: string; tier: string; price: number; links: { label: string; url: string }[]; agreement: string }[],
  orderPage: string,
  hours: number
) {
  const rows = items
    .map(
      (i) => `
      <tr><td style="padding:16px 0;border-top:1px solid #333">
        <div style="font-size:18px;font-weight:700">${escapeHtml(i.title)}</div>
        <div style="color:#999;margin:2px 0 10px">${escapeHtml(i.tier)} · ${formatPrice(i.price)}</div>
        ${i.links
          .map(
            (l) =>
              `<a href="${l.url}" style="display:inline-block;background:#c9a54c;color:#000;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:6px;margin:0 8px 8px 0">Download ${escapeHtml(l.label)}</a>`
          )
          .join('')}
      </td></tr>`
    )
    .join('');

  const agreements = items
    .map(
      (i) =>
        `<h3 style="margin:28px 0 8px">${escapeHtml(i.title)}: ${escapeHtml(i.tier)}</h3><pre style="white-space:pre-wrap;font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.5;background:#111;color:#ddd;padding:14px;border-radius:6px">${escapeHtml(i.agreement)}</pre>`
    )
    .join('');

  return `<!doctype html><html><body style="margin:0;background:#000;color:#f5f5f2;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:28px 20px">
    <div style="font-size:24px;font-weight:800">BAGCHASER<span style="color:#c9a54c">KASH</span></div>
    <h1 style="font-size:22px;margin:24px 0 6px">Thanks for your order.</h1>
    <p style="color:#bbb;margin:0 0 6px">Order ${escapeHtml(orderNumber)} · Total ${formatPrice(total)}</p>
    <p style="color:#bbb;margin:0 0 18px">Your download links work for ${hours} hours. After that, use your <a href="${orderPage}" style="color:#c9a54c">order page</a> to download again.</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <h2 style="font-size:18px;margin:32px 0 0">Your license agreements</h2>
    <p style="color:#999;font-size:13px">Keep this email. It's your record of the license you agreed to at checkout.</p>
    ${agreements}
    <p style="color:#777;font-size:12px;margin-top:32px">Questions? Reply to this email.</p>
  </div></body></html>`;
}

function buyerText(
  orderNumber: string,
  total: number,
  items: { title: string; tier: string; price: number; links: { label: string; url: string }[]; agreement: string }[],
  orderPage: string,
  hours: number
) {
  return [
    `Thanks for your order from BAGCHASERKASH.`,
    `Order ${orderNumber} · Total ${formatPrice(total)}`,
    `Download links work for ${hours} hours. After that, use your order page: ${orderPage}`,
    '',
    ...items.flatMap((i) => [
      `${i.title} (${i.tier}, ${formatPrice(i.price)})`,
      ...i.links.map((l) => `  ${l.label}: ${l.url}`),
      '',
    ]),
    'YOUR LICENSE AGREEMENTS',
    '',
    ...items.flatMap((i) => [`--- ${i.title}: ${i.tier} ---`, i.agreement, '']),
  ].join('\n');
}
