import { createClient } from '@supabase/supabase-js';

// SERVER ONLY. Full database access using the secret key.
// Never import this from a file marked 'use client'.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error('SUPABASE_SECRET_KEY is not set in Vercel environment variables.');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
