'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// While payment is confirming, refresh every few seconds (up to 2 minutes).
export default function Refresher() {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const id = window.setInterval(() => {
      count += 1;
      if (count > 30) window.clearInterval(id);
      else router.refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [router]);
  return null;
}
