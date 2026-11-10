// Clean up the Supabase URL in case extra text (like /rest/v1/) was pasted
// after it. Keeps only https://<project>.supabase.co
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
    ).origin;
  } catch {
    // Leave it as-is if it isn't a valid URL.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The whole store lives under bagchaserkash.com/beats
  basePath: '/beats',
  poweredByHeader: false,
};

export default nextConfig;
