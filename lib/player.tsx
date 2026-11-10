'use client';

import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from '@/app/store.module.css';

export type Track = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  artworkUrl: string | null;
  previewUrl: string;
  waveform: number[] | null;
};

type PlayerState = {
  current: Track | null;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  play: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}

// ---------- favorites & recently played (saved in this browser) ----------

const listeners = new Set<() => void>();

function readList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage can be unavailable (private mode); favorites just won't persist.
  }
  listeners.forEach((fn) => fn());
}

export function useStoredList(key: string) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setList(readList(key));
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, [key]);
  return list;
}

export const FAVORITES_KEY = 'bck:favorites';
export const RECENT_KEY = 'bck:recent';

export function toggleFavorite(id: string) {
  const list = readList(FAVORITES_KEY);
  writeList(FAVORITES_KEY, list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]);
}

function pushRecent(id: string) {
  const list = readList(RECENT_KEY).filter((x) => x !== id);
  writeList(RECENT_KEY, [id, ...list].slice(0, 12));
}

// ---------- provider ----------

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);

  const current = index >= 0 ? queue[index] ?? null : null;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const startIndex = useCallback((list: Track[], i: number) => {
    const audio = audioRef.current;
    const track = list[i];
    if (!audio || !track) return;
    setQueue(list);
    setIndex(i);
    setTime(0);
    setDuration(0);
    audio.src = track.previewUrl;
    audio.play().catch(() => setPlaying(false));
    pushRecent(track.id);
  }, []);

  const play = useCallback(
    (track: Track, list?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (current?.id === track.id) {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
        return;
      }
      const q = list && list.length ? list : [track];
      const i = Math.max(0, q.findIndex((t) => t.id === track.id));
      startIndex(q, i);
    },
    [current, startIndex]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [current]);

  const next = useCallback(() => {
    if (index < queue.length - 1) startIndex(queue, index + 1);
  }, [index, queue, startIndex]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (index > 0) startIndex(queue, index - 1);
  }, [index, queue, startIndex]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(seconds)) audio.currentTime = seconds;
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, v));
    if (audio) audio.volume = clamped;
    setVolumeState(clamped);
  }, []);

  // Auto-advance to the next beat in the queue.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => next();
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [next]);

  const value = useMemo<PlayerState>(
    () => ({ current, playing, time, duration, volume, play, toggle, next, prev, seek, setVolume }),
    [current, playing, time, duration, volume, play, toggle, next, prev, seek, setVolume]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {current && <div className={styles.playerSpacer} aria-hidden="true" />}
      <PlayerBar />
    </PlayerContext.Provider>
  );
}

// ---------- the bar ----------

export function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function PlayerBar() {
  const p = useContext(PlayerContext);
  if (!p || !p.current) return null;
  const { current } = p;

  return (
    <div className={styles.playerBar} role="region" aria-label="Audio player">
      <div className={styles.playerTrack}>
        {current.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.artworkUrl} alt="" className={styles.playerArt} />
        ) : (
          <div className={styles.playerArtEmpty} aria-hidden="true" />
        )}
        <div className={styles.playerText}>
          <Link href={`/${current.slug}`} className={styles.playerTitle}>
            {current.title}
          </Link>
          <div className={styles.playerMeta}>{current.meta}</div>
        </div>
      </div>

      <div className={styles.playerControls}>
        <button type="button" className={styles.iconButton} onClick={p.prev} aria-label="Previous beat">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
        </button>
        <button type="button" className={styles.playButton} onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}>
          {p.playing ? (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M7 5v14l12-7z" /></svg>
          )}
        </button>
        <button type="button" className={styles.iconButton} onClick={p.next} aria-label="Next beat">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
        </button>
      </div>

      <div className={styles.playerSeek}>
        <span className={styles.playerTime}>{formatTime(p.time)}</span>
        <input
          type="range"
          className={styles.range}
          min={0}
          max={p.duration || 0}
          step={0.1}
          value={Math.min(p.time, p.duration || 0)}
          onChange={(e) => p.seek(Number(e.target.value))}
          aria-label="Seek"
        />
        <span className={styles.playerTime}>{formatTime(p.duration)}</span>
      </div>

      <div className={styles.playerVolume}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" /></svg>
        <input
          type="range"
          className={styles.range}
          min={0}
          max={1}
          step={0.01}
          value={p.volume}
          onChange={(e) => p.setVolume(Number(e.target.value))}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
