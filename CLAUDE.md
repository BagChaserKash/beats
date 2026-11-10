# BAGCHASERKASH Beat Store — Project Brief

Independent beat-licensing store for producer BAGCHASERKASH, served at
`https://bagchaserkash.com/beats`. Real production e-commerce, not a mockup.
No BeatStars, Airbit, Shopify, or hosted marketplace. The owner owns the
catalog, customers, and transaction records.

Goal: the owner uploads a beat, sets details and license options, presses
Publish, and customers can discover it, preview it, buy an approved license,
pay, and automatically receive their files.

## Phase 1 findings (complete)

- Existing site: static HTML/CSS/JS (Vercel Framework Preset "Other"), stored on
  GitHub and auto-deployed by Vercel. Client-rendered: ~2 KB HTML shell, so search
  engines see little content.
- Brand signal from existing site: dark scheme, theme color `#060a24` (deep navy).
  Store direction: black/charcoal/white with restrained gold accents. Confirm with
  owner whether to incorporate the navy.
- **Do not modify the existing site's repo** except to add the `/beats` rewrite,
  and only after the store is deployed and tested.

## Architecture

- This repo (`bagchaserkash-beats`) is a separate Next.js (App Router) + TypeScript
  app, deployed as its own Vercel Pro project, with `basePath: '/beats'`.
- Routing: the main site's `vercel.json` gets rewrites placed above any SPA
  catch-all:
  ```json
  { "rewrites": [
    { "source": "/beats", "destination": "https://<store-project>.vercel.app/beats" },
    { "source": "/beats/:path*", "destination": "https://<store-project>.vercel.app/beats/:path*" }
  ]}
  ```
- Database and auth: Supabase Postgres with SQL migrations in-repo and Row Level
  Security on every table. Admin: Supabase Auth with mandatory TOTP MFA. Customers:
  email magic link (optional; guest checkout allowed).
- Storage: Cloudflare R2. A PUBLIC bucket holds previews, artwork, and waveform JSON.
  A PRIVATE bucket holds master MP3/WAV and trackout ZIPs. Uploads go direct from
  the browser via presigned URLs (trackouts can be multi-GB).
- Background jobs: queue (Inngest or Trigger.dev) and a small FFmpeg worker
  container (Fly.io/Railway). Never transcode in Vercel functions.
