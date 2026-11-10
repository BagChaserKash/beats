import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import OrderView, { type OrderForView } from '../OrderView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your order | BAGCHASERKASH', robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  const { data: order } = await createAdminClient()
    .from('orders')
    .select('id, order_number, email, status, total_cents, stripe_session_id')
    .eq('id', id)
    .maybeSingle();
  if (!order || !sessionId || order.stripe_session_id !== sessionId) notFound();

  return <OrderView order={order as OrderForView} />;
}
