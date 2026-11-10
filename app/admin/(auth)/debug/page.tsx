'use client';

export default function DebugPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(missing)';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '(missing)';

  return (
    <main style={{ padding: 24, fontFamily: 'monospace', lineHeight: 1.8 }}>
      <p>URL: [{url}]</p>
      <p>Key starts with: [{key.slice(0, 24)}]</p>
      <p>Key length: {key.length}</p>
    </main>
  );
}