- Payments: Stripe Checkout, Stripe Tax, Promotion Codes. No card data stored.
  **Owner wants cards AND crypto** at checkout: `payment_method_types:
  ['card', 'crypto']` (Stripe's stablecoin method), all line items in USD.
  Make the allowed methods an admin setting (card + crypto / card only /
  crypto only) so it can change without code. The owner must request the Crypto payment method in
  the Stripe Dashboard first. Same webhook fulfillment flow applies. Bitcoin is
  out of scope unless requested later (would need BTCPay Server or similar).
- Email: Resend from `@bagchaserkash.com`.
- Errors: Sentry. Business events go to the `event_log` table.

## Non-negotiable rules

1. Never commit or request secrets in chat. All keys go in Vercel/Supabase
   environment variables; keep an `.env.example` with names only.
2. Prices, availability, sales mode, and blocked status are always computed
   server-side. Never trust cart data from the browser.
3. Files are delivered ONLY from a verified Stripe webhook, never from the success
   page.
4. Webhook idempotency: insert the Stripe `event.id` into `stripe_events` (PK)
   first; if it already exists, return 200 and stop. Order state changes happen in
   one transaction with the order row locked.
5. Masters and trackouts are never publicly addressable. Downloads go through
   `/beats/download/[token]`, which checks entitlement, revocation, expiry, and
   count, then issues a ~5-minute R2 signed URL.
6. Exclusive sales: lock the beat row; a partial unique index on
   `exclusive_reservations(beat_id) WHERE status IN ('reserved','paid')` prevents
   double-selling at the DB level. Reservations expire with the Checkout Session
   and are released on `checkout.session.expired`. Prior nonexclusive licenses
   remain valid.
7. Every order item stores an immutable license snapshot: template version ID,
   terms JSON copy, rendered agreement PDF, and licensee name. Editing a tier
   creates a new template version.
8. License templates default to the producer retaining copyright and publishing
   in all tiers, including exclusive, unless expressly transferred. All agreement
   text is a DRAFT for attorney review.
9. Collect only the minimum personal data. Rate-limit and validate all public
   endpoints.
10. Don't promise copy protection for previews. Protect masters and control
    delivery.
11. Hidden prices (see License tiers) must never reach the client in any form.
    Add a test that renders public pages and API responses and asserts no hidden
    price appears.

## License tiers (editable starting points)

Positioning: premium. Prices are set for serious artists who pay for quality;
deals come from discounts, never from lowering list prices.

| Tier | Price | Delivers | Default sales mode |
|---|---|---|---|
| MP3 Lease | $50 | Untagged MP3 | Public |
| WAV Lease | $100 | WAV | Public |
| Trackout Lease | $250 | WAV + stems ZIP | Public |
| Unlimited | $400 | WAV + stems ZIP | Public |
| Exclusive | Not shown publicly | Per agreement | Approval required |

**Exclusive pricing is private.** `license_tiers` and `beat_licenses` get a
`price_visible` flag (default false for Exclusive, true for others). When it's
false:
- The storefront, beat pages, cart, and license comparison page show
  "Inquire for exclusive", linking to `/beats/request/[slug]`. No price or
  "starting at" text appears.
- The price is never sent to the browser: not in page HTML, API/JSON responses,
  React props, structured data (schema.org Offer), Open Graph tags, sitemaps,
  or YouTube description templates. Filter it out server-side, not with CSS.
- An optional private `floor_price` (the owner's minimum) is visible
  only in the admin dashboard as a reference. Default it to $1,000.
- The owner sets the actual price per deal when approving a request. It is
  stored on the `purchase_token`, and the buyer sees it only through their
  secure purchase link and Stripe Checkout.

Editable terms per tier: formats, streaming/distribution caps, music videos,
commercial use, credit, Content ID, restrictions, duration, exclusivity,
ownership and publishing.

**Exclusive offers are always approved manually by the owner. Never
auto-approve.** Make approving fast:
- Buyer submits an offer (amount, artist info, intended use) on the beat page.
- The owner is notified immediately by email (and SMS/push later) with the
  offer, the buyer's links, and whether the offer is above or below the private
  floor.
- The notification links to a mobile-friendly approval screen in the admin
  (login and MFA still required) with Approve / Counter / Decline options.
- Approve or Counter issues the purchase token and emails the buyer a checkout
  link automatically. Decline sends a polite automatic email.
- After payment, everything else (beat removed from sale, contract, delivery,
  owner alert) is automatic. Optional: the confirmation email includes the
  owner's booking link (e.g. Calendly) for a studio session.
- Everything else (all lease tiers) is fully automatic. Default beats to
  Public; use Verified mode sparingly.

Sales modes per beat: `public`, `verified` (approved artist application
required: artist name, email, social URL, released-music URL, intended use),
`approval` (per-request; approval issues a single-use, email-bound, expiring
purchase token). The owner can block or restrict customers.

## Data model

beats, beat_files, tags, beat_tags, license_tiers, license_template_versions
(immutable once published), beat_licenses (per-beat price/availability grid),
customers, artist_applications, purchase_requests, purchase_tokens (hashed),
orders (unique stripe_session_id; statuses pending/paid/fulfilled/refunded/
disputed/canceled), order_items (license snapshot), exclusive_reservations,
entitlements, download_tokens (hashed), download_events, discounts (mirror
Stripe promotion codes; also time-boxed sale prices per beat/tier and bulk
deals such as buy 2 get 1, all managed from the admin dashboard), stripe_events, event_log, admin_audit_log.

## Routes

Public: `/beats`, `/beats/[slug]` (permanent URL used in YouTube descriptions;
SSR with metadata and structured data), `/beats/licenses`, `/beats/cart`,
`/beats/checkout/success`, `/beats/apply`, `/beats/request/[slug]`,
`/beats/purchase/[token]`, `/beats/account`, `/beats/download/[token]`,
`/beats/terms`, `/beats/privacy`.

Admin (MFA): `/beats/admin` with sections for beats, licenses, orders,
approvals, customers, discounts, analytics, and settings.

The persistent audio player lives in the `/beats` root layout. Favorites and
recently played are stored locally for guests and synced on login.

## Stripe events handled

`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`,
`charge.refunded` (revoke entitlements), `charge.dispute.created`.
Develop in test mode with the Stripe CLI (`stripe listen`).

## Build phases

1. Discovery: DONE.
2. MVP, in this order:
   a. Foundation: scaffold, Supabase migrations, R2 buckets, env setup, admin
      auth with MFA, placeholder `/beats` page deployed.
   b. Catalog: upload, metadata, FFmpeg previews with producer tag and waveform,
      tiers, price grid.
   c. Storefront: listings, filters/sort/search, beat pages, persistent player
      and queue.
   d. Commerce: cart, license acceptance, Checkout, webhook, snapshots.
   e. Delivery: entitlements, signed downloads, license PDFs, emails, account
      page.
   f. Hardening: rate limits, logging, backups, end-to-end test purchases.
3. Approvals: verified artists, restricted licenses, exclusive approval flow.
4. Automation: YouTube metadata kit, scheduled releases, analytics, CRM tools.
   YouTube API upload later, with authorized OAuth only.
5. Launch: test all flows, then switch Stripe to live.

## Working style

The owner is not a daily terminal user. Explain each step in plain language,
say what the owner must do in a dashboard versus what you do in code, and
confirm before any destructive action or any change outside this repo.

## Progress log

- Phase 1 complete. Store project `beats` on Vercel, public domain
  `beats-kohl.vercel.app`, routed from bagchaserkash.com/beats via rewrites in
  the main site's `vercel.json`. Live coming-soon page.
- Accounts created: Supabase (project `beats`, East US), Cloudflare R2 (buckets
  `bagchaserkash-masters` private, `bagchaserkash-previews`), Stripe (sandbox;
  live activation and Crypto request pending, under Pinnacle Forge Solutions LLC,
  DBA/statement descriptor BAGCHASERKASH), Resend (no domain yet).
- Vercel env vars set: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Config), `SUPABASE_SECRET_KEY`
  (Sensitive).
- Phase 2a (in progress): `supabase/migrations/0001_init.sql` (full schema, RLS
  on everywhere with no public policies, seeded tiers and settings); admin login
  at `/beats/admin/login` with mandatory TOTP MFA; `admin_users` allowlist;
  dashboard shell. Next.js 16 `proxy.ts` refreshes admin sessions.
- Owner workflow: code is delivered as zips and committed via GitHub Desktop.
- Open legal question for the attorney: licensor is likely Pinnacle Forge
  Solutions LLC; confirm who owns the beat copyrights (owner personally vs LLC)
  and name the licensor accordingly in agreements.
- Supabase URL env var in Vercel still has `/rest/v1/` appended; `lib/supabase/url.ts`
  normalizes it to the origin everywhere. Login page shows Supabase's real error.
- R2 env vars set: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_MASTERS_BUCKET`, `R2_PREVIEWS_BUCKET`. CORS on both buckets allows PUT/GET/HEAD
  from bagchaserkash.com and beats-kohl.vercel.app.
- Phase 2b (part 1): admin beats list, new beat, beat editor (details, tags,
  per-beat license availability and price overrides, publish/unpublish), direct
  browser-to-R2 uploads via presigned PUT (artwork → previews bucket; MP3/WAV/ZIP →
  masters bucket), duration read from audio in the browser. All admin server
  actions call `requireAdmin()` (signed in + aal2 + admin_users).
- NEXT: tagged preview generation (FFmpeg) with producer tag upload in settings,
  then the public storefront and player.
- Phase 2b (part 2): tagged previews are made IN THE ADMIN'S BROWSER (Web Audio
  OfflineAudioContext mix + limiter, MP3 encode with @breezystack/lamejs at
  128 kbps), uploaded to the previews bucket as `preview_mp3`, waveform peaks (200)
  saved to `beats.waveform` (migration 0002). Runs automatically after a master
  upload; "Remake" button on the beat page. Producer tag and preview options live
  in `settings` (`producer_tag`, `preview_options`) via /admin/settings. Publishing
  now requires a preview.
- Phase 2c: public storefront. `app/page.tsx` = store home (search, genre/mood/key,
  BPM range, max price, tag, sort; filtering done server-side in JS over the full
  live catalog), `app/[slug]/page.tsx` = beat page (metadata, JSON-LD
  MusicRecording with visible prices only, licenses with hidden Exclusive price,
  buy buttons disabled "opens soon"), `app/media/[beatId]/[kind]` = stable URLs that
  302 to signed R2 links for artwork/preview of LIVE beats only, `app/sitemap.ts`.
  Persistent player (`lib/player.tsx`, provider in root layout): queue, next/prev,
  seek, volume, auto-advance, waveform seek, favorites and recently played in
  localStorage. `lib/store.ts` is the only catalog reader and never selects hidden
  prices or floor prices.
- NEXT: cart + Stripe Checkout (test mode, card + crypto) + webhook + delivery.
- Phase 2d: cart (localStorage, one license per beat) → `startCheckout` server action
  re-validates every line against the live catalog, upserts customer (blocked check),
  creates pending order + order_items with frozen agreement snapshot (latest published
  template version, rendered with buyer name/email/beat/order/date/price), then Stripe
  Checkout (card + crypto from settings, falls back to card if crypto rejected,
  promotion codes allowed, Stripe Tax OFF for now). Webhook at
  `/beats/api/stripe/webhook` (needs `STRIPE_WEBHOOK_SECRET`): signature verified,
  event id recorded first (dup = 200), atomic pending→paid claim, entitlements +
  hashed single-purpose download tokens (72h, 5 uses), buyer email with links and
  full agreement text, admin notification; rollback + retry on failure. Refund →
  revoke (full); dispute → revoke + alert; expired → canceled. Order page
  `/beats/order/[id]?session_id=` (30-day re-downloads). `/beats/licenses` shows
  templates. Admin Orders page + revenue on dashboard.
- License templates v1 (migration 0003) are DRAFTS for attorney review. Licensor
  named as Pinnacle Forge Solutions LLC d/b/a BAGCHASERKASH.
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`,
  `ADMIN_NOTIFY_EMAIL`, optional `EMAIL_FROM` (default onboarding@resend.dev until
  domain verified), optional `SITE_URL`.
- NEXT: Resend domain verification, Stripe live activation, attorney review,
  Phase 3 (exclusive offers + verified artists).
- Email deliverability: iCloud rejected receipts (554 5.7.1 [HM08]) because of long
  random download-token URLs. Receipts now contain ONE short link
  `/beats/r/<12-char access_code>` (migration 0004, `orders.access_code`) that
  redirects to the order page; no download tokens are emailed. License agreements
  are attached as .txt. DMARC `v=DMARC1; p=none;` added in Cloudflare. Replies go
  to `EMAIL_REPLY_TO` or `ADMIN_NOTIFY_EMAIL`. Admin tools: Settings → Email
  delivery test (plain/sample), Orders → Resend receipt.
- Receipt link changed to `/beats/o/<code>`: a PAGE that renders the order directly
  (shared `app/order/OrderView.tsx`), because iCloud also rejected the redirecting
  `/beats/r/<code>` link. `/beats/r/` still works for older emails.
- License templates v2 (migration 0005): adds payment condition, distributor + Content ID opt-out, no standalone instrumental release, AI-training ban, artist warranties/indemnity, as-is limit, survival, Richland County venue, assignment, notices, severability. Still drafts for attorney review.
- YouTube kit on the admin beat page (migration 0006 adds `youtube_bg` file kind):
  background upload, in-browser 1080p video maker (canvas + tagged preview via
  MediaRecorder, real-time render, MP4 when supported else WebM, optional title
  overlay), tagged MP3 download, and generated title/description/tags
  (`lib/youtube.ts`; artist names come from tags ending in " type beat").
