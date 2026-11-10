'use client';

import { usePlayer, type Track } from '@/lib/player';
import styles from './store.module.css';

// Clickable waveform. Shows playback progress when this beat is playing.
export default function Waveform({ track, queue, height = 56 }: { track: Track; queue?: Track[]; height?: number }) {
  const p = usePlayer();
  const peaks = track.waveform && track.waveform.length ? track.waveform : Array.from({ length: 120 }, () => 0.35);
  const isCurrent = p.current?.id === track.id;
  const progress = isCurrent && p.duration ? p.time / p.duration : 0;

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (isCurrent && p.duration) {
      p.seek(ratio * p.duration);
    } else {
      p.play(track, queue);
    }
  }

  const barWidth = 100 / peaks.length;

  return (
    <button
      type="button"
      className={styles.waveform}
      style={{ height }}
      onClick={handleClick}
      aria-label={isCurrent ? 'Seek in this beat' : `Play ${track.title}`}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
        {peaks.map((peak, i) => {
          const h = Math.max(4, peak * 100);
          const played = (i + 0.5) / peaks.length <= progress;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.15}
              y={(100 - h) / 2}
              width={barWidth * 0.7}
              height={h}
              className={played ? styles.wavePlayed : styles.wave}
            />
          );
        })}
      </svg>
    </button>
  );
}
