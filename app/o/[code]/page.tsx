import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import OrderView, { type OrderForView } from '../../order/OrderView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your order | BAGCHASERKASH', robots: { index: false } };

// The link in receipt emails. Shows the order directly (no redirect),
// because strict inboxes reject emails whose links redirect.
export default async function ReceiptOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[a-z0-9]{8,20}$/.test(code)) notFound();

  const { data: order } = await createAdminClient()
    .from('orders')
    .select('id, order_number, email, status, total_cents, stripe_session_id')
    .eq('access_code', code)
    .maybeSingle();
  if (!order || !order.stripe_session_id) notFound();

  return <OrderView order={order as OrderForView} />;
}
