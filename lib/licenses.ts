import type { AdminDb } from '@/lib/auth';

export type TemplateVersion = {
  id: string;
  tier_id: string;
  version: number;
  terms: Record<string, unknown>;
  agreement_body: string;
};

// Latest published agreement version for each tier.
export async function latestTemplates(db: AdminDb, tierIds: string[]) {
  const { data } = await db
    .from('license_template_versions')
    .select('id, tier_id, version, terms, agreement_body, published_at')
    .in('tier_id', tierIds)
    .not('published_at', 'is', null)
    .order('version', { ascending: false });
  const latest = new Map<string, TemplateVersion>();
  for (const row of (data ?? []) as TemplateVersion[]) {
    if (!latest.has(row.tier_id)) latest.set(row.tier_id, row);
  }
  return latest;
}

export function renderAgreement(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{(\w+)\}\}/g, (match, name: string) => vars[name] ?? match);
}

export const FILE_LABELS: Record<string, string> = {
  master_mp3: 'Untagged MP3',
  master_wav: 'Untagged WAV',
  trackout_zip: 'Trackout stems (ZIP)',
};
