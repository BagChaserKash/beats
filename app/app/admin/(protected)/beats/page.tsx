import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDuration } from '@/lib/beats';
import styles from '../../admin.module.css';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  bpm: number | null;
  musical_key: string | null;
  duration_seconds: number | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Live',
  unavailable: 'Hidden',
  exclusive_sold: 'Sold exclusive',
};

export default async function BeatsListPage() {
  const { data } = await createAdminClient()
    .from('beats')
    .select('id, title, slug, status, bpm, musical_key, duration_seconds, created_at')
    .order('created_at', { ascending: false });
  const beats = (data ?? []) as Row[];

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.h1}>Beats</h1>
          <p className={styles.subtle}>{beats.length} in your library.</p>
        </div>
        <Link href="/admin/beats/new" className={styles.primaryLink}>+ New beat</Link>
      </div>

      {beats.length === 0 ? (
        <div className={styles.notice}>
          No beats yet. Click <strong>New beat</strong> to upload your first one.
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>BPM</th>
                <th>Key</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              {beats.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/admin/beats/${b.id}`} className={styles.rowLink}>{b.title}</Link>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${b.status}`] ?? ''}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td>{b.bpm ?? '—'}</td>
                  <td>{b.musical_key ?? '—'}</td>
                  <td>{formatDuration(b.duration_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
