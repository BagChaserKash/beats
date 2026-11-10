import { createAdminClient } from '@/lib/supabase/admin';
import { money } from '@/lib/beats';
import styles from '../../admin.module.css';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  order_number: string;
  email: string;
  status: string;
  total_cents: number;
  created_at: string;
  paid_at: string | null;
  order_items: { price_cents: number; beats: { title: string } | null; license_tiers: { name: string } | null }[] | null;
};

const LABEL: Record<string, string> = {
  pending: 'Checkout started',
  paid: 'Paid (email pending)',
  fulfilled: 'Delivered',
  refunded: 'Refunded',
  partially_refunded: 'Partly refunded',
  disputed: 'Disputed',
  canceled: 'Abandoned',
};

export default async function OrdersPage() {
  const { data } = await createAdminClient()
    .from('orders')
    .select('id, order_number, email, status, total_cents, created_at, paid_at, order_items ( price_cents, beats ( title ), license_tiers ( name ) )')
    .order('created_at', { ascending: false })
    .limit(200);
  const orders = (data ?? []) as unknown as Row[];

  return (
    <main className={styles.main}>
      <h1 className={styles.h1}>Orders</h1>
      <p className={styles.subtle}>
        Refunds are issued in your Stripe dashboard. When you refund there, the order updates here and downloads turn off automatically.
      </p>
      {orders.length === 0 ? (
        <div className={styles.notice}>No orders yet.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Buyer</th>
                <th>Beats</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_number}</td>
                  <td>{new Date(o.paid_at ?? o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{o.email}</td>
                  <td>
                    {(o.order_items ?? []).map((i, n) => (
                      <div key={n}>
                        {i.beats?.title} <span className={styles.help} style={{ display: 'inline' }}>({i.license_tiers?.name})</span>
                      </div>
                    ))}
                  </td>
                  <td>{money(o.total_cents)}</td>
                  <td>
                    <span className={`${styles.badge} ${o.status === 'fulfilled' ? styles.badge_published : ''}`}>
                      {LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
