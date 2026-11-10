import { getCatalog, mediaUrl } from '@/lib/store';

// SERVER ONLY. Re-checks every cart line against the live catalog so the
// browser can never set its own price or buy something that isn't for sale.

export type CartItemInput = { beatId: string; tierId: string };

export type CartLine = {
  beatId: string;
  tierId: string;
  slug: string;
  beatTitle: string;
  tierName: string;
  tierSlug: string;
  priceCents: number;
  delivers: string[];
  artworkUrl: string | null;
};

export async function validateCart(items: CartItemInput[]) {
  const unique = new Map<string, CartItemInput>();
  for (const item of items.slice(0, 25)) {
    if (item && typeof item.beatId === 'string' && typeof item.tierId === 'string') {
      unique.set(item.beatId, item);
    }
  }

  const catalog = await getCatalog();
  const byId = new Map(catalog.map((b) => [b.id, b]));
  const lines: CartLine[] = [];
  const problems: { beatId: string; message: string }[] = [];

  for (const item of unique.values()) {
    const beat = byId.get(item.beatId);
    if (!beat) {
      problems.push({ beatId: item.beatId, message: 'This beat is no longer available.' });
      continue;
    }
    if (beat.salesMode !== 'public') {
      problems.push({ beatId: item.beatId, message: `“${beat.title}” requires approval before purchase.` });
      continue;
    }
    const license = beat.licenses.find((l) => l.tierId === item.tierId);
    if (!license || license.isExclusive || license.priceCents == null) {
      problems.push({ beatId: item.beatId, message: `That license for “${beat.title}” isn’t available.` });
      continue;
    }
    lines.push({
      beatId: beat.id,
      tierId: license.tierId,
      slug: beat.slug,
      beatTitle: beat.title,
      tierName: license.name,
      tierSlug: license.slug,
      priceCents: license.priceCents,
      delivers: license.delivers,
      artworkUrl: beat.hasArtwork ? mediaUrl(beat.id, 'artwork') : null,
    });
  }

  return { lines, problems };
}
