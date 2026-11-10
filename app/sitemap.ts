import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const beats = await getCatalog();
  return [
    { url: 'https://bagchaserkash.com/beats', changeFrequency: 'daily', priority: 1 },
    ...beats.map((b) => ({
      url: `https://bagchaserkash.com/beats/${b.slug}`,
      lastModified: b.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
