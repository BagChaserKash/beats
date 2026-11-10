import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Call at the top of every admin server action. Confirms the person is
// signed in, passed two-step verification, and is on the admin list.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('Two-step verification required.');

  const db = createAdminClient();
  const { data: adminRow } = await db
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminRow) throw new Error('Not an admin.');

  return { user, db };
}

export type AdminDb = ReturnType<typeof createAdminClient>;
