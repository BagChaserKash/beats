import { createAdminClient } from '@/lib/supabase/admin';
import { signedGetUrl } from '@/lib/r2';
import TagUploader from './TagUploader';
import { savePreviewOptions, sendTestEmailAction } from './actions';
import styles from '../../admin.module.css';

export const dynamic = 'force-dynamic';

type Tag = { bucket: string; key: string; name: string };
type Options = { interval_seconds: number; tag_gain: number; first_tag_at: number };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; test?: string }>;
}) {
  const { saved, test } = await searchParams;
  const { data } = await createAdminClient()
    .from('settings')
    .select('key, value')
    .in('key', ['producer_tag', 'preview_options']);
  const byKey = new Map(((data ?? []) as { key: string; value: unknown }[]).map((r) => [r.key, r.value]));

  const tag = byKey.get('producer_tag') as Tag | undefined;
  const tagUrl = tag ? await signedGetUrl(tag.bucket, tag.key, 3600).catch(() => null) : null;
  const options: Options = {
    interval_seconds: 30,
    tag_gain: 1,
    first_tag_at: 2,
    ...((byKey.get('preview_options') as Partial<Options> | undefined) ?? {}),
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.h1}>Settings</h1>
      <p className={styles.subtle}>How your tagged previews are made.</p>

      {saved && <p className={styles.savedBanner}>Preview settings saved. Use “Remake” on a beat to apply them to it.</p>}

      <section className={styles.panel}>
        <h2 className={styles.h2}>Producer tag</h2>
        <TagUploader currentName={tag?.name ?? null} currentUrl={tagUrl} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>Preview settings</h2>
        <form action={savePreviewOptions}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Tag repeats every (seconds)</span>
              <input className={styles.input} name="interval_seconds" type="number" min={10} max={120} defaultValue={options.interval_seconds} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>First tag at (seconds)</span>
              <input className={styles.input} name="first_tag_at" type="number" min={0} max={30} step="0.5" defaultValue={options.first_tag_at} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Tag volume (%)</span>
              <input className={styles.input} name="tag_volume" type="number" min={20} max={200} defaultValue={Math.round(options.tag_gain * 100)} />
              <span className={styles.help}>100% plays your tag exactly as uploaded.</span>
            </label>
          </div>
          <button className={styles.primary} type="submit">Save preview settings</button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>Email delivery test</h2>
        <p className={styles.help}>
          Send a test to check whether an inbox (like iCloud) accepts your emails. Then check the result in Resend.
        </p>
        {test === 'plain' && <p className={styles.savedBanner}>Plain-text test sent. Check Resend to see if it was delivered or bounced.</p>}
        {test === 'sample' && <p className={styles.savedBanner}>Sample receipt sent. Check Resend to see if it was delivered or bounced.</p>}
        {test === 'failed' && <p className={styles.errorBanner}>Resend refused to send it. Check your Resend dashboard for details.</p>}
        {test === 'bad-email' && <p className={styles.errorBanner}>Enter a valid email address.</p>}
        <form action={sendTestEmailAction}>
          <label className={styles.field}>
            <span className={styles.label}>Send to</span>
            <input className={styles.input} name="to" type="email" required placeholder="someone@icloud.com" />
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className={styles.primary} type="submit" name="mode" value="plain">
              Send plain-text test
            </button>
            <button className={styles.primary} type="submit" name="mode" value="sample">
              Send sample receipt
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
