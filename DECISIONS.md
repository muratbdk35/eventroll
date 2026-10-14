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
- Logo: tilted photo-frame mark supplied by the owner (2026-10-14), traced to SVG (`components/brand/logo.tsx`, `app/icon.svg`, source in `public/brand/`).

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

## 26. Guest page: "leave a memory", not "upload a file" (owner brief, 2026-10-14)

Design language: modern, calm but alive (Apple Photos / Partiful / Luma quality).

- Main action is a fanned stack of polaroids with a shutter button (springy press),
  never a dashed drop box. Picking photos is always allowed; the name is a soft pill
  and only checked when sending (if the host requires it).
- Photos are **not** sent on pick: they drop into a tray as tilted polaroids and
  are sent with an explicit "Send N photos" button in a frosted bar.
- **Consent:** sending requires an unticked-by-default checkbox ("I accept the
  Terms and Privacy Policy and may share these photos"). The API rejects uploads
  without it (`consent: true`) and stores `media.guest_consent_at`. This is a
  click-wrap record, not a signed contract; the legal texts are still drafts (#20)
  and need a lawyer before launch.
- Per-photo progress ring (XHR upload progress), springy check on success, a
  thank-you state, ambient glows, grain texture and frosted glass. All motion is
  CSS and turned off for `prefers-reduced-motion`.
- Cover: the host's own cover (`events.cover_key`) when set, otherwise the stock
  photo for the event type. Host-side cover upload is still to do.
- Dev note: Turbopack's persistent cache served a stale `app/globals.css` (hand-
  written rules missing while Tailwind utilities updated). If CSS changes don't
  show up, stop `next dev` and delete `.next/dev`. Restart `next dev` after
  schema migrations too (the cached DB client keeps the old shape).
- The guest page no longer lists photos sent in earlier visits (owner decision).

## 27. Host dashboard in the guest page's language (2026-10-14)

- Same ambient glows, grain and frosted surfaces as the guest page; glassy top bar.
- Event list: each card shows a fanned polaroid stack of the newest photos
  (`latestPhotoKeys`); empty events show blank prints with the type icon.
- "Get your event ready" checklist adapted from the 21st.dev Onboarding Checklist
  (ephraimduncan): circular progress, the open step on a tinted surface with its
  action, the rest as rows; it collapses to a share bar once photos arrive.
- Photos adapted from the 21st.dev Masonry Lightbox (ayushmxxn): masonry at the
  photos' real proportions, blur-in entrance, hover caption, shared-element spring
  into the viewer. Adds `framer-motion` (host pages only).

## 28. Free component sources besides 21st.dev (2026-10-14)

21st.dev's free tier allows 2 code fetches a day; most of its catalogue comes from
free (mostly MIT) shadcn-style registries we can use directly: Magic UI, React
Bits, Motion Primitives, Aceternity (free items only), Origin UI, shadcn/ui.
Vendored files keep a source line at the top.

- Guest deck: React Bits `Stack` (`components/ui/stack.tsx`, swipe/fling pile),
  import switched to `framer-motion`; React Compiler ref rules are disabled for
  that file only (motion values live in refs by design).
- Confetti on a finished send: `canvas-confetti` in brand colours, the Magic UI
  pattern; off for reduced motion.
- Date & time: shadcn/ui Calendar + Popover (`react-day-picker`, `date-fns`
  locales) in `components/ui/date-time-field.tsx`; used for start/end in the
  create form and in settings (which can now change the event times).

## 29. Events last at most 24 hours; plan cards (owner decision, 2026-10-14)

- `MAX_EVENT_HOURS = 24` (was 14 days), enforced by the schema. The pickers only
  offer days up to start + 24 h, a later end snaps to that limit, and moving the
  start keeps the end valid (`lib/events/times.ts`).
- Plan choice is two pricing cards with their own buttons: Premium is the dark,
  featured card (glow + Magic UI Border Beam, `components/ui/border-beam.tsx`),
  Standard the light one.

## 30. Review fixes (external review via Gemini, 2026-10-14)

Fixed:

- Settings: a typed PIN must be 4–8 digits even when one is already set (inline
  hint, save disabled); upload hours use the date-time field, start from the
  event's times, and show an error unless they close after they open (a window
  can run past midnight because both values carry a date).
