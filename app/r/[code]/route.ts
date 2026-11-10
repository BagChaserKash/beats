import { createAdminClient } from '@/lib/supabase/admin';
import { messagePage } from '@/lib/delivery';
import { siteUrl } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// Short receipt link: /beats/r/<code> opens the buyer's order page.
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[a-z0-9]{8,20}$/.test(code)) return messagePage('This link isn’t valid.', 404);

  const { data: order } = await createAdminClient()
    .from('orders')
    .select('id, stripe_session_id')
    .eq('access_code', code)
    .maybeSingle();
  if (!order || !order.stripe_session_id) return messagePage('This link isn’t valid.', 404);

  return Response.redirect(
    `${siteUrl()}/beats/order/${order.id}?session_id=${encodeURIComponent(order.stripe_session_id)}`,
    302
  );
}
