'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../../admin.module.css';

type Mode = 'loading' | 'enroll' | 'verify';

type TotpDetails = { qr_code: string; secret: string };

export default function AdminMfaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('loading');
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/admin/login');
        return;
      }

      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError || !data) {
        setError('Couldn’t load two-step verification. Refresh the page to try again.');
        return;
      }

      const verified = data.all.find(
        (f) => f.factor_type === 'totp' && f.status === 'verified'
      );
      if (verified) {
        setFactorId(verified.id);
        setMode('verify');
        return;
      }

      // Clear any half-finished setup before starting a new one.
      for (const f of data.all) {
        if (f.factor_type === 'totp' && f.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const enrolled = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'BAGCHASERKASH admin',
      });
      if (enrolled.error || !enrolled.data) {
        setError('Couldn’t start two-step setup. Refresh the page to try again.');
        return;
      }

      const totp = (enrolled.data as unknown as { totp: TotpDetails }).totp;
      setFactorId(enrolled.data.id);
      setQr(totp.qr_code);
      setSecret(totp.secret);
      setMode('enroll');
    })();
  }, [router]);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code: code.replace(/\s/g, ''),
    });

    if (verifyError) {
      setError('That code didn’t work. Codes change every 30 seconds, so enter the newest one.');
      setBusy(false);
      return;
    }

    router.replace('/admin');
    router.refresh();
  }

  return (
    <main className={styles.authWrap}>
      <div className={styles.authCard}>
        <p className={styles.mark}>
          BAGCHASER<span className={styles.markGold}>KASH</span>
        </p>

        {mode === 'loading' && !error && <p className={styles.subtle}>Loading…</p>}

        {mode === 'enroll' && (
          <>
            <p className={styles.subtle}>
              Set up two-step verification. Scan this code with an authenticator app
              (Google Authenticator, Authy, or 1Password), then enter the 6-digit code it shows.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.qr} src={qr} alt="QR code for your authenticator app" />
            <p className={styles.secret}>Can’t scan? Enter this key manually: {secret}</p>
          </>
        )}

        {mode === 'verify' && (
          <p className={styles.subtle}>Enter the 6-digit code from your authenticator app.</p>
        )}

        {(mode === 'enroll' || mode === 'verify') && (
          <form onSubmit={handleVerify}>
            <label className={styles.field}>
              <span className={styles.label}>6-digit code</span>
              <input
                className={`${styles.input} ${styles.codeInput}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <button className={styles.button} type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Verify'}
            </button>
          </form>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </main>
  );
}
