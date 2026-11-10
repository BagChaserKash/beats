'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { mastersBucket, signedPutUrl, deleteObject } from '@/lib/r2';

export async function getTagUploadUrl(
  fileName: string,
  size: number
): Promise<{ url: string; key: string; contentType: string } | { error: string }> {
  await requireAdmin();
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const contentType = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : null;
  if (!contentType) return { error: 'Upload an MP3 or WAV.' };
  if (size > 20 * 1024 * 1024) return { error: 'Your tag file should be under 20 MB.' };

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80);
  const key = `settings/producer-tag/${Date.now()}-${safeName}`;
  const url = await signedPutUrl(mastersBucket(), key, contentType);
  return { url, key, contentType };
}

export async function recordTag(key: string, size: number, name: string) {
  const { user, db } = await requireAdmin();
  if (!key.startsWith('settings/producer-tag/')) throw new Error('Unexpected file location.');

  const { data: existing } = await db
    .from('settings')
    .select('value')
    .eq('key', 'producer_tag')
    .maybeSingle();

  await db.from('settings').upsert(
    { key: 'producer_tag', value: { bucket: mastersBucket(), key, size, name } },
    { onConflict: 'key' }
  );

  const old = existing?.value as { bucket?: string; key?: string } | undefined;
  if (old?.bucket && old.key && old.key !== key) await deleteObject(old.bucket, old.key);

  await db.from('admin_audit_log').insert({ user_id: user.id, action: 'settings.producer_tag', target: key });
  revalidatePath('/admin', 'layout');
}

export async function savePreviewOptions(formData: FormData) {
  const { user, db } = await requireAdmin();
  const interval = Number(formData.get('interval_seconds'));
  const volume = Number(formData.get('tag_volume'));
  const first = Number(formData.get('first_tag_at'));

  const value = {
    interval_seconds: Number.isFinite(interval) ? Math.min(120, Math.max(10, Math.round(interval))) : 30,
    tag_gain: Number.isFinite(volume) ? Math.min(2, Math.max(0.2, volume / 100)) : 1,
    first_tag_at: Number.isFinite(first) ? Math.min(30, Math.max(0, first)) : 2,
  };

  await db.from('settings').upsert({ key: 'preview_options', value }, { onConflict: 'key' });
  await db.from('admin_audit_log').insert({ user_id: user.id, action: 'settings.preview_options', target: 'preview_options', data: value });
  revalidatePath('/admin', 'layout');
  redirect('/admin/settings?saved=1');
}
