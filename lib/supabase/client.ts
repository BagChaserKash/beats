import { createBrowserClient } from '@supabase/ssr';

// Supabase client for the browser. Only uses the publishable key,
// which is safe to expose; data is protected by Row Level Security.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
