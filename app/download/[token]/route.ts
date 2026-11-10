import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/fulfillment';
import { signedDownloadFor, messagePage } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 20 || token.length > 100) return messagePage('This download link isn’t valid.', 404);

  const db = createAdminClient();
  const { data: row } = await db
    .from('download_tokens')
    .select('id, entitlement_id, expires_at, max_uses, use_count')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (!row) return messagePage('This download link isn’t valid.', 404);
  if (new Date(row.expires_at) < new Date()) {
    return messagePage('This download link has expired. Use the order page link in your email to download again.', 410);
  }
  if (row.use_count >= row.max_uses) {
    return messagePage('This link has reached its download limit. Use the order page link in your email to download again.', 410);
  }

  const result = await signedDownloadFor(row.entitlement_id);
  if ('error' in result) return messagePage(result.error, result.status);

  // Count the use (only if nobody else counted it at the same moment).
  await db.from('download_tokens').update({ use_count: row.use_count + 1 }).eq('id', row.id).eq('use_count', row.use_count);
  await db.from('download_events').insert({
    entitlement_id: row.entitlement_id,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  });

  return Response.redirect(result.url, 302);
}
