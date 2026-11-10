'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { resendReceipt } from '@/lib/fulfillment';

export async function resendReceiptAction(formData: FormData) {
  const { user, db } = await requireAdmin();
  const orderId = String(formData.get('order_id') ?? '');
  const result = await resendReceipt(orderId);
  await db.from('admin_audit_log').insert({ user_id: user.id, action: 'order.resend_receipt', target: orderId });
  if ('error' in result) redirect(`/admin/orders?error=${encodeURIComponent(result.error)}`);
  redirect('/admin/orders?sent=1');
}
