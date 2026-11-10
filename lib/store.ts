import { createAdminClient } from '@/lib/supabase/admin';

// SERVER ONLY. Reads the public catalog. Hidden prices never leave this file:
// for a hidden tier, priceCents is null and the real number is never selected.

export const BASE = '/beats';

export type StoreLicense = {
  tierId: string;
  slug: string;
  name: string;
  priceCents: number | null; // null = hidden ("Inquire")
  delivers: string[];
  isExclusive: boolean;
};

export type StoreBeat = {
  id: string;
  slug: string;
  title: string;
  bpm: number | null;
  musicalKey: string | null;
  genre: string | null;
  mood: string | null;
  durationSeconds: number | null;
  producedOn: string | null;
  createdAt: string;
  tags: string[];
  hasArtwork: boolean;
  waveform: number[] | null;
  priceFrom: number | null;
  salesMode: 'public' | 'verified' | 'approval';
  licenses: StoreLicense[];
};

type TierRow = {
  id: string;
  slug: string;
  name: string;
  default_price_cents: number;
  price_visible: boolean;
  delivers: string[];
  is_exclusive: boolean;
  sort_order: number;
};

type BeatRow = {
  id: string;
  slug: string;
  title: string;
  bpm: number | null;
  musical_key: string | null;
  genre: string | null;
  mood: string | null;
  duration_seconds: number | null;
  produced_on: string | null;
  created_at: string;
  waveform: number[] | null;
  sales_mode: 'public' | 'verified' | 'approval';
  beat_files: { kind: string }[] | null;
  beat_tags: { tags: { name: string } | { name: string }[] | null }[] | null;
  beat_licenses:
    | {
        tier_id: string;
        available: boolean;
        price_cents_override: number | null;
        price_visible_override: boolean | null;
      }[]
    | null;
};

const BEAT_SELECT = `
  id, slug, title, bpm, musical_key, genre, mood, duration_seconds, produced_on, created_at, waveform, sales_mode,
  beat_files ( kind ),
  beat_tags ( tags ( name ) ),
  beat_licenses ( tier_id, available, price_cents_override, price_visible_override )
`;

function liveFilter() {
  return `status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`;
}

async function loadTiers() {
  const { data } = await createAdminClient()
    .from('license_tiers')
    .select('id, slug, name, default_price_cents, price_visible, delivers, is_exclusive, sort_order')
    .eq('active', true)
    .order('sort_order');
  return (data ?? []) as TierRow[];
}

function toStoreBeat(row: BeatRow, tiers: TierRow[]): StoreBeat | null {
  const kinds = new Set((row.beat_files ?? []).map((f) => f.kind));
  if (!kinds.has('preview_mp3')) return null; // never list a beat without a tagged preview

  const byTier = new Map((row.beat_licenses ?? []).map((l) => [l.tier_id, l]));
  const licenses: StoreLicense[] = [];
  for (const tier of tiers) {
    const l = byTier.get(tier.id);
    if (!l || !l.available) continue;
    const visible = l.price_visible_override ?? tier.price_visible;
    licenses.push({
      tierId: tier.id,
      slug: tier.slug,
      name: tier.name,
      priceCents: visible ? l.price_cents_override ?? tier.default_price_cents : null,
      delivers: tier.delivers,
      isExclusive: tier.is_exclusive,
    });
  }
  const visiblePrices = licenses.map((l) => l.priceCents).filter((p): p is number => p != null);

  const tags = (row.beat_tags ?? [])
    .flatMap((r) => (Array.isArray(r.tags) ? r.tags : r.tags ? [r.tags] : []))
    .map((t) => t.name);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    bpm: row.bpm,
    musicalKey: row.musical_key,
    genre: row.genre,
    mood: row.mood,
    durationSeconds: row.duration_seconds,
    producedOn: row.produced_on,
    createdAt: row.created_at,
    tags,
    hasArtwork: kinds.has('artwork'),
    waveform: Array.isArray(row.waveform) ? row.waveform : null,
    priceFrom: visiblePrices.length ? Math.min(...visiblePrices) : null,
    salesMode: row.sales_mode ?? 'public',
    licenses,
  };
}

export async function getCatalog(): Promise<StoreBeat[]> {
  const [tiers, res] = await Promise.all([
    loadTiers(),
    createAdminClient()
      .from('beats')
      .select(BEAT_SELECT)
      .or(liveFilter())
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);
  return ((res.data ?? []) as unknown as BeatRow[])
    .map((r) => toStoreBeat(r, tiers))
    .filter((b): b is StoreBeat => b !== null);
}

export async function getBeatBySlug(slug: string): Promise<StoreBeat | null> {
  const [tiers, res] = await Promise.all([
    loadTiers(),
    createAdminClient()
      .from('beats')
      .select(BEAT_SELECT)
      .eq('slug', slug)
      .or(liveFilter())
      .maybeSingle(),
  ]);
  if (!res.data) return null;
  return toStoreBeat(res.data as unknown as BeatRow, tiers);
}

export function mediaUrl(beatId: string, kind: 'artwork' | 'preview_mp3') {
  return `${BASE}/media/${beatId}/${kind}`;
}

export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
