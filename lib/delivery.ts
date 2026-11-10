import { createAdminClient } from '@/lib/supabase/admin';
import { signedGetUrl } from '@/lib/r2';

// SERVER ONLY. Turns an entitlement into a short-lived signed download link.

const EXT: Record<string, string> = { master_mp3: 'mp3', master_wav: 'wav', trackout_zip: 'zip' };
const SUFFIX: Record<string, string> = { master_mp3: '', master_wav: '', trackout_zip: ' (Trackouts)' };

export async function signedDownloadFor(entitlementId: string): Promise<
  { url: string } | { error: string; status: number }
> {
  const db = createAdminClient();
  const { data: ent } = await db
    .from('entitlements')
    .select('id, file_kind, revoked, order_items ( beat_id, order_id, beats ( title ), orders ( status ) )')
    .eq('id', entitlementId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = ent as any;
  if (!row) return { error: 'This download doesn’t exist.', status: 404 };
  if (row.revoked) return { error: 'This license is no longer active, so downloads are disabled.', status: 403 };

  const item = Array.isArray(row.order_items) ? row.order_items[0] : row.order_items;
  const order = item && (Array.isArray(item.orders) ? item.orders[0] : item.orders);
  if (!item || !order || !['paid', 'fulfilled'].includes(order.status)) {
    return { error: 'This order isn’t active.', status: 403 };
  }

  const { data: file } = await db
    .from('beat_files')
    .select('bucket, object_key')
    .eq('beat_id', item.beat_id)
    .eq('kind', row.file_kind)
    .maybeSingle();
  if (!file) {
    return { error: 'This file isn’t ready yet. Reply to your order email and it’ll be sent to you.', status: 404 };
  }

  const beat = Array.isArray(item.beats) ? item.beats[0] : item.beats;
  const title = String(beat?.title ?? 'Beat').replace(/[^a-zA-Z0-9 ._()-]+/g, '').trim() || 'Beat';
  const name = `${title} - BAGCHASERKASH${SUFFIX[row.file_kind] ?? ''}.${EXT[row.file_kind] ?? 'bin'}`;
  const url = await signedGetUrl(file.bucket, file.object_key, 600, name);
  return { url };
}

export function messagePage(message: string, status: number) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Download | BAGCHASERKASH</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#000;color:#f5f5f2;font-family:Helvetica,Arial,sans-serif;padding:24px">
<div style="max-width:420px"><div style="font-size:22px;font-weight:800;margin-bottom:16px">BAGCHASER<span style="color:#c9a54c">KASH</span></div>
<p style="line-height:1.6">${message.replace(/</g, '&lt;')}</p></div></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
