'use client';

import Link from 'next/link';
import { addToCart, useCart } from '@/lib/cart';
import styles from '../store.module.css';

export default function AddToCart({ beatId, tierId }: { beatId: string; tierId: string }) {
  const { items } = useCart();
  const inCart = items.find((i) => i.beatId === beatId);

  if (inCart?.tierId === tierId) {
    return (
      <Link href="/cart" className={styles.inCartButton}>
        ✓ In cart · Checkout
      </Link>
    );
  }

  return (
    <button type="button" className={styles.addButton} onClick={() => addToCart({ beatId, tierId })}>
      {inCart ? 'Switch to this license' : 'Add to cart'}
    </button>
  );
}
