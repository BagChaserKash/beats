import { createAdminClient } from '@/lib/supabase/admin';
import { signedDownloadFor, messagePage } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

const REDOWNLOAD_DAYS = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; entitlementId: string }> }
) {
  const { id, entitlementId } = await params;
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? '';
  const db = createAdminClient();

  const { data: order } = await db
    .from('orders')
    .select('id, stripe_session_id, paid_at')
    .eq('id', id)
    .maybeSingle();
  if (!order || !sessionId || order.stripe_session_id !== sessionId) return messagePage('Order not found.', 404);
  if (order.paid_at && Date.now() - new Date(order.paid_at).getTime() > REDOWNLOAD_DAYS * 86400 * 1000) {
    return messagePage('Re-downloads for this order have expired. Reply to your order email for help.', 410);
  }

  // The file must belong to this order.
  const { data: ent } = await db
    .from('entitlements')
    .select('id, order_items!inner ( order_id )')
    .eq('id', entitlementId)
    .eq('order_items.order_id', id)
    .maybeSingle();
  if (!ent) return messagePage('File not found for this order.', 404);

  const result = await signedDownloadFor(entitlementId);
  if ('error' in result) return messagePage(result.error, result.status);

  await db.from('download_events').insert({
    entitlement_id: entitlementId,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  });
  return Response.redirect(result.url, 302);
}
