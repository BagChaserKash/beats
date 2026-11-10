import { createServerClient } from '@supabase/ssr';
import { supabaseUrl } from './url';
import { cookies } from 'next/headers';

// Supabase client for Server Components and Route Handlers.
// Uses the signed-in person's session from cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't write cookies; proxy.ts refreshes sessions.
          }
        },
      },
    }
  );
}
