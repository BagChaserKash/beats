'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '@/app/store.module.css';

export type CartItem = { beatId: string; tierId: string };

const KEY = 'bck:cart';
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter(
          (i): i is CartItem => i && typeof i.beatId === 'string' && typeof i.tierId === 'string'
        )
      : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable; the cart lasts until the page closes.
  }
  listeners.forEach((fn) => fn());
}

// One license per beat: picking another tier for the same beat replaces it.
export function addToCart(item: CartItem) {
  write([...read().filter((i) => i.beatId !== item.beatId), item]);
}

export function removeFromCart(beatId: string) {
  write(read().filter((i) => i.beatId !== beatId));
}

export function clearCart() {
  write([]);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    setReady(true);
    listeners.add(sync);
    window.addEventListener('storage', sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { items, ready };
}

export function CartLink() {
  const { items } = useCart();
  return (
    <Link href="/cart" className={styles.cartLink}>
      Cart{items.length > 0 ? ` (${items.length})` : ''}
    </Link>
  );
}

export function ClearCartOnMount() {
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}
