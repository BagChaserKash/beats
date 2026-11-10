import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { latestTemplates, renderAgreement } from '@/lib/licenses';
import { CartLink } from '@/lib/cart';
import styles from '../store.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'License terms | BAGCHASERKASH Beats',
  description: 'The license agreements for MP3, WAV, Trackout, Unlimited, and Exclusive beat licenses from BAGCHASERKASH.',
};

export default async function LicensesPage() {
  const db = createAdminClient();
  const { data: tiers } = await db
    .from('license_tiers')
    .select('id, slug, name, sort_order')
    .eq('active', true)
    .order('sort_order');
  const list = (tiers ?? []) as { id: string; slug: string; name: string }[];
  const templates = await latestTemplates(db, list.map((t) => t.id));

  const blanks = {
    licensee_name: '[Your name]',
    licensee_email: '[your email]',
    beat_title: '[Beat title]',
    order_number: '[order number]',
    effective_date: '[purchase date]',
    price: '[price paid]',
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/beats" className={styles.brand}>
          BAGCHASER<span className={styles.gold}>KASH</span>
        </a>
        <CartLink />
      </header>
      <h1 className={styles.orderTitle}>License terms</h1>
      <p className={styles.heroSub}>
        Every purchase includes the agreement below for the license you choose. Your copy, with your name and the beat filled in, is emailed after purchase.
      </p>
      {list.map((t) => {
        const tpl = templates.get(t.id);
        return (
          <section key={t.id} id={t.slug} className={styles.licenseTerms}>
            <h2 className={styles.sectionTitle}>{t.name}</h2>
            {tpl ? <pre>{renderAgreement(tpl.agreement_body, blanks)}</pre> : <p className={styles.note}>Terms coming soon.</p>}
          </section>
        );
      })}
    </div>
  );
}
