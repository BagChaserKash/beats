// Returns just https://<project>.supabase.co, even if extra text
// (like /rest/v1/) was pasted after it in Vercel.
export function supabaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}
