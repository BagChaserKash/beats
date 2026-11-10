'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, type AdminDb } from '@/lib/auth';
import { mastersBucket, previewsBucket, signedPutUrl, signedGetUrl, deleteObject } from '@/lib/r2';
import { MUSICAL_KEYS, type FileKind } from '@/lib/beats';

// ---------- helpers ----------

function text(formData: FormData, name: string) {
  const v = formData.get(name);
  return typeof v === 'string' ? v.trim() : '';
}

function intOrNull(value: string) {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'beat';
}

const RESERVED_SLUGS = new Set(['admin', 'api', 'cart', 'download', 'licenses', 'media', 'o', 'order', 'r', 'sitemap']);

async function uniqueSlug(db: AdminDb, rawBase: string, excludeId?: string) {
  const base = RESERVED_SLUGS.has(rawBase) ? `${rawBase}-beat` : rawBase;
  let candidate = base;
  for (let i = 2; i < 100; i++) {
    let query = db.from('beats').select('id').eq('slug', candidate);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function parseTags(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter((t) => t.length > 0 && t.length <= 40)
    )
  ).slice(0, 20);
}

async function setTags(db: AdminDb, beatId: string, tags: string[]) {
  await db.from('beat_tags').delete().eq('beat_id', beatId);
  if (tags.length === 0) return;
  const { data: rows } = await db
    .from('tags')
    .upsert(
      tags.map((name) => ({ name })),
      { onConflict: 'name' }
    )
    .select('id');
  if (rows && rows.length > 0) {
    await db
      .from('beat_tags')
      .insert(rows.map((r: { id: string }) => ({ beat_id: beatId, tag_id: r.id })));
  }
}

function beatFields(formData: FormData) {
  const key = text(formData, 'musical_key');
  const salesMode = text(formData, 'sales_mode');
  const bpm = intOrNull(text(formData, 'bpm'));
  return {
    title: text(formData, 'title'),
    bpm: bpm && bpm >= 40 && bpm <= 300 ? bpm : null,
    musical_key: MUSICAL_KEYS.includes(key) ? key : null,
    genre: text(formData, 'genre') || null,
    mood: text(formData, 'mood') || null,
    produced_on: text(formData, 'produced_on') || null,
    description: text(formData, 'description') || null,
    sales_mode: ['public', 'verified', 'approval'].includes(salesMode) ? salesMode : 'public',
  };
}

async function log(db: AdminDb, userId: string, action: string, target: string, data = {}) {
  await db.from('admin_audit_log').insert({ user_id: userId, action, target, data });
}

// ---------- beats ----------

export async function createBeat(formData: FormData) {
  const { user, db } = await requireAdmin();
  const fields = beatFields(formData);
  if (!fields.title) redirect('/admin/beats/new?error=title');

  const slug = await uniqueSlug(db, slugify(fields.title));
  const { data: beat, error } = await db
    .from('beats')
    .insert({ ...fields, slug, status: 'draft' })
    .select('id')
    .single();
  if (error || !beat) throw new Error(`Couldn’t create the beat: ${error?.message}`);

  // Turn on every active license tier for this beat by default.
  const { data: tiers } = await db.from('license_tiers').select('id').eq('active', true);
  if (tiers && tiers.length > 0) {
    await db
      .from('beat_licenses')
      .insert(tiers.map((t: { id: string }) => ({ beat_id: beat.id, tier_id: t.id })));
  }

  await setTags(db, beat.id, parseTags(text(formData, 'tags')));
  await log(db, user.id, 'beat.create', beat.id, { title: fields.title });
  redirect(`/admin/beats/${beat.id}?saved=created`);
}

