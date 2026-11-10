import type { Metadata } from 'next';
import Link from 'next/link';
import { getCatalog, mediaUrl, formatPrice, type StoreBeat } from '@/lib/store';
import { formatDuration } from '@/lib/beats';
import BeatList, { type ListBeat } from './BeatList';
import styles from './store.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Beats | BAGCHASERKASH',
  description:
    'Hard trap and club beats from South Carolina producer BAGCHASERKASH. Preview free, then license MP3, WAV, trackouts, or exclusive rights directly.',
  alternates: { canonical: 'https://bagchaserkash.com/beats' },
};

type Search = {
  q?: string;
  genre?: string;
  mood?: string;
  key?: string;
  tag?: string;
  bpm_min?: string;
  bpm_max?: string;
  price_max?: string;
  sort?: string;
};

function toListBeat(b: StoreBeat): ListBeat {
  const meta = [b.bpm ? `${b.bpm} BPM` : null, b.musicalKey].filter(Boolean).join(' · ');
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    bpm: b.bpm,
    musicalKey: b.musicalKey,
    genre: b.genre,
    mood: b.mood,
    duration: formatDuration(b.durationSeconds),
    priceFrom: b.priceFrom != null ? formatPrice(b.priceFrom) : null,
    tags: b.tags,
    track: {
      id: b.id,
      slug: b.slug,
      title: b.title,
      meta,
      artworkUrl: b.hasArtwork ? mediaUrl(b.id, 'artwork') : null,
      previewUrl: mediaUrl(b.id, 'preview_mp3'),
      waveform: b.waveform,
    },
  };
}

function uniqueSorted(values: (string | null)[]) {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export default async function StorePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const catalog = await getCatalog();

  const q = (sp.q ?? '').trim().toLowerCase();
  const bpmMin = Number(sp.bpm_min) || 0;
  const bpmMax = Number(sp.bpm_max) || 0;
  const priceMax = Number(sp.price_max) || 0;
  const tag = (sp.tag ?? '').toLowerCase();

  let filtered = catalog.filter((b) => {
    if (q) {
      const hay = [b.title, b.genre, b.mood, b.musicalKey, ...b.tags].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (sp.genre && b.genre !== sp.genre) return false;
    if (sp.mood && b.mood !== sp.mood) return false;
    if (sp.key && b.musicalKey !== sp.key) return false;
    if (tag && !b.tags.includes(tag)) return false;
    if (bpmMin && (!b.bpm || b.bpm < bpmMin)) return false;
    if (bpmMax && (!b.bpm || b.bpm > bpmMax)) return false;
    if (priceMax && (b.priceFrom == null || b.priceFrom > priceMax * 100)) return false;
    return true;
  });

  const sort = sp.sort ?? 'newest';
  filtered = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'bpm_asc':
        return (a.bpm ?? 999) - (b.bpm ?? 999);
      case 'bpm_desc':
        return (b.bpm ?? 0) - (a.bpm ?? 0);
      case 'price_asc':
        return (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  const genres = uniqueSorted(catalog.map((b) => b.genre));
  const moods = uniqueSorted(catalog.map((b) => b.mood));
  const keys = uniqueSorted(catalog.map((b) => b.musicalKey));
  const hasFilters = Boolean(q || sp.genre || sp.mood || sp.key || tag || bpmMin || bpmMax || priceMax);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="https://bagchaserkash.com" className={styles.brand}>
          BAGCHASER<span className={styles.gold}>KASH</span>
        </a>
        <span className={styles.headerTag}>Beats</span>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Beats you can actually rap on.</h1>
        <p className={styles.heroSub}>
          Hard trap and club instrumentals produced in South Carolina. Preview free, license direct.
        </p>
      </section>

      <form className={styles.filters} method="get" role="search">
        <input
          className={`${styles.input} ${styles.search}`}
          type="search"
          name="q"
          placeholder="Search beats, moods, tags…"
          defaultValue={sp.q ?? ''}
          aria-label="Search beats"
        />
        <select className={styles.input} name="genre" defaultValue={sp.genre ?? ''} aria-label="Genre">
          <option value="">All genres</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={styles.input} name="mood" defaultValue={sp.mood ?? ''} aria-label="Mood">
          <option value="">All moods</option>
          {moods.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={styles.input} name="key" defaultValue={sp.key ?? ''} aria-label="Key">
          <option value="">Any key</option>
          {keys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <input className={styles.input} type="number" name="bpm_min" placeholder="Min BPM" min={40} max={300} defaultValue={sp.bpm_min ?? ''} aria-label="Minimum BPM" />
        <input className={styles.input} type="number" name="bpm_max" placeholder="Max BPM" min={40} max={300} defaultValue={sp.bpm_max ?? ''} aria-label="Maximum BPM" />
        <input className={styles.input} type="number" name="price_max" placeholder="Max price $" min={0} defaultValue={sp.price_max ?? ''} aria-label="Maximum starting price in dollars" />
        <select className={styles.input} name="sort" defaultValue={sort} aria-label="Sort by">
          <option value="newest">Newest</option>
          <option value="bpm_asc">BPM: low to high</option>
          <option value="bpm_desc">BPM: high to low</option>
          <option value="price_asc">Price: low to high</option>
          <option value="title">Title A–Z</option>
        </select>
        {tag && <input type="hidden" name="tag" value={tag} />}
        <button className={styles.filterButton} type="submit">Apply</button>
        {hasFilters && <Link href="/" className={styles.clear}>Clear</Link>}
      </form>

      {tag && (
        <p className={styles.activeTag}>
          Tag: <strong>#{tag}</strong> <Link href="/" className={styles.clear}>Remove</Link>
        </p>
      )}

      {catalog.length === 0 ? (
        <p className={styles.empty}>New beats are dropping soon. Check back shortly.</p>
      ) : (
        <BeatList beats={filtered.map(toListBeat)} allBeats={catalog.map(toListBeat)} />
      )}

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} BAGCHASERKASH. All beats are original productions.</p>
        <p>Previews are tagged. Licensed files are delivered after purchase.</p>
      </footer>
    </div>
  );
}
