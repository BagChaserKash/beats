import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { FILE_LABELS } from '@/lib/licenses';
import { formatPrice } from '@/lib/store';
import { CartLink, ClearCartOnMount } from '@/lib/cart';
import Refresher from './[id]/Refresher';
import styles from '../store.module.css';

export type OrderForView = {
  id: string;
  order_number: string;
  email: string;
  status: string;
  total_cents: number;
  stripe_session_id: string;
};

type Item = {
  id: string;
  price_cents: number;
  agreement_snapshot: string | null;
  beats: { title: string; slug: string } | null;
  license_tiers: { name: string } | null;
  entitlements: { id: string; file_kind: string; revoked: boolean }[] | null;
};

export default async function OrderView({ order }: { order: OrderForView }) {
  const { data: itemData } = await createAdminClient()
    .from('order_items')
    .select('id, price_cents, agreement_snapshot, beats ( title, slug ), license_tiers ( name ), entitlements ( id, file_kind, revoked )')
    .eq('order_id', order.id);
  const items = (itemData ?? []) as unknown as Item[];

  const ready = order.status === 'paid' || order.status === 'fulfilled';
  const pending = order.status === 'pending';
  const fileHref = (entId: string) =>
    `/beats/order/${order.id}/file/${entId}?session_id=${encodeURIComponent(order.stripe_session_id)}`;

  return (
    <div className={styles.page}>
      <ClearCartOnMount />
      {pending && <Refresher />}

      <header className={styles.header}>
        <a href="https://bagchaserkash.com" className={styles.brand}>
          BAGCHASER<span className={styles.gold}>KASH</span>
        </a>
        <CartLink />
      </header>

      <section className={styles.orderHero}>
        <p className={styles.eyebrow}>Order {order.order_number}</p>
        {ready && <h1 className={styles.orderTitle}>You’re all set.</h1>}
        {pending && <h1 className={styles.orderTitle}>Confirming your payment…</h1>}
        {!ready && !pending && <h1 className={styles.orderTitle}>This order isn’t active.</h1>}
        <p className={styles.heroSub}>
          {ready && <>Your files are below. Your receipt and license were emailed to <strong>{order.email}</strong>. You can come back to download again for 30 days.</>}
          {pending && <>This usually takes a few seconds. This page will update on its own.</>}
          {!ready && !pending && <>Status: {order.status}. If you think this is a mistake, reply to your order email.</>}
        </p>
      </section>

      <ul className={styles.orderList}>
        {items.map((item) => (
          <li key={item.id} className={styles.orderItem}>
            <div className={styles.orderItemHead}>
              <div>
                <div className={styles.rowTitle}>{item.beats?.title ?? 'Beat'}</div>
                <div className={styles.rowMeta}>
                  {item.license_tiers?.name} · {formatPrice(item.price_cents)}
                </div>
              </div>
            </div>
            {ready && (
              <div className={styles.downloads}>
                {(item.entitlements ?? [])
                  .filter((e) => !e.revoked)
                  .map((e) => (
                    <a key={e.id} href={fileHref(e.id)} className={styles.downloadButton}>
                      Download {FILE_LABELS[e.file_kind] ?? e.file_kind}
                    </a>
                  ))}
              </div>
            )}
            {item.agreement_snapshot && (
              <details className={styles.agreement}>
                <summary>View your license agreement</summary>
                <pre>{item.agreement_snapshot}</pre>
              </details>
            )}
          </li>
        ))}
      </ul>

      <p className={styles.note}>
        Total paid: {formatPrice(order.total_cents)}. <Link href="/">Keep browsing beats</Link>
      </p>
    </div>
  );
}
