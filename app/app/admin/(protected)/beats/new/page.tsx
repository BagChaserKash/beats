import Link from 'next/link';
import BeatFields from '../BeatFields';
import { createBeat } from '../actions';
import styles from '../../../admin.module.css';

export default async function NewBeatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={styles.main}>
      <Link href="/admin/beats" className={styles.back}>← Beats</Link>
      <h1 className={styles.h1}>New beat</h1>
      <p className={styles.subtle}>
        Start with the details. You’ll upload the audio, stems, and artwork on the next screen.
      </p>

      {error === 'title' && <p className={styles.errorBanner}>Give the beat a title.</p>}

      <form action={createBeat} className={styles.panel}>
        <BeatFields />
        <button className={styles.primary} type="submit">Create beat</button>
      </form>
    </main>
  );
}
