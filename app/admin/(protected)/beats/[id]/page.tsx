import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { signedGetUrl } from '@/lib/r2';
import { FILE_SLOTS, formatDuration, money, type FileKind } from '@/lib/beats';
import BeatFields from '../BeatFields';
import FileSlot from './FileSlot';
import PreviewMaker from './PreviewMaker';
import CopyField from './CopyField';
import YouTubeVideoMaker from './YouTubeVideoMaker';
import { buildYouTubeKit } from '@/lib/youtube';
import { updateBeat, updateLicenses, setBeatStatus } from '../actions';
import styles from '../../../admin.module.css';

export const dynamic = 'force-dynamic';

const SAVED: Record<string, string> = {
  created: 'Beat created. Now upload the files.',
  details: 'Details saved.',
  licenses: 'Licenses saved.',
  published: 'Published. It will appear in the storefront once that’s built.',
  draft: 'Moved back to draft.',
  unavailable: 'Hidden from the store.',
};

const ERRORS: Record<string, string> = {
  title: 'Give the beat a title.',
  'needs-audio': 'Upload at least the untagged MP3 or WAV before publishing.',
  'needs-preview': 'Make the tagged preview before publishing (it happens automatically after an MP3/WAV upload once your producer tag is set).',
  exclusive: 'This beat was sold exclusively, so its status can’t be changed.',
};

type FileRow = { kind: FileKind; bucket: string; object_key: string; size_bytes: number | null };
type TierRow = { id: string; name: string; default_price_cents: number; price_visible: boolean; sort_order: number };
type LicenseRow = { tier_id: string; available: boolean; price_cents_override: number | null };

