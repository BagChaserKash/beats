import type { Metadata } from 'next';
import CartView from './CartView';
import styles from '../store.module.css';

export const metadata: Metadata = { title: 'Cart | BAGCHASERKASH Beats', robots: { index: false } };

export default function CartPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="https://bagchaserkash.com" className={styles.brand}>
          BAGCHASER<span className={styles.gold}>KASH</span>
        </a>
        <a href="/beats" className={styles.headerTag}>← Keep browsing</a>
      </header>
      <h1 className={styles.orderTitle}>Your cart</h1>
      <CartView />
    </div>
  );
}