- QR and guest link are locked until a plan is active: checklist and Share view
  show "unlocks after you choose a plan", and `/api/events/[id]/qr` answers 402.
- Guest page: tapping the deck opens the picker (a swipe still flips cards); the
  remove button has a 44 px hit area; sending without consent shakes the box
  (the API already rejected it); switching language with unsent photos asks
  first, and leaving the page warns; floating bars respect the iPhone safe area.
- Photos are distributed into columns round-robin, so the newest fill the top
  row left to right.
- Production refuses a localhost or non-https `NEXT_PUBLIC_APP_URL` (guest links
  and QR codes are built from it).

Not bugs / already planned: the send button stays enabled on purpose (pressing it
explains what is missing; consent is enforced server-side); `localhost:3100` in
the exported HTML is the dev value of `NEXT_PUBLIC_APP_URL`, not hard-coded; the
album ZIP and printable table cards are phase 1C/1D work (#22, #23).

## 31. Publish step and printable QR templates (owner decision, 2026-10-14)

- Setup is three steps: create → choose plan → publish. Choosing a plan (dev
  button now, Stripe in 1C) only records the plan; the event stays `draft`.
  `publishEvent` turns a planned draft into `active`. No migration: the
  `event_status` enum already had both values, and the guest page shows "not
  open yet" for drafts (`getUploadState`).
- The checklist only exists while the event is a draft. Every step opens, done
  ones too (created: date and times plus "edit details"; plan: limits plus an
  upgrade button in dev). The page re-keys the checklist on plan change so the
  publish step opens instead of everything collapsing.
- QR code and guest link appear only after publishing: the event page swaps the
  checklist for a "your event is live" card (QR, download, templates, copy
  link), and `/api/events/[id]/qr` answers 402 without a plan and 409 while a
  draft. Supersedes the "locked until a plan" rule in #30.
- Printable templates (`?view=print`, Premium per #22): 4 table cards on A4 with
  cut guides, a fold-in-half tent card (top half upside down) and an A4 poster;
  four palettes and an editable headline; no EventRoll branding (#21). Printing
  uses the browser dialog (also "save as PDF"): the sheet is portalled under
  `<body>` and print CSS hides everything else, with `@page` A4 and no margins.
  The face is sized in container query units so one design fits all three. The
  QR stays black on white for reliable scanning. Standard sees a blurred
  preview with PNG/SVG downloads.
- Marketing and dashboard copy no longer promise a free QR code right away.

## 32. One create flow from the landing receipts to publish (owner decision, 2026-10-14)

- `/[locale]/create` is the only way to make an event, in five steps: event
  (name, type, times and every guest setting) → plan (paywall) → account →
  payment → final check & publish. The landing receipts and "New event" lead
  here; `/dashboard/new` redirects. Supersedes the checklist of #31.
- Signed-out hosts get the first two steps without an account. The draft lives
  in this browser (localStorage `eventroll:draft`); after sign-in (email link,
  Google, or the dev login with a safe `next` path) `createEventFromDraft` saves
  event and settings at once and clears it. A magic link opened on another
  device has no draft; the host is told to re-enter the details.
- The chosen plan travels in the URL (`plan=`), not in the database, until
  payment. Payment calls `devActivate` locally; Stripe Checkout replaces it in
  1C. The final check summarises the saved event with "Edit" links to settings
  (which lead back to the review), then `publishEvent` and the event page.
- A draft event's page shows a "finish setup" card that resumes the flow (plan
  step if unpaid, review if paid).
- Components, all from the 21st.dev catalogue as the owner asked: the paywall
  reuses the landing "Receipt Tiers" receipts (Spectrum UI, Apache-2.0), now
  shared in `components/billing` so both look identical; the shell follows
  "Multi-Step Setup Wizard"; the account step "Sign Up 2" (Tailark Veil); the
  payment summary "Checkout Summary". The Google button is always shown and
  stays disabled until `GOOGLE_CLIENT_ID/SECRET` exist.
