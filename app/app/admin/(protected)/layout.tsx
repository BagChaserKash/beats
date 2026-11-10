import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SignOutButton from '../SignOutButton';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: adminRow } = await createAdminClient()
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    return (
      <main className={styles.authWrap}>
        <div className={styles.authCard}>
          <p className={styles.mark}>Not authorized</p>
          <p className={styles.subtle}>
            This account isn’t on the admin list. Add it in Supabase, then sign in again.
          </p>
          <SignOutButton />
        </div>
      </main>
    );
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') redirect('/admin/mfa');

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.topbarMark}>BAGCHASERKASH Admin</span>
          <nav className={styles.nav} aria-label="Admin">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/beats">Beats</Link>
            <Link href="/admin/settings">Settings</Link>
          </nav>
        </div>
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
