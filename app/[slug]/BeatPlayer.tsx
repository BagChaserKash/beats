'use client';

import { usePlayer, formatTime, type Track } from '@/lib/player';
import Waveform from '../Waveform';
import styles from '../store.module.css';

export default function BeatPlayer({ track, queue }: { track: Track; queue: Track[] }) {
  const p = usePlayer();
  const isCurrent = p.current?.id === track.id;
  const playing = isCurrent && p.playing;

  return (
    <div className={styles.beatPlayer}>
      <button
        type="button"
        className={styles.bigPlay}
        onClick={() => p.play(track, queue)}
        aria-label={playing ? 'Pause' : `Play ${track.title}`}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M7 5v14l12-7z" /></svg>
        )}
      </button>
      <div className={styles.beatWave}>
        <Waveform track={track} queue={queue} height={64} />
        <div className={styles.beatTimes}>
          <span>{isCurrent ? formatTime(p.time) : '0:00'}</span>
          <span>{isCurrent && p.duration ? formatTime(p.duration) : ''}</span>
        </div>
      </div>
    </div>
  );
}
