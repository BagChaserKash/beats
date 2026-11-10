import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';

function money(cents: number | null) {
  if (cents == null) return '—';
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

type Tier = {
  name: string;
  default_price_cents: number;
  price_visible: boolean;
  floor_price_cents: number | null;
};

export default async function AdminHomePage() {
  const db = createAdminClient();

  const [beats, sales, offers, tiers, paid] = await Promise.all([
    db.from('beats').select('id', { count: 'exact', head: true }),
    db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['paid', 'fulfilled']),
    db.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db
      .from('license_tiers')
      .select('name, default_price_cents, price_visible, floor_price_cents')
      .order('sort_order'),
    db.from('orders').select('total_cents').in('status', ['paid', 'fulfilled']),
  ]);
  const revenue = ((paid.data ?? []) as { total_cents: number }[]).reduce((s, o) => s + o.total_cents, 0);

  if (tiers.error) {
    return (
      <main className={styles.main}>
        <h1 className={styles.h1}>Almost there</h1>
        <div className={styles.notice}>
          You’re signed in, but the database tables aren’t set up yet. Run the SQL file
          <strong> supabase/migrations/0001_init.sql</strong> in Supabase’s SQL Editor, then
          refresh this page.
        </div>
      </main>
    );
  }

  const tierRows = (tiers.data ?? []) as Tier[];

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <p className={styles.subtle}>Your store at a glance.</p>
        </div>
        <Link href="/admin/beats/new" className={styles.primaryLink}>+ Upload a beat</Link>
      </div>

      <section className={styles.stats} aria-label="Store totals">
        <div className={styles.stat}>
          <div className={styles.statValue}>{beats.count ?? 0}</div>
          <div className={styles.statLabel}>Beats</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{sales.count ?? 0}</div>
          <div className={styles.statLabel}>Sales</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{money(revenue)}</div>
          <div className={styles.statLabel}>Revenue</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{offers.count ?? 0}</div>
          <div className={styles.statLabel}>Exclusive offers waiting</div>
        </div>
      </section>

      <h2 className={styles.h2}>License tiers</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Price</th>
              <th>Shown to buyers</th>
              <th>Private minimum</th>
            </tr>
          </thead>
          <tbody>
            {tierRows.map((t) => (
              <tr key={t.name}>
                <td>{t.name}</td>
                <td>{t.price_visible ? money(t.default_price_cents) : 'Set per deal'}</td>
                <td>{t.price_visible ? 'Yes' : 'No (Inquire)'}</td>
                <td>{money(t.floor_price_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
