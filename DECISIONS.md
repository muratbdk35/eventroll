# Decisions

Log of choices made where the spec was ambiguous or where reality differed.
Newest at the bottom. "Open" items need a human decision before launch.

## 1. Framework versions (2026-10-12)

Next.js 16.4 / React 19.3 / Zod 4 / next-intl 4 / Better Auth 1.7 / Drizzle 0.45.
Next 16 renamed Middleware to **Proxy** (`proxy.ts`). Version-matched Next docs
live in `node_modules/next/dist/docs/`.

## 2. Legal entity: Germany, payments via Stripe directly (2026-10-12)

The seller is a German company, so Stripe is used directly (no merchant of record).

- **Tax:** Stripe Tax (flag `STRIPE_TAX_ENABLED`), EU B2C VAT via **OSS**.
  Non-EU registrations are monitored via Stripe Tax threshold alerts. _Open:_ OSS
  registration with BZSt (human / tax advisor).
- **Prices are tax-inclusive** (`tax_behavior: inclusive`) to satisfy PAngV.
- **Withdrawal right (Widerrufsrecht):** checkout must collect explicit consent to
  immediate performance and acknowledgement of losing the 14-day withdrawal right;
  stored in `orders.withdrawal_waiver_at`. No voluntary money-back guarantee is
  advertised (owner decision, see #16); the legal right is handled at checkout only.
- **Invoices:** Stripe Checkout `invoice_creation` enabled.
- **B2B:** optional VAT ID collection at checkout (reverse charge).
- **Impressum:** `/legal/imprint` page is required (added in phase 1D, DRAFT).
- Payment code stays behind `lib/payments.ts` so the provider can be swapped.

## 3. Cache Components disabled for the MVP

Next 16 scaffolds with `cacheComponents: true`. Almost every app route reads the
session or per-request data, so it would add Suspense boundaries everywhere for
little gain. Marketing pages are still statically prerendered via
`generateStaticParams`. Can be revisited later without data-model changes.

## 4. Database drivers

- Production: Neon via the **WebSocket** driver (`drizzle-orm/neon-serverless`),
  because upload counters are updated in interactive transactions (spec §7.3);
  `neon-http` doesn't support those.
- **Local dev/tests: PGlite** (`DATABASE_URL=pglite:./.pglite`), in-process
  Postgres, migrations applied automatically on first use. Rejected in production by
  `lib/env.ts`. During `next build` an in-memory instance is used.
- Drizzle `casing: "snake_case"`: TS keys are camelCase, columns snake_case.
  Better Auth tables follow the same rule.

## 5. Event status `suspended`

Added to the spec's `draft | active | expired | deleted` so admins can take an
event down (spec §7.6) without deleting evidence.

## 6. Theming

Dark/light follows `prefers-color-scheme` only (no toggle, zero JS), so the guest
page stays light. Tokens in `app/globals.css`, documented in `lib/design-tokens.md`.

## 7. Retention start for paid plans (superseded by #17)

`expires_at = max(paid_at, event_date) + retention` so buying early doesn't eat
into the gallery lifetime. (Spec said `paid_at + retention`.) Free plan unchanged:
`max(event_date, created_at) + 7 days`.

## 8. Upload limits that the server can't verify

- R2 has no S3 POST-policy (`content-length-range`); size is bound by signing
  `Content-Length` on the presigned PUT and re-checked with HEAD in `confirm`.
- Video **duration** limits (2/5 min) are enforced client-side from metadata only;
  the server enforces byte limits.

## 9. "Remove branding" (Premium) in the MVP

Means hiding the "Powered by" line on guest pages and printed templates. Full
brand customization stays in phase 2.

## 10. Turnstile on owner sign-up

Moved to phase 1B so the widget, server verification and guest session are built
together (Better Auth `captcha` plugin).

## 11. UI sourcing (21st.dev)

21st.dev Magic MCP is used for marketing and dashboard layouts only, always adapted
to our tokens and copy (spec §0.7: original brand). The guest page is hand-written
with plain Tailwind to keep JS minimal. Free tier = 2 component fetches/day.

## 12. Analytics & monitoring defaults

PostHog EU Cloud, lazily loaded, in-memory persistence (no cookies) until the
cookie-consent banner exists (phase 1D). Sentry is a no-op until a DSN is set.
Hosting region: Frankfurt (Neon `eu-central-1`, Vercel `fra1`).

## 13. Open: abuse / CSAM escalation procedure

To be written in phase 1D: Cloudflare CSAM Scanning Tool on the R2 custom domain,
admin one-click delete + suspend, audit log, reporting to the relevant authority
(in Germany: BKA / jugendschutz.net). _Open:_ human sign-off.

## 14. Landing page built ahead of phase 1D (2026-10-12)

At the owner's request the full landing page was built now, using 21st.dev for
inspiration (previews of hero, steps, bento, gallery and pricing blocks) and one
fetched component ("Receipt Tiers"), rewritten as a server component with CSS-only
motion. No testimonials section until there are real customers (no invented
reviews). Guest "photos" in the hero are illustrated gradients, not stock images.
SEO pages, legal pages and cookie consent remain in phase 1D.

## 15. Prices: Standard $29, Premium $49 (owner decision, 2026-10-12)

Replaces the spec's $19 / $39. The pricing section shows only the two paid plans;
the free plan stays as a trial strip below them (signup without a card is still the
main acquisition path). Premium is the featured plan ("Best value", shown first on
mobile). Limits are unchanged; all values live in `lib/plans.ts`.
Hero imagery now uses real Unsplash-licensed photos (see `public/marketing/CREDITS.md`).

## 16. No free plan, no money-back guarantee (owner decision, 2026-10-12)

Creating an event, its settings and its QR code is free; guests can upload only
after the host buys Standard or Premium (`events.plan` is null and `status` is
`draft` until a paid order). The marketing site no longer advertises a refund
guarantee. Initial migration regenerated (no production data existed).

## 17. Retention: 7-day download window (owner decision, 2026-10-12)

All media is kept until the end of the 7th day after the event date
(`computeExpiresAt` in `lib/plans.ts`), then permanently deleted. Hosts download
the full-quality ZIP in that window. `event_date` is therefore required.
Reminder emails move to 3 days and 1 day before deletion (instead of 30/7 days).
Plans now differ by capacity, video length and extras, not by retention.

## 18. Original-quality storage at 5,000 items (analysis, 2026-10-12)

Typical phone photo 3-6 MB, so 5,000 photos is about 20 GB, within Premium's
50 GB cap. With the 7-day window the R2 storage cost of a full Premium event is
well under $1 (plus ~15k PUT requests, ~$0.07; R2 egress is free), so originals
are always stored untouched and the copy says "original quality".
Follow-ups for phase 1B: the spec's 500 MB per-video cap is too small for 5-minute
videos (1080p is ~100-130 MB/min, 4K far more) → raise to 2 GB per file and use
multipart, resumable uploads for large files; ZIPs over ~4 GB are split into parts
for browsers without File System Access support (Safari).

## 19. Photos only, no video (owner decision, 2026-10-12)

Guests upload images only (jpeg, png, webp, heic/heif, gif). Removed: video limits,
`media.kind` / `duration_sec`, `events.allow_video` and all video copy. This also
drops the multipart/2 GB follow-up from #18. Premium is differentiated by capacity
(5,000 vs 1,500 photos), custom template colours, live slideshow, no branding and
priority support.

## 20. Legal pages as English drafts

`/legal/{privacy,terms,cookies,imprint,dmca-report}` render from
`lib/legal/content.ts` with a localized DRAFT banner and `noindex`. Long legal
texts are kept out of `messages/*.json`; German/Turkish versions will come from
the lawyer. Bracketed placeholders (company data etc.) must be filled before launch.

## 21. No shared album; guest access controls; no branding (owner decision, 2026-10-12)

- Guests never see other guests' photos: `events.guests_can_view` and the guest
  gallery API are dropped. A guest only sees what they uploaded from their own
  device. (Spec items "guest gallery toggle" and "report from guest gallery" are
  void; reports go through `/legal/dmca-report`.)
- Abuse controls set by the host: optional PIN (`access_pin_hash`, rate-limited),
  upload window (`upload_opens_at` / `upload_closes_at`), and a per-device photo cap
  (`max_uploads_per_device`, null = unlimited). Each guest browser gets a signed,
  event-scoped random device id (cookie) after Turnstile; uploads store it in
  `media.device_id`. A salted IP+UA hash is a fallback only, never a hard limit
  (venue Wi-Fi is shared). Hosts can delete all photos from a device and block it.
- No plan shows EventRoll branding on guest pages or printed templates; Premium
  differs only by capacity and custom template colours. Slideshow, guestbook,
  priority support are dropped from the offer.
- Logo: "ER" monogram (`components/brand/logo.tsx`, `app/icon.svg`).

## 22. Print templates are Premium-only; marketing mocks are a build contract (2026-10-12)

Standard includes the QR code (PNG/SVG) and link; printable table cards, signs and
posters (with own colours) are Premium only (`plans.printTemplates`).
All product mocks on the landing page use one component set
(`components/marketing/mock.tsx`) and mirror real screens. Phase 1B must ship them
as shown: create form (name, date, type), share tab (QR, copy link, PNG/SVG),
settings (PIN, upload hours, per-phone limit), dashboard (photo count, guest count =
distinct devices, ZIP download), guest page (own uploads only, privacy line, success
toast), printed card with optional PIN line.

## 23. "Album ready" email with a download button (owner decision, 2026-10-12)

The ZIP is never attached (albums are GBs). When the event ends, the host gets an
email with a one-click button to the signed-in download page, where the ZIP is
built in the browser. Reminders 3 days and 1 day before deletion.

## 24. Phase 1B implementation notes (2026-10-13)

- **Dev fallbacks:** without R2 keys, uploads go to `.dev-storage/` via `/api/dev-storage`
  (404 in production); Turnstile uses Cloudflare's always-pass test keys outside
  production; rate limiting is in-memory without Upstash.
- **Upload pipeline:** `presign` (verified guest cookie, upload state, per-phone cap,
  plan capacity), then a direct PUT, then `confirm` (HEAD size check, atomic counter bump
  in a transaction). The client also uploads a 480px JPEG thumbnail; browsers that can't
  decode HEIC skip it. Abandoned `pending` rows need a cleanup cron (phase 1C/1D).
- **Guest device cookie:** `erg_<event>` = `deviceId.verifiedAt.hmac`; the proof (Turnstile
  and PIN) lasts 12 h, the device id 1 year. PIN attempts are rate limited per IP and event.
- **Host tools:** delete photo, "delete all from this phone and block it"
  (`events.blocked_device_ids`, migration 0001), PIN set/remove, upload hours, per-phone cap.
- **Owner sign-up Turnstile:** Better Auth `captcha` plugin on `/sign-in/magic-link`.
  Google sign-in is not captcha-gated (the provider already vets accounts).
- **Plan activation is a dev-only button** until Stripe checkout (1C). It refuses to run in
  production or when `STRIPE_SECRET_KEY` is set.
- **Not in 1B:** ZIP download, printable templates, reminder emails, admin (1C/1D).
- _Open:_ a batch that exceeds the per-phone cap is rejected as a whole instead of
  accepting the files that still fit.
- _Deploy:_ migration `0001_blocked_devices` must be applied to the Neon database
  (`drizzle-kit migrate` with the unpooled URL) before deploying this code.

## 25. `next dev` uses the Neon `dev` branch, not PGlite (2026-10-13)

Next 16 renders routes in several processes under `next dev`. PGlite is a
single-process database, so each process opened its own copy of `.pglite`: data
written in one route was missing in another, and the files could be corrupted
("Failed query: CREATE SCHEMA drizzle"). A failed connection was also cached, so
one error broke every page until a restart. Now:

- Local development points `DATABASE_URL` at the Neon branch `dev` (branched from
  `production`, migrations applied). Production data is never touched.
- PGlite stays for tests and builds (`pglite:memory`). A PGlite directory under
  `next dev` throws a clear error instead of corrupting silently.
- A failed DB connection is no longer cached.
- The demo login (`/api/dev-login`) is enabled only under `next dev`.