export async function updateBeat(formData: FormData) {
  const { user, db } = await requireAdmin();
  const id = text(formData, 'id');
  const fields = beatFields(formData);
  if (!fields.title) redirect(`/admin/beats/${id}?error=title`);

  const requestedSlug = slugify(text(formData, 'slug') || fields.title);
  const slug = await uniqueSlug(db, requestedSlug, id);

  const { error } = await db.from('beats').update({ ...fields, slug }).eq('id', id);
  if (error) throw new Error(`Couldn’t save: ${error.message}`);

  await setTags(db, id, parseTags(text(formData, 'tags')));
  await log(db, user.id, 'beat.update', id);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/beats/${id}?saved=details`);
}

export async function updateLicenses(formData: FormData) {
  const { user, db } = await requireAdmin();
  const id = text(formData, 'id');
  const { data: tiers } = await db.from('license_tiers').select('id, price_visible');

  for (const tier of (tiers ?? []) as { id: string; price_visible: boolean }[]) {
    const available = formData.get(`available_${tier.id}`) === 'on';
    const dollars = text(formData, `price_${tier.id}`).replace(/[$,\s]/g, '');
    const parsed = dollars ? Math.round(Number(dollars) * 100) : null;
    const priceOverride =
      tier.price_visible && parsed != null && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;

    await db.from('beat_licenses').upsert(
      { beat_id: id, tier_id: tier.id, available, price_cents_override: priceOverride },
      { onConflict: 'beat_id,tier_id' }
    );
  }

  await log(db, user.id, 'beat.licenses', id);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/beats/${id}?saved=licenses`);
}

