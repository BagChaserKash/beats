import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signedGetUrl } from '@/lib/r2';

// Stable public links for artwork and tagged previews of LIVE beats only.
// Redirects to a short-lived signed link; masters are never reachable here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ beatId: string; kind: string }> }
) {
  const { beatId, kind } = await params;
  if (kind !== 'artwork' && kind !== 'preview_mp3') {
    return new NextResponse('Not found', { status: 404 });
  }

  const db = createAdminClient();
  const { data: beat } = await db
    .from('beats')
    .select('status, publish_at')
    .eq('id', beatId)
    .maybeSingle();
  const live =
    beat &&
    (beat.status === 'published' ||
      (beat.status === 'scheduled' && beat.publish_at && new Date(beat.publish_at) <= new Date()));
  if (!live) return new NextResponse('Not found', { status: 404 });

  const { data: file } = await db
    .from('beat_files')
    .select('bucket, object_key')
    .eq('beat_id', beatId)
    .eq('kind', kind)
    .maybeSingle();
  if (!file) return new NextResponse('Not found', { status: 404 });

  const url = await signedGetUrl(file.bucket, file.object_key, 3600);
  return NextResponse.redirect(url, {
    status: 302,
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
