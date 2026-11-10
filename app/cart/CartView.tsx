'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart, removeFromCart } from '@/lib/cart';
import { priceCart, startCheckout } from './actions';
import type { CartLine } from '@/lib/checkout';
import styles from '../store.module.css';

function money(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function CartView() {
  const { items, ready } = useCart();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    priceCart(items).then(({ lines: fresh, problems }) => {
      if (cancelled) return;
      setLines(fresh);
      if (problems.length) {
        setNotices(problems.map((p) => p.message));
        problems.forEach((p) => removeFromCart(p.beatId));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [items, ready]);

  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await startCheckout({ items, email, name, agreed });
      if ('error' in result) {
        setError(result.error);
        setBusy(false);
        return;
      }
      window.location.href = result.url;
    } catch {
      setError('Something went wrong starting checkout. Please try again.');
      setBusy(false);
    }
  }

  if (!ready || lines === null) return <p className={styles.empty}>Loading your cart…</p>;

  const total = lines.reduce((sum, l) => sum + l.priceCents, 0);

  return (
    <>
      {notices.map((n) => (
        <p key={n} className={styles.cartNotice}>{n}</p>
      ))}

      {lines.length === 0 ? (
        <p className={styles.empty}>
          Your cart is empty. <Link href="/">Find a beat</Link>
        </p>
      ) : (
        <div className={styles.cartLayout}>
          <ul className={styles.list}>
            {lines.map((l) => (
              <li key={l.beatId} className={styles.row}>
                {l.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.artworkUrl} alt="" className={styles.rowArt} />
                ) : (
                  <div className={styles.rowArtEmpty} aria-hidden="true" />
                )}
                <div className={styles.rowInfo}>
                  <Link href={`/${l.slug}`} className={styles.rowTitle}>{l.beatTitle}</Link>
                  <div className={styles.rowMeta}>
                    {l.tierName} · <Link href={`/licenses#${l.tierSlug}`} target="_blank">View terms</Link>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <span className={styles.cartPrice}>{money(l.priceCents)}</span>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => removeFromCart(l.beatId)}
                    aria-label={`Remove ${l.beatTitle}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <form className={styles.checkoutBox} onSubmit={checkout}>
            <div className={styles.cartTotal}>
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <label className={styles.cartField}>
              <span>Email (for your files and receipt)</span>
              <input className={styles.input} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className={styles.cartField}>
              <span>Name on the license (artist or legal name)</span>
              <input className={styles.input} required maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className={styles.agreeRow}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
              <span>
                I agree to the <Link href="/licenses" target="_blank">license terms</Link> for each beat in my cart.
              </span>
            </label>
            <button className={styles.checkoutButton} type="submit" disabled={busy}>
              {busy ? 'Opening secure checkout…' : 'Checkout'}
            </button>
            <p className={styles.note}>Pay by card or crypto through Stripe. Discount codes can be entered on the next screen.</p>
            {error && <p className={styles.cartError} role="alert">{error}</p>}
          </form>
        </div>
      )}
    </>
  );
}
