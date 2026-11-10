'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  usePlayer,
  useStoredList,
  toggleFavorite,
  FAVORITES_KEY,
  RECENT_KEY,
  type Track,
} from '@/lib/player';
import styles from './store.module.css';

export type ListBeat = {
  id: string;
  slug: string;
  title: string;
  bpm: number | null;
  musicalKey: string | null;
  genre: string | null;
  mood: string | null;
  duration: string;
  priceFrom: string | null;
  tags: string[];
  track: Track;
};

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M7 5v14l12-7z" /></svg>
  );
}

function Heart({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
      />
    </svg>
  );
}

export default function BeatList({ beats, allBeats }: { beats: ListBeat[]; allBeats: ListBeat[] }) {
  const p = usePlayer();
  const favorites = useStoredList(FAVORITES_KEY);
  const recent = useStoredList(RECENT_KEY);
  const [favsOnly, setFavsOnly] = useState(false);

  const shown = useMemo(
    () => (favsOnly ? beats.filter((b) => favorites.includes(b.id)) : beats),
    [beats, favorites, favsOnly]
  );
  const queue = useMemo(() => shown.map((b) => b.track), [shown]);

  const recentBeats = useMemo(() => {
    const byId = new Map(allBeats.map((b) => [b.id, b]));
    return recent.map((id) => byId.get(id)).filter((b): b is ListBeat => Boolean(b)).slice(0, 6);
  }, [recent, allBeats]);

  return (
    <>
      {recentBeats.length > 0 && (
        <section className={styles.recent} aria-label="Recently played">
          <h2 className={styles.sectionTitle}>Recently played</h2>
          <div className={styles.recentRow}>
            {recentBeats.map((b) => (
              <button
                key={b.id}
                type="button"
                className={styles.recentCard}
                onClick={() => p.play(b.track, recentBeats.map((r) => r.track))}
              >
                {b.track.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.track.artworkUrl} alt="" className={styles.recentArt} />
                ) : (
                  <div className={styles.recentArtEmpty} aria-hidden="true" />
                )}
                <span className={styles.recentTitle}>{b.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className={styles.listHeader}>
        <span className={styles.count}>
          {shown.length} {shown.length === 1 ? 'beat' : 'beats'}
        </span>
        <button
          type="button"
          className={`${styles.chip} ${favsOnly ? styles.chipOn : ''}`}
          onClick={() => setFavsOnly((v) => !v)}
          aria-pressed={favsOnly}
        >
          <Heart on={favsOnly} /> Favorites
        </button>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>
          {favsOnly ? 'No favorites yet. Tap the heart on any beat to save it here.' : 'No beats match those filters.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((b) => {
            const isCurrent = p.current?.id === b.id;
            const isFav = favorites.includes(b.id);
            return (
              <li key={b.id} className={`${styles.row} ${isCurrent ? styles.rowActive : ''}`}>
                <button
                  type="button"
                  className={styles.rowArtButton}
                  onClick={() => p.play(b.track, queue)}
                  aria-label={isCurrent && p.playing ? `Pause ${b.title}` : `Play ${b.title}`}
                >
                  {b.track.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.track.artworkUrl} alt="" className={styles.rowArt} loading="lazy" />
                  ) : (
                    <div className={styles.rowArtEmpty} aria-hidden="true" />
                  )}
                  <span className={styles.rowPlay}>
                    <PlayIcon playing={isCurrent && p.playing} />
                  </span>
                </button>

                <div className={styles.rowInfo}>
                  <Link href={`/${b.slug}`} className={styles.rowTitle}>
                    {b.title}
                  </Link>
                  <div className={styles.rowMeta}>
                    {[b.bpm ? `${b.bpm} BPM` : null, b.musicalKey, b.genre, b.mood, b.duration]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {b.tags.length > 0 && (
                    <div className={styles.rowTags}>
                      {b.tags.slice(0, 4).map((t) => (
                        <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className={styles.tag}>
                          #{t}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${isFav ? styles.favOn : ''}`}
                    onClick={() => toggleFavorite(b.id)}
                    aria-label={isFav ? `Remove ${b.title} from favorites` : `Add ${b.title} to favorites`}
                    aria-pressed={isFav}
                  >
                    <Heart on={isFav} />
                  </button>
                  <Link href={`/${b.slug}`} className={styles.priceButton}>
                    {b.priceFrom ? `From ${b.priceFrom}` : 'View'}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
