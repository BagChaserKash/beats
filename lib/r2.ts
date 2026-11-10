import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// SERVER ONLY. Cloudflare R2 through its S3-compatible API.
let client: S3Client | null = null;

function r2(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 settings are missing in Vercel environment variables.');
    }
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId.trim()}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() },
      // R2 doesn't need the SDK's automatic checksums, and they break browser uploads.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return client;
}

export function mastersBucket() {
  return (process.env.R2_MASTERS_BUCKET ?? 'bagchaserkash-masters').trim();
}

export function previewsBucket() {
  return (process.env.R2_PREVIEWS_BUCKET ?? 'bagchaserkash-previews').trim();
}

export async function signedPutUrl(bucket: string, key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSignedUrl(r2() as any, command as any, { expiresIn: 3600 });
}

export async function signedGetUrl(bucket: string, key: string, expiresIn = 600, downloadName?: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: downloadName
      ? `attachment; filename="${downloadName.replace(/["\\\r\n]/g, '')}"`
      : undefined,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSignedUrl(r2() as any, command as any, { expiresIn });
}

export async function deleteObject(bucket: string, key: string) {
  try {
    await r2().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // Best effort: an orphaned file is harmless and can be cleaned up later.
  }
}