export default async function EditBeatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const db = createAdminClient();

  const { data: beat } = await db.from('beats').select('*').eq('id', id).maybeSingle();
  if (!beat) notFound();

  const [filesRes, tagsRes, tiersRes, licensesRes] = await Promise.all([
    db.from('beat_files').select('kind, bucket, object_key, size_bytes').eq('beat_id', id),
    db.from('beat_tags').select('tags(name)').eq('beat_id', id),
    db.from('license_tiers').select('id, name, default_price_cents, price_visible, sort_order').eq('active', true).order('sort_order'),
    db.from('beat_licenses').select('tier_id, available, price_cents_override').eq('beat_id', id),
  ]);

  const files = (filesRes.data ?? []) as FileRow[];
  const fileByKind = new Map(files.map((f) => [f.kind, f]));
  const tags = ((tagsRes.data ?? []) as unknown as { tags: { name: string } | { name: string }[] | null }[])
    .flatMap((r) => (Array.isArray(r.tags) ? r.tags : r.tags ? [r.tags] : []))
    .map((t) => t.name)
    .join(', ');
  const tiers = (tiersRes.data ?? []) as TierRow[];
  const licenseByTier = new Map(((licensesRes.data ?? []) as LicenseRow[]).map((l) => [l.tier_id, l]));

  const art = fileByKind.get('artwork');
  const artUrl = art ? await signedGetUrl(art.bucket, art.object_key, 3600).catch(() => null) : null;
  const preview = fileByKind.get('preview_mp3');
  const previewUrl = preview
    ? await signedGetUrl(preview.bucket, preview.object_key, 3600).catch(() => null)
    : null;
  const hasMaster = fileByKind.has('master_mp3') || fileByKind.has('master_wav');

  const ytBg = fileByKind.get('youtube_bg');
  const ytBgUrl = ytBg ? await signedGetUrl(ytBg.bucket, ytBg.object_key, 3600).catch(() => null) : null;
  const taggedDownloadUrl = preview
    ? await signedGetUrl(
        preview.bucket,
        preview.object_key,
        3600,
        `${String(beat.title).replace(/[^a-zA-Z0-9 ._()-]+/g, '').trim() || 'Beat'} (Tagged) - BAGCHASERKASH.mp3`
      ).catch(() => null)
    : null;

  const kit = buildYouTubeKit({
    title: beat.title,
    slug: beat.slug,
    bpm: beat.bpm,
    musicalKey: beat.musical_key,
    genre: beat.genre,
    mood: beat.mood,
    tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    prices: tiers
      .filter((t) => licenseByTier.get(t.id)?.available ?? true)
      .map((t) => {
        const l = licenseByTier.get(t.id);
        return {
          name: t.name,
          priceCents: t.price_visible ? l?.price_cents_override ?? t.default_price_cents : null,
        };
      }),
  });
  const videoMeta = [beat.bpm ? `${beat.bpm} BPM` : null, beat.musical_key, 'Prod. BAGCHASERKASH'].filter(Boolean).join('  ·  ');

  const isLive = beat.status === 'published';
  const isSold = beat.status === 'exclusive_sold';

  return (
    <main className={styles.main}>
      <Link href="/admin/beats" className={styles.back}>← Beats</Link>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.h1}>{beat.title}</h1>
          <p className={styles.subtle}>
            {isLive ? 'Live' : isSold ? 'Sold exclusive' : beat.status === 'unavailable' ? 'Hidden' : 'Draft'}
            {' · '}
            {beat.bpm ? `${beat.bpm} BPM` : 'No BPM'}
            {' · '}
            {beat.musical_key ?? 'No key'}
            {' · '}
            {formatDuration(beat.duration_seconds)}
          </p>
        </div>
        {!isSold && (
          <form action={setBeatStatus}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={isLive ? 'draft' : 'published'} />
            <button className={isLive ? styles.ghostButton : styles.primary} type="submit">
              {isLive ? 'Unpublish' : 'Publish'}
            </button>
          </form>
        )}
      </div>

      {saved && SAVED[saved] && <p className={styles.savedBanner}>{SAVED[saved]}</p>}
      {error && ERRORS[error] && <p className={styles.errorBanner}>{ERRORS[error]}</p>}

      <section className={styles.panel}>
        <h2 className={styles.h2}>Files</h2>
        <p className={styles.help}>
          Masters and stems are private and only delivered to buyers after payment.
        </p>
        {FILE_SLOTS.map((slot) => {
          const f = fileByKind.get(slot.kind);
          return (
            <FileSlot
              key={slot.kind}
              beatId={id}
              kind={slot.kind}
              label={slot.label}
              hint={slot.hint}
              accept={slot.accept}
              currentName={f ? f.object_key.split('/').pop()!.replace(/^\d+-/, '') : null}
              currentSize={f?.size_bytes ?? null}
              previewUrl={slot.kind === 'artwork' ? artUrl : null}
            />
          );
        })}
        <PreviewMaker beatId={id} hasMaster={hasMaster} previewUrl={previewUrl} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>YouTube</h2>
        <p className={styles.help}>
          Upload a background picture, make the video, then copy the title, description, and tags into YouTube.
          {!isLive && ' Publish the beat first so the store link in the description works.'}
        </p>
        <FileSlot
          beatId={id}
          kind="youtube_bg"
          label="Background picture"
          hint="JPG, PNG, or WebP. Landscape, ideally 1920×1080. If you skip this, your cover art is used."
          accept=".jpg,.jpeg,.png,.webp"
          currentName={ytBg ? ytBg.object_key.split('/').pop()!.replace(/^\d+-/, '') : null}
          currentSize={ytBg?.size_bytes ?? null}
          previewUrl={ytBgUrl}
        />
        <YouTubeVideoMaker
          title={beat.title}
          meta={videoMeta}
          backgroundUrl={ytBgUrl ?? artUrl}
          previewUrl={previewUrl}
        />
        {taggedDownloadUrl && (
          <p className={styles.help} style={{ marginTop: 14 }}>
            Prefer to edit the video yourself? <a href={taggedDownloadUrl}>Download the tagged MP3</a>.
          </p>
        )}
        <CopyField label="YouTube title" value={kit.title} />
        <CopyField label="YouTube description" value={kit.description} multiline />
        <CopyField label="YouTube tags" value={kit.tags} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>Licenses for this beat</h2>
        <form action={updateLicenses}>
          <input type="hidden" name="id" value={id} />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Tier</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => {
                  const l = licenseByTier.get(t.id);
                  return (
                    <tr key={t.id}>
                      <td>
                        <input
                          type="checkbox"
                          name={`available_${t.id}`}
                          defaultChecked={l ? l.available : true}
                          aria-label={`Offer ${t.name}`}
                          className={styles.checkbox}
                        />
                      </td>
                      <td>{t.name}</td>
                      <td>
                        {t.price_visible ? (
                          <input
                            className={`${styles.input} ${styles.priceInput}`}
                            name={`price_${t.id}`}
                            inputMode="decimal"
                            placeholder={money(t.default_price_cents)}
                            defaultValue={
                              l?.price_cents_override != null ? String(l.price_cents_override / 100) : ''
                            }
                            aria-label={`${t.name} price in dollars`}
                          />
                        ) : (
                          <span className={styles.help}>Hidden, set per deal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={styles.help}>Leave a price blank to use the standard price shown.</p>
          <button className={styles.primary} type="submit">Save licenses</button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>Details</h2>
        <form action={updateBeat}>
          <input type="hidden" name="id" value={id} />
          <BeatFields
            showSlug
            beat={{
              title: beat.title,
              slug: beat.slug,
              bpm: beat.bpm,
              musical_key: beat.musical_key,
              genre: beat.genre,
              mood: beat.mood,
              produced_on: beat.produced_on,
              description: beat.description,
              sales_mode: beat.sales_mode,
              tags,
            }}
          />
          <button className={styles.primary} type="submit">Save details</button>
        </form>
      </section>
    </main>
  );
}
