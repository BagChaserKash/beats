import { createHash, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, escapeHtml } from '@/lib/email';
import { siteUrl } from '@/lib/stripe';
import { FILE_LABELS } from '@/lib/licenses';
import { formatPrice } from '@/lib/store';

// SERVER ONLY. Runs from the verified Stripe webhook.

type Db = ReturnType<typeof createAdminClient>;

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function newAccessCode() {
  const bytes = randomBytes(12);
  let code = '';
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

// Gives the order a short code for its receipt link (keeps an existing one).
async function ensureAccessCode(db: Db, orderId: string): Promise<string> {
  const { data } = await db.from('orders').select('access_code').eq('id', orderId).maybeSingle();
  if (data?.access_code) return data.access_code as string;
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newAccessCode();
    const { error } = await db.from('orders').update({ access_code: code }).eq('id', orderId);
    if (!error) return code;
  }
  throw new Error('Couldn’t create a receipt link.');
}

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

    hours = 30 * 24;


    for (const item of items) {
      const kinds = item.license_tiers?.delivers ?? [];
      const { data: ents, error: entError } = await db
        .from('entitlements')
        .insert(kinds.map((k) => ({ order_item_id: item.id, file_kind: k })))
        .select('id, file_kind');
      if (entError) throw new Error(`Entitlements: ${entError.message}`);

      const links = ((ents ?? []) as { id: string; file_kind: string }[]).map((ent) => ({
        label: FILE_LABELS[ent.file_kind] ?? ent.file_kind,
        url: '',
      }));

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

  const orderPage = `${base}/beats/o/${await ensureAccessCode(db, order.id)}`;

  try {
    await sendEmail({
      to: order.email,
      subject: `Your BAGCHASERKASH beats: order ${order.order_number}`,
      html: buyerHtml(order.order_number, order.total_cents, emailItems, orderPage, hours),
      text: buyerText(order.order_number, order.total_cents, emailItems, orderPage, hours),
      attachments: agreementAttachments(emailItems, order.order_number),
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

// ---------- resending a receipt ----------

// Issues fresh download links for an existing paid order and emails the receipt again.
export async function resendReceipt(orderId: string): Promise<{ ok: true } | { error: string }> {
  const db = createAdminClient();
  const { data: order } = await db
    .from('orders')
    .select('id, order_number, email, total_cents, status, stripe_session_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { error: 'Order not found.' };
  if (!['paid', 'fulfilled'].includes(order.status)) return { error: 'Only paid orders can be resent.' };

  const { data: itemData } = await db
    .from('order_items')
    .select('id, price_cents, agreement_snapshot, beats ( title ), license_tiers ( name ), entitlements ( id, file_kind, revoked )')
    .eq('order_id', order.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (itemData ?? []) as any[];

  const hours = 30 * 24;
  const base = siteUrl();

  const emailItems: EmailItem[] = [];
  for (const item of items) {
    const links = ((item.entitlements ?? []) as { id: string; file_kind: string; revoked: boolean }[])
      .filter((ent) => !ent.revoked)
      .map((ent) => ({ label: FILE_LABELS[ent.file_kind] ?? ent.file_kind, url: '' }));
    const beat = Array.isArray(item.beats) ? item.beats[0] : item.beats;
    const tier = Array.isArray(item.license_tiers) ? item.license_tiers[0] : item.license_tiers;
    emailItems.push({
      title: beat?.title ?? 'Beat',
      tier: tier?.name ?? 'License',
      price: item.price_cents,
      links,
      agreement: item.agreement_snapshot ?? '',
    });
  }

  let orderPage: string;
  try {
    orderPage = `${base}/beats/o/${await ensureAccessCode(db, order.id)}`;
  } catch {
    return { error: 'Couldn’t create a receipt link.' };
  }
  try {
    await sendEmail({
      to: order.email,
      subject: `Your BAGCHASERKASH beats: order ${order.order_number}`,
      html: buyerHtml(order.order_number, order.total_cents, emailItems, orderPage, hours),
      text: buyerText(order.order_number, order.total_cents, emailItems, orderPage, hours),
      attachments: agreementAttachments(emailItems, order.order_number),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Email failed.' };
  }
  await db.from('orders').update({ status: 'fulfilled' }).eq('id', order.id).eq('status', 'paid');
  return { ok: true };
}

function agreementAttachments(items: EmailItem[], orderNumber: string) {
  return items
    .filter((i) => i.agreement)
    .map((i) => ({
      filename: `License - ${i.title.replace(/[^a-zA-Z0-9 ._()-]+/g, '').trim() || 'Beat'} - ${i.tier} - ${orderNumber}.txt`,
      content: Buffer.from(i.agreement, 'utf8').toString('base64'),
    }));
}

// ---------- test emails (admin tool) ----------

export async function sendTestEmail(to: string, mode: 'plain' | 'sample') {
  if (mode === 'plain') {
    await sendEmail({
      to,
      subject: 'Test from BAGCHASERKASH',
      text: 'This is a plain-text test message from BAGCHASERKASH. No action is needed.',
    });
    return;
  }
  const sample: EmailItem[] = [
    {
      title: 'Sample Beat',
      tier: 'MP3 Lease',
      price: 5000,
      links: [{ label: 'Untagged MP3', url: '' }],
      agreement: 'SAMPLE LICENSE AGREEMENT\n\nThis is a sample attachment for testing delivery.',
    },
  ];
  await sendEmail({
    to,
    subject: 'Your BAGCHASERKASH beats: order TEST',
    html: buyerHtml('TEST', 5000, sample, `${siteUrl()}/beats`, 72),
    text: buyerText('TEST', 5000, sample, `${siteUrl()}/beats`, 72),
    attachments: agreementAttachments(sample, 'TEST'),
  });
}

// ---------- email bodies ----------
// Kept short and simple: strict inboxes (like iCloud) reject long, link-heavy
// emails from new domains. Full agreements go out as attachments.

type EmailItem = { title: string; tier: string; price: number; links: { label: string; url: string }[]; agreement: string };

function buyerHtml(orderNumber: string, total: number, items: EmailItem[], orderPage: string, _hours: number) {
  const rows = items
    .map(
      (i) => `<p style="margin:14px 0 0"><strong>${escapeHtml(i.title)}</strong><br>
      <span style="color:#555">${escapeHtml(i.tier)}, ${formatPrice(i.price)}. Includes: ${escapeHtml(i.links.map((l) => l.label).join(', '))}</span></p>`
    )
    .join('');

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;color:#111;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5">
  <div style="max-width:560px;margin:0 auto">
    <p style="font-size:20px;font-weight:bold;margin:0 0 16px">BAGCHASERKASH</p>
    <p style="margin:0 0 4px">Thanks for your order.</p>
    <p style="margin:0;color:#555">Order ${escapeHtml(orderNumber)}. Total ${formatPrice(total)}.</p>
    ${rows}
    <p style="margin:24px 0"><a href="${orderPage}" style="background:#c9a54c;color:#000;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:6px;display:inline-block">Download your files</a></p>
    <p style="margin:0">Your downloads stay available for 30 days. Your license agreement for each beat is attached to this email. Please keep it for your records.</p>
    <p style="margin:22px 0 0;color:#777;font-size:13px">Questions? Just reply to this email.</p>
  </div></body></html>`;
}

function buyerText(orderNumber: string, total: number, items: EmailItem[], orderPage: string, _hours: number) {
  return [
    'Thanks for your order from BAGCHASERKASH.',
    `Order ${orderNumber}. Total ${formatPrice(total)}.`,
    '',
    ...items.map((i) => `${i.title} (${i.tier}, ${formatPrice(i.price)})`),
    '',
    `Download your files: ${orderPage}`,
    'Your downloads stay available for 30 days.',
    '',
    'Your license agreement for each beat is attached to this email.',
    'Questions? Just reply to this email.',
  ].join('\n');
}
