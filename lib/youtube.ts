// Builds copy-ready YouTube text for a beat.

type KitInput = {
  title: string;
  slug: string;
  bpm: number | null;
  musicalKey: string | null;
  genre: string | null;
  mood: string | null;
  tags: string[];
  prices: { name: string; priceCents: number | null }[];
};

function titleCase(s: string) {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function money(cents: number) {
  return `$${Math.round(cents / 100)}`;
}

export function buildYouTubeKit(b: KitInput) {
  const year = new Date().getFullYear();
  const url = `https://bagchaserkash.com/beats/${b.slug}`;

  // Artist names come from tags like "kuzco da foo type beat".
  const artists = b.tags
    .filter((t) => t.endsWith(' type beat'))
    .map((t) => titleCase(t.replace(/ type beat$/, '').trim()))
    .filter((t) => t && !/^(sc|south carolina|carolina|803|843|864|hard trap|club|turnt|trap)$/i.test(t))
    .slice(0, 2);

  const genre = b.genre ? titleCase(b.genre) : 'Trap';
  let title = artists.length
    ? `${artists.join(' x ')} Type Beat – "${b.title}" | ${genre} Beat ${year}`
    : `${genre} Type Beat – "${b.title}" | South Carolina ${genre} Beat ${year}`;
  if (title.length > 100) title = artists.length ? `${artists.join(' x ')} Type Beat – "${b.title}"` : `${genre} Type Beat – "${b.title}"`;
  if (title.length > 100) title = title.slice(0, 100);

  const facts = [b.bpm ? `${b.bpm} BPM` : null, b.musicalKey, b.genre, b.mood].filter(Boolean).join(' | ');
  const priceLines = b.prices.map((p) => `${p.name}: ${p.priceCents != null ? money(p.priceCents) : 'contact for price'}`);

  const description = [
    `Buy or license "${b.title}" here: ${url}`,
    '',
    facts,
    '',
    'Licenses (instant download after purchase):',
    ...priceLines,
    '',
    'Prod. BAGCHASERKASH',
    'Produced in South Carolina.',
    '',
    'You must purchase a license before releasing music made with this beat.',
    'Credit "Prod. BAGCHASERKASH" on any release.',
    '',
    `#typebeat #southcarolina #${genre.toLowerCase().replace(/[^a-z0-9]/g, '')}beat`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');

  const tagSet = new Set<string>([
    ...artists.map((a) => `${a.toLowerCase()} type beat`),
    ...b.tags,
    'south carolina type beat',
    'sc type beat',
    `${genre.toLowerCase()} type beat`,
    `${genre.toLowerCase()} beat ${year}`,
    `type beat ${year}`,
    'bagchaserkash',
    'prod bagchaserkash',
  ]);
  const tags: string[] = [];
  let length = 0;
  for (const t of tagSet) {
    const clean = t.trim();
    if (!clean) continue;
    if (length + clean.length + 2 > 490) break;
    tags.push(clean);
    length += clean.length + 2;
  }

  return { title, description, tags: tags.join(', '), url };
}