export async function setBeatStatus(formData: FormData) {
  const { user, db } = await requireAdmin();
  const id = text(formData, 'id');
  const status = text(formData, 'status');
  if (!['draft', 'published', 'unavailable'].includes(status)) {
    redirect(`/admin/beats/${id}`);
  }

  if (status === 'published') {
    const { data: files } = await db
      .from('beat_files')
      .select('kind')
      .eq('beat_id', id)
      .in('kind', ['master_mp3', 'master_wav']);
    if (!files || files.length === 0) redirect(`/admin/beats/${id}?error=needs-audio`);

    const { data: preview } = await db
      .from('beat_files')
      .select('kind')
      .eq('beat_id', id)
      .eq('kind', 'preview_mp3')
      .maybeSingle();
    if (!preview) redirect(`/admin/beats/${id}?error=needs-preview`);
  }

  const { data: current } = await db.from('beats').select('status').eq('id', id).single();
  if (current?.status === 'exclusive_sold') redirect(`/admin/beats/${id}?error=exclusive`);

  await db.from('beats').update({ status }).eq('id', id);
  await log(db, user.id, `beat.status.${status}`, id);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/beats/${id}?saved=${status}`);
}

// ---------- uploads ----------

const LIMITS: Record<FileKind, number> = {
  artwork: 15 * 1024 * 1024,
  master_mp3: 60 * 1024 * 1024,
  master_wav: 600 * 1024 * 1024,
  trackout_zip: 5 * 1000 * 1024 * 1024,
  preview_mp3: 40 * 1024 * 1024,
  youtube_bg: 25 * 1024 * 1024,
};

function contentTypeFor(kind: FileKind, fileName: string): string | null {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  if (kind === 'artwork' || kind === 'youtube_bg') {
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    return null;
  }
  if (kind === 'master_mp3') return ext === 'mp3' ? 'audio/mpeg' : null;
  if (kind === 'master_wav') return ext === 'wav' ? 'audio/wav' : null;
  if (kind === 'trackout_zip') return ext === 'zip' ? 'application/zip' : null;
  if (kind === 'preview_mp3') return ext === 'mp3' ? 'audio/mpeg' : null;
  return null;
}

function bucketFor(kind: FileKind) {
  return kind === 'artwork' || kind === 'preview_mp3' || kind === 'youtube_bg' ? previewsBucket() : mastersBucket();
}

export async function getUploadUrl(
  beatId: string,
  kind: FileKind,
  fileName: string,
  size: number
): Promise<{ url: string; key: string; contentType: string } | { error: string }> {
  await requireAdmin();

  const contentType = contentTypeFor(kind, fileName);
  if (!contentType) return { error: 'That file type isn’t allowed here.' };
  if (size > LIMITS[kind]) return { error: 'That file is too large for this slot.' };

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80);
  const key = `beats/${beatId}/${kind}/${Date.now()}-${safeName}`;
  const url = await signedPutUrl(bucketFor(kind), key, contentType);
  return { url, key, contentType };
}

export async function recordUpload(
  beatId: string,
  kind: FileKind,
  key: string,
  size: number,
  durationSeconds: number | null
) {
  const { user, db } = await requireAdmin();
  if (!key.startsWith(`beats/${beatId}/${kind}/`)) throw new Error('Unexpected file location.');

  const bucket = bucketFor(kind);
  const { data: existing } = await db
    .from('beat_files')
    .select('object_key, bucket')
    .eq('beat_id', beatId)
    .eq('kind', kind)
    .maybeSingle();

  await db.from('beat_files').upsert(
    { beat_id: beatId, kind, bucket, object_key: key, size_bytes: size },
    { onConflict: 'beat_id,kind' }
  );

  if (existing && existing.object_key !== key) {
    await deleteObject(existing.bucket, existing.object_key);
  }

  if (durationSeconds && durationSeconds > 0 && (kind === 'master_mp3' || kind === 'master_wav')) {
    await db.from('beats').update({ duration_seconds: Math.round(durationSeconds) }).eq('id', beatId);
  }

  await log(db, user.id, 'beat.upload', beatId, { kind, size });
  revalidatePath('/admin', 'layout');
}

// ---------- tagged previews ----------

type PreviewOptions = { interval_seconds: number; tag_gain: number; first_tag_at: number };

const DEFAULT_PREVIEW_OPTIONS: PreviewOptions = {
  interval_seconds: 30,
  tag_gain: 1,
  first_tag_at: 2,
};

export async function getPreviewSources(beatId: string): Promise<
  | { sourceUrl: string; tagUrl: string; options: PreviewOptions }
  | { error: string }
> {
  const { db } = await requireAdmin();

  const { data: files } = await db
    .from('beat_files')
    .select('kind, bucket, object_key')
    .eq('beat_id', beatId)
    .in('kind', ['master_mp3', 'master_wav']);
  const list = (files ?? []) as { kind: string; bucket: string; object_key: string }[];
  // The MP3 downloads faster; fall back to the WAV.
  const source = list.find((f) => f.kind === 'master_mp3') ?? list.find((f) => f.kind === 'master_wav');
  if (!source) return { error: 'Upload the untagged MP3 or WAV first.' };

  const { data: settings } = await db
    .from('settings')
    .select('key, value')
    .in('key', ['producer_tag', 'preview_options']);
  const byKey = new Map(
    ((settings ?? []) as { key: string; value: unknown }[]).map((r) => [r.key, r.value])
  );
  const tag = byKey.get('producer_tag') as { bucket: string; key: string } | undefined;
  if (!tag) return { error: 'Upload your producer tag in Settings first.' };

  const options = {
    ...DEFAULT_PREVIEW_OPTIONS,
    ...((byKey.get('preview_options') as Partial<PreviewOptions> | undefined) ?? {}),
  };

  const [sourceUrl, tagUrl] = await Promise.all([
    signedGetUrl(source.bucket, source.object_key, 900),
    signedGetUrl(tag.bucket, tag.key, 900),
  ]);
  return { sourceUrl, tagUrl, options };
}

export async function saveWaveform(beatId: string, peaks: number[]) {
  const { db } = await requireAdmin();
  if (!Array.isArray(peaks) || peaks.length > 1000) throw new Error('Bad waveform data.');
  const clean = peaks.map((p) => (Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0));
  await db.from('beats').update({ waveform: clean }).eq('id', beatId);
  revalidatePath('/admin', 'layout');
}
