import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBeatBySlug, getCatalog, mediaUrl, formatPrice, type StoreBeat } from '@/lib/store';
import { formatDuration } from '@/lib/beats';
import type { Track } from '@/lib/player';
import BeatPlayer from './BeatPlayer';
import styles from '../store.module.css';

export const dynamic = 'force-dynamic';

const DELIVERS: Record<string, string> = {
  master_mp3: 'Untagged MP3',
  master_wav: 'Untagged WAV',
  trackout_zip: 'Trackout stems',
};

function trackFor(b: StoreBeat): Track {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    meta: [b.bpm ? `${b.bpm} BPM` : null, b.musicalKey].filter(Boolean).join(' · '),
    artworkUrl: b.hasArtwork ? mediaUrl(b.id, 'artwork') : null,
    previewUrl: mediaUrl(b.id, 'preview_mp3'),
    waveform: b.waveform,
  };
}

function isoDuration(seconds: number | null) {
  if (!seconds) return undefined;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `PT${m}M${s}S`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const beat = await getBeatBySlug(slug);
  if (!beat) return { title: 'Beat not found | BAGCHASERKASH' };

  const facts = [beat.bpm ? `${beat.bpm} BPM` : null, beat.musicalKey, beat.genre].filter(Boolean).join(', ');
  const title = `${beat.title}${facts ? ` (${facts})` : ''} | BAGCHASERKASH Beats`;
  const description = `${beat.title} by BAGCHASERKASH${facts ? `: ${facts}` : ''}. Preview free and license MP3, WAV, trackouts, or exclusive rights directly from the producer.`;
  const url = `https://bagchaserkash.com/beats/${beat.slug}`;
  const image = beat.hasArtwork ? `https://bagchaserkash.com${mediaUrl(beat.id, 'artwork')}` : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'music.song', images: image ? [image] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : undefined },
  };
}

export default async function BeatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const beat = await getBeatBySlug(slug);
  if (!beat) notFound();

  const catalog = await getCatalog();
  const more = catalog
    .filter((b) => b.id !== beat.id)
    .sort((a, b) => Number(b.genre === beat.genre) - Number(a.genre === beat.genre))
    .slice(0, 4);

  const track = trackFor(beat);
  const queue = [track, ...more.map(trackFor)];
  const visiblePrices = beat.licenses.map((l) => l.priceCents).filter((p): p is number => p != null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: beat.title,
    url: `https://bagchaserkash.com/beats/${beat.slug}`,
    byArtist: { '@type': 'MusicGroup', name: 'BAGCHASERKASH' },
    duration: isoDuration(beat.durationSeconds),
    genre: beat.genre ?? undefined,
    keywords: beat.tags.join(', ') || undefined,
    image: beat.hasArtwork ? `https://bagchaserkash.com${mediaUrl(beat.id, 'artwork')}` : undefined,
    offers: visiblePrices.length
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: (Math.min(...visiblePrices) / 100).toFixed(2),
          highPrice: (Math.max(...visiblePrices) / 100).toFixed(2),
          offerCount: visiblePrices.length,
        }
      : undefined,
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <header className={styles.header}>
        <a href="https://bagchaserkash.com" className={styles.brand}>
          BAGCHASER<span className={styles.gold}>KASH</span>
        </a>
        <Link href="/" className={styles.headerTag}>← All beats</Link>
      </header>

      <section className={styles.beatHero}>
        {beat.hasArtwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(beat.id, 'artwork')} alt={`${beat.title} cover art`} className={styles.beatArt} />
        ) : (
          <div className={styles.beatArtEmpty} aria-hidden="true" />
        )}
        <div className={styles.beatHeroText}>
          <p className={styles.eyebrow}>Prod. BAGCHASERKASH</p>
          <h1 className={styles.beatTitle}>{beat.title}</h1>
          <dl className={styles.facts}>
            {beat.bpm && (<div><dt>BPM</dt><dd>{beat.bpm}</dd></div>)}
            {beat.musicalKey && (<div><dt>Key</dt><dd>{beat.musicalKey}</dd></div>)}
            {beat.genre && (<div><dt>Genre</dt><dd>{beat.genre}</dd></div>)}
            {beat.mood && (<div><dt>Mood</dt><dd>{beat.mood}</dd></div>)}
            <div><dt>Length</dt><dd>{formatDuration(beat.durationSeconds)}</dd></div>
            {beat.producedOn && (
              <div>
                <dt>Produced</dt>
                <dd>{new Date(`${beat.producedOn}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</dd>
              </div>
            )}
          </dl>
          {beat.tags.length > 0 && (
            <div className={styles.rowTags}>
              {beat.tags.map((t) => (
                <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className={styles.tag}>#{t}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <BeatPlayer track={track} queue={queue} />

      <section aria-labelledby="licenses">
        <h2 id="licenses" className={styles.sectionTitle}>Licenses</h2>
        <div className={styles.licenses}>
          {beat.licenses.map((l) => (
            <div key={l.tierId} className={`${styles.licenseCard} ${l.isExclusive ? styles.licenseExclusive : ''}`}>
              <div className={styles.licenseName}>{l.name}</div>
              <div className={styles.licensePrice}>
                {l.priceCents != null ? formatPrice(l.priceCents) : 'Inquire'}
              </div>
              <ul className={styles.licenseList}>
                {l.delivers.map((d) => (
                  <li key={d}>{DELIVERS[d] ?? d}</li>
                ))}
                <li>{l.isExclusive ? 'Exclusive rights, by agreement' : 'Non-exclusive license'}</li>
              </ul>
              <button type="button" className={styles.licenseButton} disabled>
                {l.isExclusive ? 'Offers open soon' : 'Checkout opens soon'}
              </button>
            </div>
          ))}
        </div>
        <p className={styles.note}>
          Full license terms will be shown before checkout. Previews include a producer tag; licensed files are untagged.
        </p>
      </section>

      {more.length > 0 && (
        <section aria-labelledby="more">
          <h2 id="more" className={styles.sectionTitle}>More beats</h2>
          <ul className={styles.moreGrid}>
            {more.map((b) => (
              <li key={b.id}>
                <Link href={`/${b.slug}`} className={styles.moreCard}>
                  {b.hasArtwork ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(b.id, 'artwork')} alt="" className={styles.moreArt} loading="lazy" />
                  ) : (
                    <div className={styles.moreArtEmpty} aria-hidden="true" />
                  )}
                  <span className={styles.moreTitle}>{b.title}</span>
                  <span className={styles.moreMeta}>
                    {[b.bpm ? `${b.bpm} BPM` : null, b.musicalKey].filter(Boolean).join(' · ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} BAGCHASERKASH. All beats are original productions.</p>
      </footer>
    </div>
  );
}
