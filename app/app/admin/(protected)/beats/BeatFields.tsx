import { MUSICAL_KEYS } from '@/lib/beats';
import styles from '../../admin.module.css';

export type BeatDefaults = {
  title?: string;
  slug?: string;
  bpm?: number | null;
  musical_key?: string | null;
  genre?: string | null;
  mood?: string | null;
  produced_on?: string | null;
  description?: string | null;
  sales_mode?: string;
  tags?: string;
};

export default function BeatFields({ beat = {}, showSlug = false }: { beat?: BeatDefaults; showSlug?: boolean }) {
  return (
    <div className={styles.formGrid}>
      <label className={`${styles.field} ${styles.span2}`}>
        <span className={styles.label}>Title *</span>
        <input className={styles.input} name="title" required maxLength={120} defaultValue={beat.title ?? ''} />
      </label>

      {showSlug && (
        <label className={`${styles.field} ${styles.span2}`}>
          <span className={styles.label}>
            Page address: bagchaserkash.com/beats/<strong>{beat.slug}</strong>
          </span>
          <input className={styles.input} name="slug" maxLength={80} defaultValue={beat.slug ?? ''} />
          <span className={styles.help}>
            Change this only before you share the link anywhere, since old links stop working.
          </span>
        </label>
      )}

      <label className={styles.field}>
        <span className={styles.label}>BPM</span>
        <input className={styles.input} name="bpm" type="number" min={40} max={300} inputMode="numeric" defaultValue={beat.bpm ?? ''} />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Key</span>
        <select className={styles.input} name="musical_key" defaultValue={beat.musical_key ?? ''}>
          <option value="">—</option>
          {MUSICAL_KEYS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Genre</span>
        <input className={styles.input} name="genre" maxLength={60} placeholder="Trap, Drill, R&B…" defaultValue={beat.genre ?? ''} />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Mood</span>
        <input className={styles.input} name="mood" maxLength={60} placeholder="Dark, Hype, Smooth…" defaultValue={beat.mood ?? ''} />
      </label>

      <label className={`${styles.field} ${styles.span2}`}>
        <span className={styles.label}>Tags</span>
        <input className={styles.input} name="tags" maxLength={400} placeholder="hard, 808, melodic" defaultValue={beat.tags ?? ''} />
        <span className={styles.help}>Separate with commas.</span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Production date</span>
        <input className={styles.input} name="produced_on" type="date" defaultValue={beat.produced_on ?? ''} />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Who can buy</span>
        <select className={styles.input} name="sales_mode" defaultValue={beat.sales_mode ?? 'public'}>
          <option value="public">Anyone (public)</option>
          <option value="verified">Verified artists only</option>
          <option value="approval">By request only</option>
        </select>
      </label>

      <label className={`${styles.field} ${styles.span2}`}>
        <span className={styles.label}>Description (optional)</span>
        <textarea className={`${styles.input} ${styles.textarea}`} name="description" maxLength={2000} defaultValue={beat.description ?? ''} />
      </label>
    </div>
  );
}
