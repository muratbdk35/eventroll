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

## 33. Landing visuals are the real app components (owner request, 2026-10-14)

- "How it works", the features bento and the hero no longer draw mock copies.
  They render the real components, inert and scaled down with CSS `zoom`
  (`components/marketing/app-previews.tsx`, `AppPreview`): the create-flow card
  (`FlowCard`, `TypeChips`, `DateTimeField`), the "your event is live" card
  (`LiveShare` with an inline QR), the dashboard `EventCard`, the share view's
  `GuestLinkField`, the real `PhotoGrid`, the settings `Row` + `Switch`, and a
  printed table card from the templates (`Face`). Changing the app changes the
  landing; the old mock helpers and `qr-card.tsx` are gone.
- To make that possible these were extracted and shared with the app:
  `EventCard` (dashboard), `GuestLinkField` (share view), `FlowCard` and
  `TypeChips` (create flow); `LiveShare` accepts `qrSvg`; `Face` is exported.
- The create flow always shows the account step; a signed-in host sees who they
  are with "continue" or "use another account", so nobody pays from the wrong
  account.

## 34. Cross-device email confirmation, PIN on QR cards, branded email (owner request, 2026-10-14)

- The email link no longer drops people into payment. It opens
  `/[locale]/auth/confirmed` ("Email confirmed"), and the tab that asked for the
  link continues by itself, even when the email is opened on another device:
  the asking tab opens a login request (`/api/login-request`, stored in Better
  Auth's `verification` table, 15 minutes), the confirmed page approves it for
  the signed-in email, and the waiting tab polls and receives a one-time
  magic-link URL of its own (`lib/login-requests.ts`). The waiting screen
  follows the 21st.dev "Auth Verify Email" card plus the "Push Approval"
  waiting pill. Local dev now uses Cloudflare's always-pass Turnstile site key.
- The PIN is also stored readable (`events.access_pin`, migration 0003; the
  hash still does the checking) so the print templates can show it. Hosts
  choose with "Show the PIN on the card"; PINs set before 0003 need one
  re-save. The host-facing "tell guests the PIN" note is gone from the card.
- The sign-in email is restyled from the React Email "Raycast magic link"
  template (MIT): logo PNG (`public/brand/email-logo.png`), one headline, one
  pill button, the plain link as fallback, a quiet footer.

## 35. Mobile polish, calmer guest page, legal drafts filled in (owner request, 2026-10-14)

- **Language on phones:** `LocaleSwitcher` is now a compact globe + code menu
  (`glass` variant over the guest cover) and is shown in the marketing header at
  every width; below 370 px the header shows only the logo mark so nothing
  scrolls sideways. The avatar menu has an account card, links (events, new
  event, website), an EN/TR/DE segmented control and a red sign-out.
- **Dashboard performance:** the drifting 120 px glows sat behind
  `backdrop-blur` cards, so phones re-blurred every frame. Glows are now static
  on the dashboard, create flow and confirmation page, the page-wide
  `mix-blend` grain is gone there, event cards are solid, and photos fade in
  without `filter: blur`. The event list loads all preview keys in one query
  (`latestPhotoKeys(eventIds)`, window function) instead of one per event.
- **Photos refresh:** a refresh button next to "Photos" re-renders the page
  (`router.refresh()`), so hosts can check for new uploads without reloading.
- **Event cards:** a compact row on phones (tilted thumbnail, name, meta,
  status); the polaroid card from `sm` up. Landing previews pass `layout="tall"`.
- **Guest page, simpler** (supersedes the deck of #26/#28): no swipe deck,
  sample prints, ambient glows, grain or frosted sheet. One big "leave a memory"
  card opens the picker; after picking it becomes a slim "add more" row above
  the tray. The duplicate welcome line is removed; the privacy line stays.
  Landing mocks follow (`MockAddMore` replaces `MockDeck`). `components/ui/stack.tsx`
  is no longer used.
- **Legal texts:** privacy, terms, cookies and report pages rewritten to match
  what the product does (originals stored unchanged incl. EXIF/location, no
  shared album, device cookie, salted IP/UA hash, 7-day deletion, providers).
  Still English-only DRAFTs with `[brackets]` and lawyer notes (#20).

## 36. Third-party notices page (owner request, 2026-10-14)

- `/[locale]/legal/third-party`, linked in the footer's legal column, credits
  every piece of outside work we ship: adapted UI components (author, licence,
  source link), runtime libraries (`lib/legal/third-party-libs.json`,
  regenerated with `npm run notices`), fonts and the Unsplash photos.
- Licences checked on 2026-10-14: Receipt Tiers comes from the author's
  Spectrum UI repo on GitHub (Apache-2.0), not a 21st.dev fetch; Masonry
  Lightbox, Veil Sign Up 2, Checkout Summary and Auth Verify Email are MIT,
  the setup wizard MIT-0. Full texts are served from `public/licenses/`.
  Apache-2.0 §4(b): `receipt-card.tsx` states that we modified it.
- Any newly copied or adapted outside code gets an entry in
  `lib/legal/notices.ts` in the same change.
- Removed the unused `components/ui/stack.tsx` and `border-beam.tsx`.

## 37. Create flow and guest page rebuilt on cult/ui Halo (owner request, 2026-10-14)

- The owner found both screens "vibecoded" and asked for real components from
  21st.dev. Code comes only from public sources: cult/ui's Halo set (MIT,
  github.com/nolly-studio/cult-ui) and uiable's Questionnaire (MIT,
  github.com/codedthemes/uiable) on the headless `@shadcn/react`. Nothing is
  scraped from 21st.dev pages; its daily fetches stay for components that
  exist nowhere else. Credits in `lib/legal/notices.ts`.
- `components/halo/` holds the adapted set (input, switch, button, card,
  progress, dropzone, notification, questionnaire) with one shared glow
  (`glow.tsx`): our terracotta/apricot/rose ramp instead of magenta/cyan, the
  blobs only drift on hover/focus (the original loops forever, which is what
  made the dashboard lag, #35), no backdrop-filter. The switch uses Radix so
  `<label htmlFor>` names it; Base UI put the id on a hidden input.
- Create flow: Halo progress + card shell; step 1 asks one question per
  screen (name → type with letter shortcuts → when → guest settings). The
  questionnaire primitive only counts its own inputs as answers, so we drive
  next/back ourselves. Plan receipts stay. Login form uses Halo too.
- Guest page: Halo name field, photo dropzone (compact once photos are
  picked), square thumbnails, solid Halo bar for consent + send, Halo
  progress while sending, green Halo notification as thanks. Upload logic
  unchanged. Landing mocks follow (#22): thumbnails instead of polaroids.
- Glow layers are clipped with `clip-path: inset(0 round …)` (`roundClip`),
  not only `overflow: hidden`: on the owner's Chrome the animated, blurred
  blobs escaped the rounded corners as hard boxes. Glows no longer extend
  outside buttons, switches and the progress bar.
- Owner follow-up: no grid background (tried Magic UI's, removed), nothing
  moves inside text fields, and decorative spots everywhere in the app are
  radial gradients instead of `blur()` filters (no filter, nothing to escape
  the corners). Rounded boxes whose children scale or move get `.clip-round`
  (`isolation: isolate`) so Chrome keeps their corners while animating.
- Not yet: the "Admit One" ticket (MIT, only on 21st.dev) for the guest
  header and the publish step, to be fetched with a daily 21st retrieval.

## 38. Theme: powder blue instead of terracotta (owner request, 2026-10-15)

- Primary is a dusty/powder blue `oklch(0.53 0.075 245)` (#457094, 5.2:1 on
  white, so white button text stays AA); grounds, borders, accents, glows,
  receipts, the landing mocks and the sign-in email follow (warm hues 20–95
  shifted to ~240 with lower chroma). Error red, success green and the amber
  "draft" pill keep their meaning colours.
- Print-card palettes (terracotta, midnight, sage, …) are hosts' design
  choices and stay as they are. Marketing photos are unchanged.

## 39. Album downloads: every way out (owner request, 2026-10-15)

- Built in the host's browser as #23 planned: `POST /api/events/[id]/download`
  (owner only) returns the originals (all, picked ids, or one uploader) with
  6-hour signed links; `lib/download/client.ts` streams them into a ZIP with
  client-zip (MIT). Files are stored, not recompressed: byte-identical to
  what guests sent (checked against the source files, EXIF intact).
- Chrome/Edge: the host picks where to save and the ZIP streams to disk (no
  size limit). Other browsers: the album is split into parts of ≤1.5 GB
  (≤400 MB on phones) that are built in memory, "Name (2 of 3).zip".
- Options on the event page's "Download" menu: all photos, by guest (incl.
  "no name"), and "choose photos" (selection mode in the grid → ZIP, or on
  phones the share sheet to save straight to Photos, up to 40 photos /
  300 MB). The viewer's single-photo button now uses a signed link with
  `Content-Disposition: attachment` (the cross-origin `download` attribute
  was ignored, so browsers opened the image instead).
- Names inside ZIPs sort by upload time in the host's time zone:
  "2026-06-14 21.31 - Selin - 0042.jpg". Failed files are retried twice,
  then skipped and offered as "try again".
- The event page shows the newest 12 photos and "See all (N)", which opens
  `?view=photos` (120 at a time, "Show more" adds 120); the download menu
  and selection mode work there too.
- Not yet: the "album ready" email and the 3-day/1-day reminders (#23).

## 40. Design pass against generic "AI" tells (owner request, 2026-10-15)

Audit with Anthropic's frontend-design skill; the owner approved every change.
The subject (EventRoll = a roll of film; prints, receipts, invitations) now
drives the visual choices instead of SaaS defaults.

- Type: Fraunces (soft serif, invitation feel) for headings, Schibsted
  Grotesk for the interface; Geist Mono only on receipts and PIN fields.
  Replaces Geist + Bricolage Grotesque.
- Landing: no eyebrow labels; section titles left-aligned on a hairline
  with the explanation beside them; hero without the single-word accent,
  the pill, the tick row or the photo collage, plus a full-width film strip
  whose frames "develop" on load (the page's one orchestrated motion,
  `.develop`, off with reduced motion); event types as photo prints with
  captions; how-it-works keeps its numbers (a real sequence) as big
  numerals without card chrome; feature tiles without borders; pricing on
  a flat blue table without trust pills; FAQ without a card; the closing
  section is a large print instead of a gradient box.
- App: no "→" on buttons; middle-dot meta strings became commas or separate
  items; "QUESTION 1 / 4" became a quiet four-bar progress; the guest
  header lost its "PHOTOS" label; Halo glow only on primary buttons, a
  focused field, the guest dropzone and success messages (`HaloCard glow`).
- Live status uses a darkroom safelight red (`--live`) instead of green.
- Print cards get a "Powder blue" palette, now the default.
- Receipts keep their caps and dots: that is how receipts are printed.

## 41. Event ticket, fuller "no app" tile, straight film strip (owner request, 2026-10-15)

- 21st.dev "Admit One Ticket" (larsen66, MIT; fetched with a daily
  retrieval, which reset at 00:00 UTC) adapted as `components/ui/event-ticket`:
  powder-blue dithered texture rendered once (no endless drift), the
  official `@paper-design/shaders-react` (Apache-2.0) instead of the bundled
  copy, fluid width, Fraunces name wrapped by length, tilt and glare only
  with a fine pointer and no reduced motion, no shutter sound.
- Shown on the guest page (over the cover, replacing the title; the h1 stays
  for screen readers), on the create flow's review step ("your guests see
  this ticket") and in the landing phone mock.
- The landing "no app" tile now shows the flow: camera viewfinder on a table
  card, the photo picker, and "12 photos uploaded" on wide screens.
- The hero film strip is straight, with SVG sprocket holes.

## 42. The guest ticket and its colour, for everyone (owner request, 2026-10-15)

- Every guest page opens with the event ticket on a plain ground; the cover
  photo behind it looked muddy and is gone.
- The ticket keeps the design as first adapted (warp texture, dark ink, the
  event year on the stub). A try with selectable patterns and a calmer
  texture looked worse and was reverted.
- Every plan picks the ticket colour in the event settings and in the
  review step, with a live preview (`components/host/ticket-settings`).
  Six palettes, each with the original's structure: mid-tone base, pale
  dither, dark ink at 4.5:1 or better, pale watermark
  (`lib/events/ticket.ts`). Stored in `events.ticket_color`; unknown or
  null means powder blue. `events.ticket_pattern` (migration 0004) is
  unused and kept until a later cleanup migration.
- The ticket is not a Premium feature, so receipts don't list it.
- Premium receipt stands out: faint blue paper, the plan name in reverse
  print.
- The guest page's main area has no background of its own: header and main
  share one ground, so the ticket's shadow isn't cut off in a line.
- Date fields: the visible day is formatted from the value's own date. With
  no app time zone, next-intl formatted in UTC and showed 00:00 on the 17th
  as the 16th in Istanbul. Upload times in the photo grid and the review
  ticket now use the browser's time zone.

## 43. Dashboard events as folders (2026-10-15)

- Each event on the dashboard is a folder (`components/host/event-folder`),
  adapted from Glassmorphism Folder Cards (Kedhareswer Naidu, MIT, via
  21st.dev): powder-blue back, the three newest photos as prints in the
  pocket, a paper front with status, name, date and photo count. Empty
  events hold blank sheets.
- Paper instead of frosted glass, no generated canvas art, no menu or
  open state (the whole folder links to the event). Pure CSS in
  `globals.css` (`.ef-*`), sized with container query units, so it renders
  on the server. Hover/focus leans the front and lifts the prints; on touch
  the prints already peek out. Reduced motion turns the transitions off.
- CSS modules don't work here: the Turbopack rule in `next.config.ts` runs
  every `*.css` through the Tailwind loader as plain CSS.
- The landing page keeps `EventCard`.

## 44. Show Premium before the payment (owner request, 2026-10-15)

Hosts on Standard never saw what Premium adds. QR templates: the Standard
preview is no longer blurred. The real template shows under a faint diagonal
"PREMIUM" watermark, with the offer over its lower half; printing stays
Premium-only.

## 45. Live is green (owner request, 2026-10-15)

Revises #40: the "live" status was safelight red, which hosts read as an
error. `--live` is now green (oklch 0.5 0.13 155; 0.72 in dark mode), so the
status pill and the live dot on the event page say "on" plainly.

## 46. Premium receipt in gold foil (owner request, 2026-10-15)

The Premium receipt is printed on ivory with gold: a fine double gold frame,
the plan name as a foil strip, a gold "best value" stamp, gold ticks, total
(gradient text) and barcode, and a foil button. The name strip and button get
a slow glint every few seconds (`.foil-glint` in `globals.css`), off under
reduced motion. Dark ink on foil keeps the text readable. Standard keeps the
plain white paper, so the difference shows at a glance on the landing page
and in the create flow.

## 47. Sign in with an email code, not a link (owner request, 2026-10-15)

Replaces the magic link and the cross-device login requests of #34.

- Better Auth's `emailOTP` plugin: a 6-digit code, valid 10 minutes, 5
  tries, stored hashed; a new code replaces the old one. Turnstile guards
  sending it (`/email-otp/send-verification-otp`).
- The host never leaves the page: the login form turns into six code boxes
  (shadcn `input-otp`, `autocomplete="one-time-code"`, digits only) that sign
  in as soon as the sixth digit is typed. The code can be read on any device,
  so the cross-device machinery (`lib/login-requests.ts`, `/api/login-request`,
  `/auth/confirmed`) is gone. Leftover `login-request:` rows in `verification`
  expire on their own.
- The code is also in the subject ("EventRoll giriş kodun: 482913"), so it
  shows in the phone's notification, and Safari can offer it from Mail.
- Email layout follows the code emails people already trust (Slack, Linear,
  Notion): logo, one line, the code large in a dashed box like the ticket's
  perforation, validity, a "never share it" line. The label is upper-cased
  per locale ("GİRİŞ KODU"). The email logo is now powder blue.
- The magic-link plugin stays only for `/api/dev-login`; its sender throws,
  so no link email can go out. In local development the code is also printed
  to the server console (the local Resend key can only send).

## 48. The guest page takes the ticket's colour (owner request, 2026-10-15)

- Each ticket colour has a page theme (`TICKET_THEMES` in
  `lib/events/ticket.ts`): a `primary` that white text reads on at 4.5:1 or
  better, and a pale `ground`. The guest page root sets `--primary`,
  `--ring`, `--accent`, `--secondary` and the background from it, so every
  button, icon, progress bar and focus ring below follows.
- The Halo controls no longer hard-code powder blue: their borders,
  gradients, rims and glows are mixed from `var(--primary)` with
  `color-mix` (supported on older iPhones, unlike relative colours). In the
  app `--primary` is still powder blue, so nothing there changes.
- Upload confetti uses the ticket's colours.

## 49. Speed pass (Lighthouse, 2026-10-15)

Measured every page with Lighthouse 12 (PageSpeed's engine; its keyless API
quota was used up): public pages on the test site, signed-in pages on a local
production build with a session cookie.

- The guest ticket renders on the server: every measure is a fraction of the
  width, so it is sized in container units (`cqw`) instead of measuring with
  a ResizeObserver, and the shape (scooped corners, notches) is a CSS mask of
  six circles instead of a measured clip-path. It looks the same; the text no
  longer waits for JavaScript. Only the WebGL texture joins after hydration.
- Marketing photos shown through plain `<img>` (PhotoStack, the photo grid
  preview) go through the image optimizer (`lib/images.ts`), about 1 MB less
  on the landing page; PhotoStack images load lazily.
- Fraunces drops the unused SOFT axis (font files roughly halved); Geist Mono
  is no longer preloaded on every page.
- Accessibility to 100: the icon-only "new event" link has a name, a caption
  on the primary tile has full contrast, print captions don't repeat as alt.
- SEO below 100 on login, create, guest and legal pages is by design: they
  are noindex (the test site as a whole is too).

## 50. Planned: automatic flagging of explicit uploads (owner decision, 2026-10-16)

To build once a Sightengine account exists (keys in env):

- Every guest upload is checked with Sightengine `nudity-2.1`. Only
  `sexual_activity` and `sexual_display` (explicit sex, exposed genitals)
  count; erotica and all suggestive classes are ignored, so kissing,
  swimwear, cleavage and dancing never trigger it.
- A flagged photo is never deleted automatically: in the host's panel it is
  blurred with a "needs review" label; the host keeps it, or deletes it and
  blocks the device (`deletePhoto`, `blockDevice`).
- Both plans. Landing card "Content moderation" (wide tile, a gallery slice with one blurred photo); no "100% safe" claims (EU
  rules on misleading advertising): flagged photos are blurred and the host
  decides.
- About $0.001–0.002 per photo. CSAM scanning is decided at launch.

## 51. QR templates redrawn as tickets, downloaded as PNG (owner request, 2026-10-16)

- No print button any more (hosts don't print from the browser, and Safari's
  own headers/footers box pushed sheets onto two pages). Templates download
  as PNG: A4 at 300 dpi (2480 px), "Download PNG" with a spinner while the
  server draws it.
- The server draws the sheet with next/og (Satori + resvg):
  `GET /api/events/:id/template` (owner only, published events). The page's
  preview is that same PNG at 1000 px, so what you see is what you print.
  Without Premium the preview carries a diagonal "PREMIUM" watermark and the
  download answers 403; the bare QR stays downloadable as before.
- Design: "elegant", picked by the owner from three drafts (elegant,
  modern, polaroid) after a ticket-shaped first try didn't land. Cream
  paper, a fine double frame in the event's colour, "GUEST PHOTOS" between
  two rules, the event's name large in Fraunces (shrinks and wraps for long
  names), the date in spaced capitals, the QR in a hairline frame, the
  headline in Fraunces italic, one line of how-to, "no app needed". Colours:
  the six ticket colours, starting from the event's own; "White background"
  drops the cream. The tent card puts the words left and the QR right.
- Layout code: `lib/print/sheet.tsx` (millimetres on A4, flexbox only).
- Fonts: static TTF instances of Fraunces (incl. italic), Schibsted Grotesk and Geist Mono
  in `assets/fonts` (SIL OFL), traced into the route via
  `outputFileTracingIncludes`. Upper-casing happens per locale on the server
  ("MİSAFİR", "EKİM").
- The landing page shows a card drawn by the same code
  (`scripts/render-print-card.tsx` → `public/marketing/print-card-<l>.png`).

## 52. Explicit-image check for guest uploads (owner decision, 2026-10-16)

Built as planned in #50.

- `lib/moderation.ts`: Sightengine `nudity-2.1` on the photo's JPEG preview
  (or the original if it is JPEG/PNG/WebP/GIF; HEIC without a preview is
  skipped). Only `sexual_activity` and `sexual_display` count; at 0.5 or
  more the photo is `flagged`, otherwise `clear`. Erotica and suggestive
  classes are ignored. Runs with `after()` once the guest's confirm has
  answered, so uploads never wait or fail because of it. Without
  `SIGHTENGINE_API_USER/SECRET`, or when Sightengine fails (free plan:
  2,000/month, 500/day), the photo stays unchecked.
- `media.moderation` (null / clear / flagged / approved) and
  `moderation_score` (migration 0005, additive).
- Host side: flagged photos are blurred with a "Needs review" badge, a
  banner counts them, the viewer opens them blurred with "Show" and "It's
  fine, keep it" (`approvePhoto`), next to delete and block. A flagged photo
  never becomes a dashboard folder cover. Downloads include every photo; the
  host decides.
- Privacy policy names Sightengine SAS (Paris) as a processor and describes
  the check; sign-in retention now says codes (10 minutes, hashed).
- Cost: one operation per photo; free plan to start, Starter ($29 for
  10,000, then $0.002 each) once there are several events a month.
- Retries (2026-10-17): a photo is tried at most 3 times in all
  (`media.moderation_attempts`, migration 0006). A Sightengine throttle (its
  per-second limit; a guest sending a burst) is waited out and retried a few
  times within the same check and never uses up an attempt; any other failure
  does, and a HEIC without a preview is marked done at once. A nightly Vercel
  Cron (`vercel.json`, 03:30 UTC, `/api/cron/moderation`, authorised with
  `CRON_SECRET`) retries unchecked photos one at a time, least-tried first,
  and stops after ~45 s; the rest waits for the next night. Crons only run on
  production deployments, so this starts with the launch.
- CSAM scanning (hash matching, e.g. Cloudflare's CSAM Scanning Tool or
  PhotoDNA) is planned before launch.

## 53. Overnight sweep (2026-10-17)

Owner asked for a free-hand review of the whole app.

- Guest link previews: the guest page's title is the event's name and what
  to do ("Elif & Can · Share your photos"), and `opengraph-image.tsx` draws
  the event's own ticket (its colour, type, name, date, "GUEST" stub,
  1200×630) with next/og, so a link shared in WhatsApp shows the ticket. The
  event page's tab shows the event's name.
- Localised 404 (`app/[locale]/not-found.tsx` plus a `[...rest]` catch-all)
  and an error page with retry (`app/[locale]/error.tsx`) instead of Next's
  English defaults.
- The site header hid the whole logo under 400 px (it hid every child span,
  and the logo itself is a span); now only the word mark hides.
- 45 unused strings left over from earlier designs removed in all three
  languages (typecheck confirms none was used).
- `getEventBySlug` / `getOwnedEvent` are cached per request, so metadata and
  page share one query.
- A full album: guests used to see "failed, try again" (which can never
  succeed); now the photo says "Album is full". The host's event page warns
  from 90% ("Album nearly full (92%), 1,380 of 1,500 photos", with the
  Premium limit on Standard) and says plainly when guests can no longer
  upload.
- An expired event's page no longer offers to "finish setup": it says the
  photos will be, or were, deleted (with the date), and hides the empty
  gallery and settings (#54).
- `.env.example` documents `SIGHTENGINE_*`; the unused `MODERATION_API_*`
  placeholders are gone.
- Checked and fine: every server action and API route checks the session
  and ownership; dev-only routes are off in production; `.dev-storage`
  paths can't escape their folder; no horizontal overflow or console errors
  on any page at 375 px and 1280 px in tr/en/de.

## 54. Deletion after the download window, host emails, one daily job (2026-10-17)

Found in the sweep: nothing ever deleted an expired event's photos (uploads
closed, files stayed in R2 forever), although the privacy policy promises
permanent deletion after the 7th day; and the "album ready" email and
reminders planned in #23 were never built.

- `lib/events/retention.ts`: events past `expiresAt` (not already deleted)
  lose every photo, preview and cover in storage; media rows become
  `deleted` with names, device ids, fingerprints and consent times cleared;
  the event becomes `expired` with counters zeroed, blocked devices and the
  readable PIN cleared, and `purged_at` set. The event row stays for the
  host's dashboard and invoices.
- `lib/email/host-notices.ts` + `lib/events/notices.ts` (unit-tested): to
  the host, each at most once: "Your album is ready" once the event is over
  and has photos, then reminders 3 days and 1 day before deletion. If the
  first email only goes out in the last three days, it counts as the 3-day
  reminder. Same email frame as the sign-in code (`templates/notice.tsx`).
  Columns `album_ready_mail_at`, `reminder3_mail_at`, `reminder1_mail_at`,
  `purged_at` (migration 0007, additive).
- One Vercel Cron, `/api/cron/daily` at 07:00 UTC (09:00–10:00 in TR/DE):
  purge, then emails, then the moderation retry (#52) with the time left;
  the separate moderation cron is gone. `?dry=1` (and `&at=<date>` to
  pretend another day) reports without changing anything; tested that way
  against the dev database only. Crons run on production deployments, so
  all of this starts at launch.

## 55. Four plans on one slider receipt (owner decision, 2026-10-18)

- Mini $19 (1,000 photos, 10 GB, 7 days), Standard $29 (2,500, 25 GB, 14
  days), Pro $39 (5,000, 50 GB, 21 days), VIP $49 (7,500, 75 GB, 30 days).
  The download window now depends on the plan (`retentionDays`); before a
  plan is chosen the shortest one applies, and choosing a plan recomputes
  `expiresAt`. Worst-case costs per tier, including a server-side ZIP, stay
  well under the price (see the conversation of 2026-10-18).
- Content moderation (#52) is part of every plan, not an add-on: a safety
  feature people opt out of is a liability, and it costs cents per event.
- Print templates are in Pro and VIP (the owner: "hem pro hem vipte").
- The landing pricing and the paywall show one receipt with a four-stop dial
  printed on it (Radix slider, keyboard and screen-reader friendly; the plan
  names under the stops are tappable). Every plan prints the same rows, so
  sliding re-prints only the values; the paper "premiums up" with the tier:
  plain (Mini), reverse-printed name and "most chosen" stamp (Standard),
  silver foil with a steel frame, corner marks and a gunmetal button (Pro),
  gold foil (VIP). Photos, storage and the download window, the values that
  change, are printed larger with a highlighter swept under them. Starts on Standard, or
  on the plan picked on the landing page.
- Migration 0008 maps the old `premium` to `vip`. Four Stripe prices
  (`STRIPE_PRICE_MINI/STANDARD/PRO/VIP`) replace the two.

## 56. Phones save to the gallery; flagged photos hidden by default (owner request, 2026-10-18)

- On phones and tablets (share sheet with files and a coarse pointer), the
  download menu leads with "Save all to gallery"; downloads by guest and the
  selection bar save to the gallery too, with the ZIP still offered. The
  album is split into groups the share sheet handles (40 photos or 300 MB),
  downloaded one group at a time; each group needs one tap (the share sheet
  wants a fresh gesture) on "Save N photos", then "Save Images" on iPhone.
  Closing the sheet keeps the group ready; "Stop" ends the run.
- Saved photo ids are remembered per event in browser storage, so starting
  again continues with the rest ("Save again" starts over).
- The screen is kept on while photos download (Screen Wake Lock), for the
  ZIP too: a phone that locks mid-download stopped it. Computers keep the ZIP.
- Photos the explicit-image check flagged (#52) are now hidden by default:
  not in the grid, not in downloads, not in the counts there. A banner says
  how many are hidden; its switch (`events.hide_flagged`, migration 0009,
  default true) shows them blurred for review. Approved photos always show.
- Photos files pictures by their EXIF date only. JPEGs without EXIF
  (WhatsApp, downloads, screenshots) get a DateTimeOriginal of the upload
  moment when saved to the gallery (`lib/download/exif.ts`), so they land on
  the event day rather than the day of saving. Files with EXIF, the stored
  originals and ZIPs are not touched. Tested on an iPhone 2026-10-18: photos
  arrive in Photos; dates were the save day for EXIF-less pictures, hence this.
- Still to do: measure on a real iPhone with a few hundred photos.

## 57. Reporting illegal content (owner decision, 2026-10-19)

- Proactive CSAM scanning is not a legal duty in the EU (DSA Art. 8); a
  notice-and-action route is (Art. 16), with prompt removal once we know
  (Art. 6) and a report to the authorities on suspicion of a crime (Art. 18).
  Cloudflare's CSAM Scanning Tool only sees content served through a zone's
  cache, not our signed R2 links; it comes with the media domain at launch
  (a Worker checking our own signed links in front of R2). To be confirmed by
  the lawyer.
- The host, the only person who sees all photos, can report a photo in the
  viewer: "Child sexual abuse material" or "Other illegal content". The
  photo becomes `hidden` at once (out of grid, downloads, counts and covers,
  for the host too), with `media.reported_at` / `report_reason` (migration
  0010). For CSAM the uploading phone is blocked and its other photos hidden
  as well (`same_device`). Nothing is deleted then; the normal deletion after
  the download window still applies.
- The operator gets an email at SUPPORT_EMAIL with event, owner, photo id,
  device id and upload time, never the image or a link to it, plus what to
  do: don't open or keep it, report to the police / BKA or the eco /
  jugendschutz.net hotline, follow their instructions on keeping or deleting.
- Anyone else reports by email (terms, section 8); the privacy policy
  describes the report data.
- Open: we keep no raw IP address (only a salted hash), so the authorities
  get the event, time, name if given and the file's own metadata, not the
  uploader's IP. Storing IPs encrypted for the event's lifetime, disclosed
  only on legal request, is for the owner and the lawyer to decide.

## 58. Uploader IPs kept encrypted for legal requests (owner decision, 2026-10-19)

- Until now only a salted hash of IP + browser was kept (data minimisation:
  per-phone limits use the device cookie, abuse checks only need "same IP?").
  To help the authorities after a report (#57), each upload now also stores
  the IP encrypted (`media.uploader_ip_enc`, migration 0011; AES-256-GCM,
  `lib/guest/ip.ts`, key `IP_ENCRYPTION_KEY`). Never shown in the app; cleared
  when the photo or event is deleted and by the purge after the window.
- Decrypting is a deliberate, manual step for a legal request only:
  `npm run reveal-ip -- <media id>` with the production DATABASE_URL and the
  key. The production key lives in Vercel (sensitive) and in the owner's
  password manager; the test site has its own key. Without a key nothing is
  stored. The privacy policy says so (section 3 and 5).
