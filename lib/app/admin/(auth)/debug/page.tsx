'use client';

import { supabaseUrl } from '@/lib/supabase/url';

export default function DebugPage() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '(missing)';

  return (
    <main style={{ padding: 24, fontFamily: 'monospace', lineHeight: 1.8 }}>
      <p>URL in Vercel: [{process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(missing)'}]</p>
      <p>URL the store uses: [{supabaseUrl()}]</p>
      <p>Key starts with: [{key.slice(0, 24)}]</p>
      <p>Key length: {key.length}</p>
    </main>
  );
}
