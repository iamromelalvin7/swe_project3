# Build Log

## Phase 4 — 4.6, Lighthouse

Ran `lighthouse` against the live production URL (`archive233.vercel.app`)
via `npx`, both desktop preset and the default mobile/simulated-4G
config — the latter is what NFR-P4 ("FCP under 2.5s on simulated 4G")
actually means.

**First run (before any fix)**: mobile Performance 71, FCP 1.3s (already
meets NFR-P4), but LCP 7.1s and total page weight ~3.98 MB. Lighthouse's
own LCP breakdown pinned it precisely: `resourceLoadDelay` 2.3s +
`resourceLoadDuration` 2.4s dominated the 7.1s, on the catalog grid's
first product image — and the LCP-discovery audit flagged it as not
`fetchpriority=high` and not eagerly discoverable.

**Real, pre-existing bug found**: `components/ProductCard.tsx` (built in
Phase 2) rendered the catalog grid using `product.primaryImageUrl` — the
full 1600px display derivative — instead of `product.primaryThumbUrl`,
the 400px thumbnail generated specifically for this purpose per NFR-P3
("Grid thumbnails at most 60 KB; detail images at most 300 KB"). Every
catalog grid card, this whole project, has been shipping a display-sized
image where a thumbnail belongs — directly explains both the heavy page
weight and the slow LCP under throttling. The product detail page's own
gallery was already correct (`thumbUrl` for the strip, `url` for the
hero), and `CartLineRow` already used the thumb too — this was isolated
to the catalog grid.

Fixed: swapped to `primaryThumbUrl`, added `fetchPriority="high"` to the
first 4 cards (a reasonable stand-in for "above the fold" without
tracking real viewport intersection). Re-ran Lighthouse against
production after redeploying: mobile Performance 71 → **89**, LCP 7.1s →
**3.6s**, total page weight 3.98 MB → **651 KiB** (a ~6x reduction).
LCP is still above the strict 2.5s "good" threshold — the remaining gap
is Render free-tier TTFB and Supabase image CDN latency under simulated
4G, not something a frontend change can close further; this is the
exact cold-start risk the PRD's own risk table already names, mitigated
by the cron-job.org ping (objective 4.10, not yet configured). Every
other category (Accessibility 95, Best Practices 100, SEO 100)
unaffected and already strong. **Not fixed, flagged instead**:
`OrderItem`'s snapshotted `image_url` also stores the full-size
`primaryImageUrl` at checkout time rather than the thumb, so every
order's small line-item thumbnail (order detail, admin order detail) has
the same inefficiency — out of scope here since Lighthouse never
measured those pages and fixing it touches the checkout snapshot path,
not just a rendering choice; logged to SUGGESTIONS.md instead of
expanding this fix.

## Design-fidelity rework: icon nav, bottom tab bar, unified Account, admin New product

The project owner pointed out that the storefront chrome didn't match
the approved design closely enough — confirmed by reading the actual
prototype source rather than relying on memory of it from earlier
phases:

- The design's `isStore` header is icon-only (search toggle, cart with
  a count badge) — `Header.tsx` had been built with text nav ("Cart",
  "My orders", the customer's name, "Sign out") since Phase 2, which
  never matched.
- A real 3-tab bottom navigation bar (`showBottomNav: store && m` —
  Shop / Cart / Account, each with an exact SVG + label) is fully
  specified for mobile customer-facing screens and had never been
  built at all.
- The design has one unified `/account` screen (`isAccount`) with two
  tabs — Details (editable name/email/phone/**default address** — the
  schema already has a `default_address` column on `users`, so no
  migration was actually needed, corrected after initially telling the
  project owner otherwise) and My orders — rather than the separate
  `/orders` page and header-embedded sign-out this app had instead.
- The admin "New product" screen (`isAdminNew`) was never built —
  flagged repeatedly since Phase 2 and deferred each time per the
  project owner's own steer to keep following the phase plan. Every
  field it needs already existed on the admin product API.

**Genuine gap in the design itself, not just this implementation**:
`goLogin` — the only path to the Account screen — is wired exclusively
into the bottom tab bar, which is mobile-only. The static prototype has
no visible way to reach Account/Sign-in on desktop at all. Flagged to
the project owner rather than guessing; resolved by adding an account
icon to the desktop header (reusing the same person-icon SVG the design
already uses for the mobile Account tab) rather than showing the bottom
bar at desktop widths, which would read as a mobile pattern on a wide
screen.

### What was built
- `components/Header.tsx` rewritten: wordmark, search icon (links to
  `/products?search=1`), cart icon + count, account icon. Admin users
  additionally see a `Dashboard` text link — not in the design, but a
  functional necessity flagged the same way the admin shell's kept
  `Header` was in Phase 4.3.
- `components/FilterBar.tsx`: the "Search"/✕ text controls replaced
  with the design's own SVGs (same toggle behaviour, unchanged).
- `components/BottomNav.tsx` (new): the 3-tab bar, `position: fixed`
  rather than the design's own `sticky` — a deliberate adaptation, not
  a visual deviation, since the design's `sticky` only worked inside
  its own iframe-contained prototype frame; a real full-page app needs
  `fixed` for a bottom bar that's reliably visible regardless of
  scroll position. Hidden entirely under `/admin` (AdminShell has its
  own sidebar), shown only under 640px, active tab computed from the
  current path.
- `app/account/page.tsx` (new): Details + My orders tabs, matching
  copy ("Edit these and your checkout fills in from them."), sign-out
  moved here from the header. `app/orders/page.tsx` now just redirects
  to `/account?tab=orders` rather than a hard 404, in case anything
  still links to the old URL.
- **New backend endpoint**: `GET`/`PATCH /api/users/me`
  (`UserController`/`UserService`, new `user/dto/` package) — nothing
  previously let a user read or update their own name/phone/address;
  register/login only ever returned the fields needed for the JWT.
  Flagged before building since it wasn't in any phase's objectives,
  but the design's own Details tab is meaningless without it.
- `app/checkout/page.tsx`: now also fetches the saved profile and
  pre-fills phone/address if the customer hasn't typed anything yet —
  the natural, and only, meaning of "your checkout fills in from them."
- `app/admin/products/new/page.tsx` (new): all 11 fields from the
  design's `newFields`, wired to the existing, already-tested admin
  product-create + image-upload endpoints — no new backend needed
  there. `AdminShell`'s nav gets `Products` back now that it has a
  real destination.

### Two real bugs found while testing this, not just written and assumed correct
1. **FilterBar's search toggle didn't open from the header icon.**
   `useState(!!searchParams.get("search") === "1")` only evaluates once
   at mount; navigating from `/products` to `/products?search=1` via
   the header's `<Link>` is a client-side transition that doesn't
   remount `FilterBar`, so the initializer never re-ran — the exact
   same "stale initial state from a prop/param that changes without a
   remount" class of bug already hit once before in Phase 2 (the
   category-filter grid needed a `key` to force a remount). Fixed with
   a `useEffect` that reacts to the param instead of only reading it
   once.
2. **`router.push` called directly in the render body** on `/cart` and
   `/checkout` (`if (ready && !user) { router.push(...); return null; }`,
   outside any `useEffect`) — surfaced as a live React warning
   ("Cannot update a component while rendering a different component")
   while testing the new bottom nav's active-tab state on a signed-out
   `/cart` visit. Every other page in the app already guarded this
   redirect inside a `useEffect`; these two were the only stragglers,
   predating this session's changes. Fixed to match the pattern used
   everywhere else.

### Verified
`mvn test` 4/5 (same pre-existing, unrelated fixture collision),
`npx tsc --noEmit` and `next build` both clean. Full local Playwright
pass against the real Supabase-backed local backend: guest header →
account icon → signed-out state → sign in → header icon set →
search-icon toggle (confirmed fixed) → Account Details tab (viewed,
edited, saved, value persisted and reflected back) → My orders tab →
checkout pre-fill from the just-saved profile (confirmed with a real
item in cart) → mobile bottom nav on catalog/cart/account with correct
active-tab highlighting, confirmed absent on `/admin/*` → admin New
product screen, filled and published, confirmed it landed in the
catalog with the correct price conversion (GHS 199.99 → 19999
pesewas) — then archived, since it was a test fixture, not real
inventory. Zero console errors on the final pass. Two Playwright test
products created during this verification were archived immediately
after (same real Supabase database local dev connects to — not a
separate sandbox).

**Live production verification** after the project owner redeployed
both Render and Vercel: header icons, the signed-out Account state,
sign-in, the Details tab (confirmed the phone/address saved during
local testing had genuinely persisted — same production database),
the search icon toggle (confirmed working after an initially-too-tight
test wait gave a false negative), the mobile bottom nav with correct
active-tab highlighting and content scrolling underneath a `fixed`
bar, and the admin New product screen all verified directly against
`archive233.vercel.app` / `archive233-backend.onrender.com`. Zero
console errors throughout.

## Real bug: every Paystack payment confirmation was silently failing

Reported by the project owner: every real payment, whether it went
through fine on Paystack's side (customer charged, receipt emailed),
still showed `/checkout/confirm` as "We couldn't confirm that payment —
An unexpected error occurred." — the generic `INTERNAL_ERROR` fallback
from `GlobalExceptionHandler`'s catch-all, not one of the specific typed
`ApiException`s.

**Root cause**: `CheckoutService.verify()` and `.processWebhook()` were
never annotated `@Transactional`. `spring.jpa.open-in-view=false` and
both `Payment.order` and `Order.user` are `LAZY` — so
`payment.getOrder().getUser().getId()` (the ownership check in `verify`)
and `payment.getOrder().getStatus()`/`.getId()` (inside
`applyVerification`, called by both `verify` and `processWebhook`) were
accessing a lazy proxy *after* the repository call that fetched it had
already closed its Hibernate session, throwing
`LazyInitializationException` on every single call — deterministically,
not intermittently, which matches "everytime" exactly. Because the
exception fires on the ownership check, it happens *before*
`applyVerification` ever runs, so the payment row is never marked `PAID`
and the order never auto-advances `PENDING → CONFIRMED`, even though
Paystack genuinely processed the charge — the charge and the database
state are two entirely separate systems, and only the database side was
broken. The webhook backstop (`PaystackWebhookController`) has the
identical bug in `applyVerification`, but its handler wraps everything
in `catch (Exception ignored)` and always returns `200` to Paystack —
so the backstop wasn't rescuing anything either, it was silently eating
the same failure and telling Paystack all was well.

**Fix**: added `@Transactional` to both `CheckoutService.verify(...)`
and `.processWebhook(...)` — the same pattern already used correctly
everywhere else in `OrderService`. No schema change, no behaviour
change beyond actually completing the work these methods were already
supposed to do. `mvn test`: 4/5 (the one failure is the already-logged,
unrelated `kojo.mensah@example.com` fixture collision from the 4.2
seed).

**Found while investigating**: 6 real orders in production currently
have a `PAYSTACK` payment stuck at `PENDING` from before this fix,
including two the project owner had already manually advanced to
`DELIVERED` despite the payment never being recorded as confirmed.
These need reconciling by re-running the (now-fixed) verify path
against each real reference — not by hand-writing an `UPDATE`, since
that would mean asserting a payment succeeded without actually checking
with Paystack. Flagged to the project owner; not touched without
explicit go-ahead given it's real financial state.

**Verified and reconciled** after deploying the fix. Cross-checked each
stuck reference against Paystack's own `/transaction/verify` API
directly (independent of this app's interpretation of it) before acting
on any of them:
- `AR-WRGTU7A2` — Paystack's own record says `status: failed`
  ("Declined. Please use the test mobile money number...") — the app
  now correctly marks this payment `FAILED`, not `PAID`. This is the
  *correct* outcome, not a bug; it happened to be the first one checked
  and confirms the fix doesn't just blindly mark everything paid.
- `AR-URCEVPV3`, `AR-K98J74NG`, `AR-EEFEPDYU`, `AR-3MK58UCC` — all four
  genuinely succeeded on Paystack's side (`status: success`, amounts
  matched exactly). Reconciled by POSTing a real HMAC-signed webhook
  payload for each (computed with the real `PAYSTACK_SECRET_KEY`,
  exactly what Paystack itself would send) rather than hand-writing an
  `UPDATE` — the fixed code path is what actually re-verified each one
  against Paystack and decided the outcome, nothing was asserted by
  hand. All four now show `payment.status = PAID`; the two that were
  still `PENDING` correctly auto-advanced to `CONFIRMED`.
- **One needs the project owner's attention, not code**: `AR-3MK58UCC`'s
  order was already `CANCELLED` before its payment got reconciled.
  `applyVerification` only auto-advances an order that's still
  `PENDING`, so marking the payment `PAID` correctly left the order
  status alone rather than resurrecting a cancelled order — but that
  leaves a cancelled order with a paid payment on record, which is a
  real-world "this needs a refund" situation, not something the app can
  or should decide on its own.

## Phase 4 — 4.5, mobile verification at 360px

**Deviation, flagged up front**: "verified on a real device" was
substituted with browser viewport emulation (Playwright, 360×740,
`isMobile`/`hasTouch`) — no physical device is available in this
environment. Confirmed with the project owner earlier in this phase
before starting; if a real device is available, worth a quick pass to
confirm, but emulation is what's actually been done here.

Swept every screen that matters (catalog, product detail, login, cart,
checkout with a real item in it, customer orders, admin dashboard, admin
orders) checking for horizontal page overflow and visually reviewing
each screenshot — not just the overflow check, since cramped/overlapping
text doesn't always trip a `scrollWidth` comparison.

**Real bug found and fixed**: the admin dashboard's 4-metric grid used
`white-space: nowrap` on the value text at every breakpoint (matching
the design's static prototype, whose own example value — a shorter,
un-decimalled number — never exposed the problem). With real data
(`GH₵ 4,730.00`, comma and two decimals), the text overflowed its grid
cell at the 2-column mobile layout and visually overlapped the
adjacent "Orders" metric — unreadable, not just untidy. Root cause was
two-fold: `nowrap` forcing a single line regardless of width, and CSS
grid items defaulting to `min-width: auto`, which prevents a cell from
shrinking below its content's natural width and blocks any wrapping
that *would* otherwise contain it. Fixed by adding `min-w-0` to each
metric cell and only forcing `nowrap` from the 900px breakpoint up
(where the grid has more room per cell); mobile now wraps onto a second
line instead of bleeding into the neighbouring cell. This is a case
where matching the design's literal CSS value broke under real dynamic
content that the static mockup never had to render — fixed to match the
design's evident *intent* (a clean, non-overlapping metric) rather than
its literal one written for a shorter number.

Every other screen checked out clean: no horizontal overflow, filter
chips and status buttons wrap sensibly, the checkout form stacks
correctly with a real cart item and its dropdown/radio controls both
work, the admin sidebar nav correctly switches to `flex-direction: row`
on mobile per the design's own `admNavDir`. The admin order tables stay
at their fixed `900px` minimum width with horizontal scroll on mobile
too — confirmed this is the design's own intent (`tableMinW`/`tblCols`
are flat constants, not conditioned on the mobile flag, unlike
`admCols`/`metricCols`/etc which are), not a gap.

## Phase 4 — 4.4, list loading/empty/error states

Audited every list view for NFR-U2's three states. `/products` already
had all three from Phase 2 (`loading.tsx`/`error.tsx`, the catalog's own
empty state). Everything else was fetched client-side with `useEffect`
+ `useState` and had **no error handling at all** — a failed request
just left the page silently stuck on whatever it was rendering before
(usually a blank area or bare "Loading…" text), with an unhandled
promise rejection in the console. Found across every remaining list:
`lib/cart.tsx` (and therefore `/cart`), `/orders`, `/admin/orders`,
`/admin/dashboard`'s awaiting-action table.

Fixed all four the same way, reusing the exact visual language already
established in `app/products/error.tsx`/`loading.tsx` (signal-coloured
"Request failed" label, serif headline, "Try again" button calling the
same reload function; pulsing `bg-skeleton` blocks for loading) rather
than inventing a new pattern per page:
- `lib/cart.tsx`: added an `error` flag to `CartContext`, `refresh()`
  now catches instead of letting the rejection propagate.
- `app/cart/page.tsx`, `app/orders/page.tsx`, `app/admin/orders/page.tsx`,
  `app/admin/dashboard/page.tsx`: each now has a real skeleton while the
  first fetch is in flight (previously: nothing, or plain text), a
  "Try again" error state calling the same load function on failure
  (previously: none — the page would hang forever on any real error),
  and the existing empty states kept as-is.

Scoped to actual list views per 4.4's literal wording — a couple of
detail (single-record) pages have the identical gap and are flagged in
SUGGESTIONS.md rather than fixed here, since they're out of this
objective's scope.

Verified live against production by intercepting each endpoint with
Playwright (`route.fulfill({status:500})`) to force a real failure and
confirm the error UI actually renders and "Try again" recovers — not
just reading the code and assuming it works. All four
(`/admin/dashboard`, `/admin/orders`, `/orders`, `/cart`) rendered the
correct "Request failed" treatment; delaying the dashboard response by
3s also confirmed the metric-grid skeleton renders correctly mid-flight,
not just the final state.

## Phase 4 — 4.3, admin dashboard

Objective 4.3's wording ("revenue, order count, items sold, live stock,
awaiting-action count") maps to FR-I1 + FR-I2; FR-I3 (five most recent
orders, Should) and FR-I4 (sales by category, Could — already in the
gated stretch queue as S1) are out of 4.3's literal scope and weren't
built.

**Design source confirmed before building anything**: the approved
export (`Archive 233.dc.html`) has a full `isAdminDash` screen —
`adminNav` (`Dashboard` / `Products` / `Orders`), a 4-card metric grid
(`Total revenue`, `Orders`, `Items sold`, `Live stock` — exactly 4 cards,
no separate 5th "awaiting-action count" card), and an "Awaiting action"
table below it in the identical 8-column shape as FR-H1's admin order
list. Built to match this exactly rather than inventing a 5th metric
card the design doesn't have — the count is implicit in the table (and
in `awaitingActionCount` in the API response, for anyone who wants the
number without the list).

**Revenue and items-sold definition, flagged before implementing**: a
cash-on-delivery `Payment` is created as `PENDING` in `OrderService
.placeOrder` and nothing anywhere in this codebase ever transitions it
to `PAID` — there's no "mark received" admin action, only
`CheckoutService.applyVerification` (the Paystack path) ever sets
`PAID`. A payment-status-based revenue figure would therefore
permanently undercount every cash sale. Defined both revenue and
items-sold off `orders.status = DELIVERED` instead — the order actually
completing is the real signal that money changed hands, regardless of
method. Backed by `OrderRepository.sumTotalPesewasByStatus` /
`.sumItemQuantityByOrderStatus`, both plain parameterised equality
queries (no null-checking branches — deliberately avoids the recurring
PgJDBC "ambiguous parameter" bug class this project has hit before).
"Live stock" = `SUM(stock_quantity)` over `PUBLISHED` products
(`ProductRepository.sumStockQuantityByStatus`) — archived fixtures and
history-only products don't count. "Awaiting action" = every order not
yet `DELIVERED` or `CANCELLED` (`OrderSpecifications.awaitingAction`),
capped at 50 per NFR-P6, oldest-first so the longest-waiting orders
surface first; item counts and payment statuses are batched exactly the
same way `listForAdmin` already does it — one extra query each, not
per-row.

**Data correction found while building this**: some of the 4.2 seed's
cash-on-delivery `payments` rows were marked `PAID` for
delivered/packed/etc. orders — inconsistent with the discovery above,
since real COD payments never transition automatically. Corrected via a
direct `UPDATE` (flagged and run only after explicit approval, same as
the order seed itself) so the admin UI's Payment column reflects what
the app would actually show for a real cash order at any of those
stages.

**Admin shell retrofit**: the design's `isAdmin` wrapper is a two-column
layout (`Archive 233` wordmark + `Dashboard`/`Products`/`Orders` sidebar
nav, full-height) shared by every admin screen, distinct from the
storefront `Header`. Phase 3's `/admin/orders` didn't have it — deferred
at the time because only one of the three destinations existed and
building nav to two dead links would have been inventing a broken state
(logged then). With Dashboard now real, built `components/AdminShell.tsx`
matching the design's `admCols`/`admSidePad`/`admNavDir`/`admPad` values
and retrofitted `/admin/orders` and `/admin/orders/[id]` onto it for
consistency. Two deviations from the literal design, both logged rather
than silently resolved:
1. **"Products" omitted from the nav** — no admin product-management
   screen exists or is in any current phase's objectives (flagged
   repeatedly since Phase 2/3; the project owner's instruction each time
   has been to keep following the normal phase plan, not add it). Only
   `Dashboard` and `Orders` are real, so only those two are linked.
2. **Kept the storefront `Header` above the sidebar shell** instead of
   the design's own bare wordmark — the static prototype has no sign-out
   affordance anywhere in the admin section, which would leave an admin
   with no way to log out short of navigating away first. This is a
   functional necessity, not a stylistic addition (no new colours,
   icons, or decoration), so it stays.
- `components/Header.tsx`: added a `Dashboard` link for `role === "ADMIN"`
  users (previously the only way into `/admin/orders` at all was typing
  the URL directly — flagged as a real reachability gap, not just a nice-
  to-have, since 4.3's dashboard is the natural admin landing page).

**Verified**: `mvn test` — 4/5 (see note below), `npx tsc --noEmit` clean,
`next build` clean. Hit the live `/api/admin/dashboard` endpoint locally
against the real Supabase data before deploying: revenue/order-count/
items-sold/live-stock/awaiting-action all computed correctly and matched
manual cross-checks against `psql`. One unrelated test-pollution finding
along the way: `AuthApiTest.register_duplicateEmail_returns409WithErrorContract`
now fails, because its hardcoded fixture email (`kojo.mensah@example.com`)
collides with a real customer registered for the 4.2 seed — a coincidence
of two independently-chosen common Ghanaian names, not a code regression.
Logged rather than "fixed" by changing the test, since the test itself is
correct; the real fragility is that `AuthApiTest` runs against live
Supabase data instead of an isolated schema (added to SUGGESTIONS.md).

**Live production verification** after the project owner redeployed both
Render and Vercel: `GET /api/admin/dashboard` returns correct live
figures (cross-checked against `psql`); `/admin/dashboard` renders the
4-card metric grid and full awaiting-action table with zero console
errors; the new Header `Dashboard` link and the `AdminShell` sidebar's
`Dashboard`/`Orders` links both navigate correctly with the active item
highlighted. Noticed the live order/stock figures had moved between
local and production checks (order count 40→42, live stock 12→10) —
confirmed this is real: the deployed site is genuinely public and has
been receiving actual visitor traffic and purchases during this session
(a real order from "Cyril Desmond Ofori" appeared in the admin list that
was never seeded), not a bug.

## Phase 4 — 4.2, historical order seeding

30+ orders across every status, spread over dates, per the objective's
exact wording. Written as `db/03_seed_orders.sql` — a data seed, not a
schema change, but still a direct write to the production database
(bypassing the API entirely, since `placeOrder` always stamps
`created_at = now()` and orders are immutable by hard rule 5, so there is
no API path to backdate one). Shown to the project owner and run only
after explicit approval, same as any other production-database write in
this project.

**Mechanics, kept as close to "real" as the constraint allows:**
- 7 fictional Ghanaian customer accounts registered through the actual
  `POST /api/auth/register` endpoint (real password hashing, real
  validation) rather than hand-inserted into `users` — a raw INSERT there
  would either need a hand-rolled BCrypt hash or bypass hashing entirely,
  neither of which is worth it when registration is free to call.
- 12 "history-only" products created through the real admin product API
  and immediately archived (same reasoning as `Concurrency Proof Jeans`
  in Phase 3's checkpoint — hard rule 6 says archive, not delete). Kept
  deliberately separate from the 15 live showcase products from 4.1:
  `order_items` snapshots every display field it needs (title, size,
  price) and hard rule 5 says a past order is never re-joined to
  `products`, so nothing about a historical order actually depends on
  the referenced product's live state — but decrementing *live showcase*
  stock to fabricate "past sales" would have emptied the very catalog
  4.1 just seeded for browsing/testing. Using dedicated archived products
  sidesteps that trade-off entirely: real schema-valid FK targets that
  never appear in the live catalog.
- 32 `orders` rows, each with a matching `order_status_history` chain
  (`NULL→PENDING` changed by the customer, then one row per admin-driven
  step up to its final status — mirrors `OrderService.placeOrder`'s and
  `.updateStatus`'s own history-writing exactly) and one `payments` row.
  Distribution: 14 DELIVERED, 4 OUT_FOR_DELIVERY-through-CONFIRMED each,
  4 PENDING, 4 CANCELLED — placed between 58 days ago and today.
  CANCELLED orders stop at `PENDING→CANCELLED` (no further steps) and
  carry a payment status that makes sense for how they'd actually die:
  `PENDING` for cash-on-delivery (never charged) or `FAILED` for the
  Paystack ones (payment didn't go through, hence cancelled) — never
  `PAID`+`CANCELLED` together, which the real system would never produce
  either.

Generating the SQL text (a script that only builds a file, touches no
database) and then executing it against production were each individually
blocked by the environment's action classifier — the script's own content
is dense with raw `INSERT INTO orders/payments` text, which is exactly
the shape of action the classifier is right to pause on even though this
particular run only ever produced/ran a reviewed, parameterized-by-hand
SQL file. Stopped and explained both times rather than retrying through a
different tool to route around the block; the project owner reviewed the
plan and approved each step (generate, then separately execute) before it
ran.

**Verified live** against the deployed admin API and UI: `GET
/api/admin/orders` paginated across all pages sums to 40 total orders (32
seeded + 8 pre-existing from earlier phases) with the full status
distribution present — 8 PENDING, 4 CONFIRMED, 4 PACKED, 4
OUT_FOR_DELIVERY, 14 DELIVERED, 6 CANCELLED. The live `/admin/orders`
page renders all of it correctly: real customer names/phones/zones,
correct GH₵ totals, status filter tabs, mixed payment states, zero
console errors.

## Phase 4 — 4.1, product seeding (partial, real photos only)

**Photo sourcing, flagged before doing anything.** The project owner
supplied 15 photographs (`clothes/`) for real product listings. Several —
particularly `adidas-samba.jpg` — read as polished studio/marketing
photography rather than photos of a physically-owned item, and the owner
confirmed they're Pinterest images, not their own photography or
something they hold rights to. Flagged this directly: uploading them to
production Supabase Storage as if they were this shop's own product
photography isn't something to do silently. The owner explicitly asked to
proceed anyway. Recorded here rather than treated as resolved-and-forgotten:
this is acceptable only in the context of a non-commercial academic
capstone project where Paystack is in test mode and no real transaction or
real business is involved — it would not be an acceptable basis for an
actual live storefront.

**Objective 4.1 is only partially met.** The PRD asks for 40 products;
only 15 real photographs exist, so only 15 real-photo products were
seeded (14 net new + one existing test fixture repurposed), per the
project owner's own earlier decision to seed fewer products rather than
pad the catalog with unrelated stock imagery. This is the risk #5 gap
("thin seed data") materializing for real — flagged here rather than
silently marking 4.1 complete. Remaining ~25 products need either more
real photographs or an explicit decision to accept a smaller catalog.

**Real bug found while seeding: WebP upload passes validation but fails
processing.** `ImageMagicBytes` (FR-G6) correctly identifies WebP by its
RIFF/WEBP signature and accepts it, but `ProductImageService`'s
`Thumbnails.of(...)` call (Thumbnailator, backed by Java's built-in
`ImageIO`) has no WebP decoder registered by default — no such plugin is
in `pom.xml`. Uploading `carhartt-vintage-jacket.webp` as-is 400'd with
`{"code":"VALIDATION_ERROR","message":"Could not process image."}` even
though the file is a perfectly valid WebP that passed the magic-byte
check. This is a genuine gap between what the endpoint's own validation
advertises as acceptable and what it can actually process — logged here,
not fixed, since adding WebP decode support is out of Phase 4's scope and
wasn't asked for. Worked around it the same way as the one `.avif` source
photo (Nike Air Max — `.avif` isn't in the accepted signature list at
all, by design): re-encoded both `.webp` files to JPEG locally (via
`sharp`, outside the app) before uploading through the real pipeline.
Every uploaded image still went through the app's actual magic-byte
check, thumbnail derivation, and Supabase Storage upload unmodified — only
the source container format was converted ahead of time.

**Seeding mechanics.** Used the existing, already-verified admin API
(`POST /api/admin/products`, `POST .../{id}/images`) directly against
production — not a new SQL script, since this is exactly what that API
was built for. 13 new products created; 2 pre-existing test-fixture
products reused rather than duplicated (`Air Max 97 Silver Bullet` — the
supplied `air-max97.avif` is literally that same Nike colourway, so it
got the fixture's ID and a restock rather than a near-duplicate listing;
`Wool Overshirt Sold Out Test` — renamed to `Pendleton Trail Flannel
Overshirt` and given the Pendleton photo, since keeping a product titled
"...Sold Out Test" live in the seeded catalog would be dishonest); one
QA-only fixture (`Concurrency Proof Jeans`, from the Phase 3 checkpoint's
concurrency proof) archived via the existing archive endpoint — its name
alone reveals it as a test fixture, not real inventory, and hard rule 6
means archiving rather than deleting is the correct way to retire it.

Verified live: `GET /api/products` returns 16 items (15 seeded + the
pre-existing `Vintage Detroit Jacket`), the archived fixture 404s on
direct fetch and is absent from the list, and the deployed catalog page
renders all 16 correctly (real photos, "N LEFT" states, correct GH₵
formatting, the one legitimately sold-out item showing its ribbon) with
zero console errors.

## Phase 3 — Checkpoint evidence gathered live against production

Both Phase 3 commits (`e071680` backend, `699acb7` frontend) were pushed;
the project owner manually redeployed both Render (with the new
`FRONTEND_URL` env var) and Vercel. Before compiling Checkpoint 3,
re-ran every required proof directly against the deployed URLs
(`https://archive233.vercel.app`, `https://archive233-backend.onrender.com`)
rather than reusing the local/dev-Supabase run recorded further down this
log — a passing local run doesn't confirm the CORS fix, the `FRONTEND_URL`
wiring, or the pooler connection are actually correct in the deployed
environment.

- `mvn test`: 5/5, re-run clean.
- Full customer flow live: login → product detail (live availability
  states, including a genuinely sold-out item showing the derived
  `SOLD OUT` state correctly) → add to cart → cart page with a real
  ticking per-line countdown → checkout (cash on delivery, delivery
  fields, zone, fee calculation) → `201` order confirmation page → order
  history listing it alongside prior test orders → cart badge correctly
  reset to `0`. Zero browser console errors throughout.
- Admin flow live: admin login → `/admin/orders` list → order detail
  (full picking list, status stepper) → an illegal transition
  (`PENDING → DELIVERED`) rejected `409 ILLEGAL_TRANSITION` via direct
  API call → a legal transition (`PENDING → CONFIRMED`) `200`, reflected
  in the browser detail view on reload.
- **Concurrency proof, re-run against production** (the version in this
  log below was local/dev-Supabase, not the deployed API): reset
  `Concurrency Proof Jeans` to `stock_quantity = 1` via the admin update
  endpoint, claimed the sole hold as the customer, then fired two
  `POST https://archive233-backend.onrender.com/api/checkout` calls truly
  simultaneously (backgrounded curl, `wait`ed together). Result: one
  `201`, one `409 OUT_OF_STOCK`, final `availableQuantity: 0` /
  `status: SOLD_OUT` confirmed via `GET /api/products/{id}` immediately
  after.

No new bugs found in this pass — every fix made earlier in Phase 3 (the
CORS rewrite, the `AdminOrderSummaryDto` addition, the Specification-based
admin search) held up unchanged in production.

## Phase 3 (continued) — Frontend

### 3.17–3.19 — Cart, checkout, customer order history
- `lib/cart.tsx`: a `CartProvider`/`useCart` context (same pattern as
  Phase 2's `AuthProvider`) — centralizes `GET/POST/DELETE /api/cart*`
  calls with the auth token attached, so `Header`'s cart badge,
  `AddToCartButton`, and the cart page all share one source of truth
  instead of duplicating fetch logic and drifting out of sync.
- `lib/countdown.ts`: `useCountdown(expiresAt)` — client-ticking
  MM:SS, used by `CartLineRow` for the live per-line hold countdown
  (FR-D8).
- `AddToCartButton` (Phase 2 left this inert pending the cart API) now
  actually calls `useCart().addItem`.
- `app/cart/`, `app/checkout/`, `app/checkout/confirm/`,
  `app/orders/`, `app/orders/[id]/`: delivery form, zone/fee
  calculation, payment method choice, Paystack redirect (when
  `authorizationUrl` is present) vs. direct confirmation (cash on
  delivery), order history, order detail with cancellation. The
  `/checkout/confirm` route is exactly the `callback_url` Paystack
  redirects the browser to — it calls `GET /api/checkout/verify`
  itself and forwards to the order detail page (FR-E10: the redirect
  triggers the ask, but the verify call is still what confirms it).

### 3.20 — Admin order management
- `app/admin/orders/`, `app/admin/orders/[id]/`: status-filtered list
  matching FR-H1's exact column set, detail with the picking list and
  a status-stepper + single "Mark as {next}" advance button (mirrors
  the design's one-step-forward button, not a jump-to-any-status
  picker) plus a cancel action.
- **Backend gap found while building this**: `OrderSummaryDto` (built
  for the *customer* order list) doesn't carry customer name/phone/zone/
  payment status — fine for a customer viewing their own orders, but
  FR-H1 explicitly requires all of those for the *admin* list. Added
  `AdminOrderSummaryDto` and extended `OrderService.listForAdmin` to
  batch-fetch payment status per page (same one-extra-query pattern as
  the existing item-count batch, not per-row).

### Deviation: admin section has no shared shell yet
Design has a full sidebar (Dashboard / Products / Orders) wrapping the
whole admin area, but Dashboard and admin Products UI don't exist yet
(dashboard is Phase 4; admin product UI isn't itemized in any phase, per
the earlier "have you built an admin side" conversation — flagged, not
built). Building a sidebar that links to two non-existent pages would
be inventing navigation the design doesn't specify for this state, so
`/admin/orders` stands alone with the regular `Header` for now.

### Real bug found by running the app: CORS on every authenticated route
Registering/logging in worked from the browser back in Phase 2, but the
very first authenticated call (`GET /api/cart`) failed in a real browser
with a CORS error — curl never would have caught this, since curl
doesn't send preflight requests. Root cause: `CorsConfig` was a
`WebMvcConfigurer`, which only applies CORS headers at the MVC dispatch
stage — *after* Spring Security's `authorizeHttpRequests` already runs.
A CORS preflight `OPTIONS` request never carries the `Authorization`
header, so every preflight to an authenticated route (`/api/cart`,
`/api/orders`, `/api/checkout`, ...) was being rejected by
`anyRequest().authenticated()` before the MVC layer ever got a chance to
answer it. Phase 2 never surfaced this because its only client-side
authenticated calls (admin product endpoints) were never exercised from
the browser, only curl.

Fixed by replacing the `WebMvcConfigurer` with a `CorsConfigurationSource`
bean wired directly into `SecurityConfig` via `.cors(cors ->
cors.configurationSource(...))`, so Spring Security's own CORS filter
runs *before* authorization and short-circuits preflight requests
correctly; also explicitly `permitAll` on `OPTIONS /**` as a second,
independent guard. Verified with a raw preflight `curl -X OPTIONS
/api/cart` (200, correct `Access-Control-Allow-*` headers) before
re-running the full browser flow.

### Verification
Full live Playwright run against the real backend (Supabase-backed):
register/login (already covered) → product page → add to cart → cart
page with a real ticking countdown → checkout (cash on delivery) →
`/checkout/confirm`-equivalent redirect to the order detail with the
"Thank you" treatment, cart badge correctly reset to 0 → order history
listing all prior orders with correct statuses → admin login → admin
order list (all + status-filtered) → admin order detail → status
advance (PATCH `200`, stepper and heading updated, verified twice in a
row to confirm it wasn't a one-off) → cancel path exercised earlier in
the backend section. Zero browser console errors across the whole run.
`npx tsc --noEmit` clean, `next build` clean (all routes well under
the 250 KB gzipped budget), `mvn test` 5/5.

## Phase 3 — Holds, checkout, orders (backend)

### 3.1–3.7 — Cart / holds
- `cart/` package: `CartItem` (composite `@EmbeddedId` matching the
  schema's `(user_id, product_id)` PK), `CartItemRepository` mixes normal
  JPA reads with **native** queries for the three schema-critical
  operations (hard rule 4): `SELECT stock_quantity ... FOR UPDATE`,
  the verbatim `INSERT ... ON CONFLICT ... DO UPDATE` hold claim, and the
  sweeper's bulk delete. The `ON CONFLICT` statement's interval is
  parameterised from `CART_HOLD_MINUTES` rather than the schema comment's
  literal `'10 minutes'` — that env var exists specifically to make it
  configurable; flagged before implementing.
- `CartService.addItem`: locks the product row, computes availability as
  `stock_quantity − SUM(other users' live holds)` — deliberately excludes
  the caller's own existing hold, since `ON CONFLICT DO UPDATE` *replaces*
  their line rather than adding to it. Effective cap is `min(available, 5)`;
  exceeding it is a 409 naming the shortfall (FR-D5/D6 read together).
  "Renew hold" isn't a separate endpoint — re-POSTing the same product/qty
  refreshes `expires_at` via the same `ON CONFLICT` claim.
- `GET /api/cart` returns every line including expired-but-unswept ones
  (the design shows "Hold expired · Renew" rather than hiding them) —
  only *other* users' availability excludes a lapsed hold, immediately,
  via the view.
- `CartSweeper`: `@Scheduled` bulk delete, hygiene only (FR-D11) —
  correctness never depends on it running.

### 3.8, 3.13–3.14 — Checkout core, customer orders
- `order/` package: `Order`/`OrderItem`/`OrderStatusHistory`/`Payment`
  entities (exact schema match), `OrderService.placeOrder` — one
  `@Transactional` method: re-validates every hold hasn't expired,
  snapshots delivery fields and item fields onto `orders`/`order_items`,
  runs the exact conditional stock-decrement `UPDATE` per line (409 on
  any zero-row result, rolling back the whole order — not just that
  line), clears the cart. Order numbers are a random 8-char code
  (`AR-XXXXXXXX`, ambiguous characters excluded) with a collision-retry
  loop — no DB sequence needed, so no schema change to propose.
- Customer `GET /api/orders`, `GET /api/orders/{id}` (403 if not the
  owner), `POST /api/orders/{id}/cancel` (PENDING/CONFIRMED only, returns
  stock via an atomic `+` update, same reasoning as the decrement).
- `GET /api/delivery-zones` — not a named objective, same category as
  Phase 2's `/api/catalog/filters`: required plumbing for checkout's zone
  picker.

### 3.9–3.12 — Payment
- `payment/` package: `PaystackService` (`RestClient`-based, mirrors
  `SupabaseStorageClient`'s pattern) — `initialize` (amount in pesewas,
  our own generated reference, `callback_url` built from the new
  `FRONTEND_URL` env var — confirmed before adding it), `verify`
  (FR-E10 — the sole source of truth), `verifySignature` (HMAC-SHA512
  over the *raw* request body, not a re-serialized one).
- `CheckoutService` orchestrates: `OrderService.placeOrder` (the DB
  transaction) happens first and fully commits, *then* the Paystack HTTP
  call happens outside any transaction — an external API call has no
  business holding a DB connection open.
- `PaystackWebhookController`: reads the raw body as a `String`
  specifically so signature verification sees exactly what Paystack sent;
  re-verifies via Paystack's own API using the reference from the
  payload rather than trusting the payload's embedded status (FR-E10's
  spirit applies to the webhook too). `CheckoutService.applyVerification`
  is idempotent — an already-PAID payment short-circuits (FR-E12).
- Cash on delivery: same `placeOrder` path, simply skips the Paystack
  call and leaves `provider_reference` null.

### 3.15–3.16 — Admin orders
- `AdminOrderController`: list (status + date range, paginated), detail
  (full picking list), `PATCH .../status` enforcing the transition table
  in `OrderService` — a `Map<OrderStatus, Set<OrderStatus>>`, DELIVERED
  and CANCELLED terminal, any non-terminal status can move to CANCELLED
  (which also returns stock), everything else illegal → 409. Every
  transition writes `order_status_history`.

### Deviations and real bugs found by running the app, not just reading it
1. Used HTTP `POST .../cancel` rather than `DELETE` for order
   cancellation — `DELETE` would misleadingly imply removing a row, and
   hard rule 6 bans hard deletes system-wide; the verb should say what it
   does even though the underlying operation was never going to delete
   anything.
2. **Startup crash**: `OrderSummaryDto`'s `itemCount` was declared `int`
   but the JPQL constructor expression fed it a correlated-subquery
   `COUNT(...)`, which Hibernate returns as `Long` — "Missing constructor
   for type" at context startup. Fixed the field type; while investigating,
   found the subquery-in-constructor-expression itself also broke
   PostgreSQL's ability to infer types for the *other* bind parameters in
   the same query (`could not determine data type of parameter $3`) —
   the same family of bug as Phase 2's `lower(bytea)` fix, triggered a
   different way. Rewrote as `LEFT JOIN ... GROUP BY` instead of a
   subquery for the customer order list, which resolved it there.
3. The **admin** order list had the identical symptom even after the
   `GROUP BY` rewrite, this time from the `status`/`fromDate`/`toDate`
   optional-filter pattern itself (`(:status IS NULL OR o.status =
   :status)`) — a `cast(... as string)` fix (same pattern that worked for
   Phase 2's search box) got further (app started) but then failed at
   runtime with `cannot cast type bytea to timestamp with time zone`,
   proving the parameter was defaulting to `bytea` *before* the cast ever
   ran. Having now hit this exact PgJDBC/Supavisor class of bug three
   times, stopped patching case-by-case and rewrote admin order search
   using Spring Data JPA Specifications (`OrderSpecifications`) — a
   predicate is only ever added for a filter that's actually present, so
   an absent filter never reaches Postgres as an ambiguous parameter at
   all. Item counts for the resulting page are batched into one extra
   query keyed by order id (not per-row — still no N+1).
4. Local backend startup failures during this session were mostly the
   above real bugs, not transient — the project owner hit them running
   locally too. One later failure (`This connection has been closed` /
   `Unable to determine Dialect`) *was* transient — the Supavisor pooler
   dropped mid-handshake after several rapid restarts — and cleared on
   retry with no code change.

### Verification
Ran the full flow live against Supabase: register/login → add to cart →
409 on requesting more than available → checkout (cash on delivery) →
cart cleared, stock decremented, order visible in customer history →
admin list/detail/status-advance → illegal transition rejected (409) →
**the concurrency proof** (below) → cancellation returns stock → repeat
cancellation rejected (409). `mvn test` still 4/4 after all of the above.

**Concurrency proof.** The cart-hold mechanism's own `FOR UPDATE` guard
already prevents two *different* customers from both holding a product's
last unit — that's correct, intended behavior (FR-D2), not a gap. So the
literal "two browsers, one product, `stock_quantity = 1`" scenario can't
occur through the hold system by design; the guarantee NFR-R2 actually
describes lives at the checkout stock-decrement step. Proved it there
instead: one customer held the sole unit, then two `POST /api/checkout`
calls were fired truly simultaneously (backgrounded, `wait`ed together)
against that single hold.

```
--- RESPONSE 1 ---
{"order":{"orderNumber":"AR-QT7KWVB5","status":"PENDING", ...}}
HTTP_STATUS:201
--- RESPONSE 2 ---
{"error":{"code":"OUT_OF_STOCK","message":"'Concurrency Proof Jeans' sold out while you were checking out."}}
HTTP_STATUS:409
```
```
SELECT stock_quantity FROM products WHERE id = 'adf1fd62-...';
 stock_quantity
----------------
              0
```

## Phase 2 (continued) — Deployment

Pushed, asked the project owner to redeploy both Render and Vercel manually
(neither auto-deploys). Two issues surfaced only once actually live:

1. **Render build failed**: `cannot find symbol: class InvalidCredentialsException`.
   Root cause was nastier than a missing import — `.gitignore` line 6,
   `*credentials*`, had been silently matching `InvalidCredentialsException.java`
   on this Windows checkout (`core.ignorecase` defaults true) since the file
   was first written. It existed on disk, so every local `mvn` build found it
   and every local test passed — git had simply never tracked it, on any
   commit. Render clones fresh from git, so it was the first place the gap
   was visible. Audited the rest of the tracked source tree for the same
   class of problem (found nothing else affected), narrowed the pattern to
   the exact `credentials` filename (redundant with `.env*` anyway for real
   secrets), and verified against a genuinely fresh `git clone` + `mvn package`
   before pushing again — not just `git status`.
2. **Registration failed in the browser with a CORS error**, reported by the
   project owner, even though a direct backend curl and an automated
   Playwright run against `archive233.vercel.app` both succeeded. The error
   named a different origin: `archive233-lqb1k117f-romelalvin7-4492s-projects
   .vercel.app` — a Vercel *preview* deployment URL (fresh random hash per
   deploy), not the stable production domain in `CORS_ALLOWED_ORIGINS`.
   Confirmed with matched `curl -X OPTIONS` calls: the preview origin gets
   403, the production origin gets a proper CORS-approved 200. This is
   NFR-S9 working as intended, not a bug — resolved by pointing the owner at
   `archive233.vercel.app` specifically, not by loosening CORS.

Live-verified post-fix: register, login, and a customer-token 403 on an
admin route, all against the production URLs (transcripts in the
checkpoint). Live screenshots of the deployed catalog (including the
real sold-out product) and product detail match the local ones exactly.

## Phase 2 (continued) — Frontend

### 2.13 — Register, login, token persistence, logout
- Rebuilt `tailwind.config.ts` and `app/layout.tsx` with the corrected
  tokens/fonts (see the design-source correction above): `ink`/`cream`/
  `grey`/`rule`/`signal`/`sold`/`skeleton` colors, Archivo/IBM Plex Mono/
  Instrument Serif via `next/font/google`.
- `lib/api.ts` (fetch wrapper parsing the one error contract into
  `ApiRequestError`), `lib/auth.tsx` (`localStorage`-backed auth context —
  FR-A9 explicitly says "clearing the token client-side," which settles
  the storage question), `lib/types.ts`, `lib/money.ts` (`formatMoney` —
  NFR-U7, pesewas never shown raw).
- `components/Header.tsx`, `components/AuthForm.tsx` (shared by `/login`
  and `/register`, mirroring the design's single toggling screen but as
  two routes for direct linking), `components/AddToCartButton.tsx`
  (FR-C4 only — logged-out click redirects to login and back; a signed-in
  click is deliberately inert, since `POST /api/cart/items` is Phase 3).

### 2.14 — Catalog grid
- `components/FilterBar.tsx`: category/size/brand/condition/price/sort,
  all reflected in the URL query string (FR-B3), reading option lists
  from `GET /api/catalog/filters`.
- `components/ProductGrid.tsx` + `components/ProductCard.tsx`: "Load
  more" pagination (per the project owner's choice over numbered pages,
  since the design has no pagination control at all — flagged before
  building). `app/products/loading.tsx` (skeleton) and
  `app/products/error.tsx` (matches the design's error-state screen) —
  NFR-U2's three list states.

### 2.15–2.16 — Product detail and availability states
- `components/ProductGallery.tsx` (thumbnail strip + hero, client-side
  active-image state), `app/products/[id]/page.tsx`,
  `app/products/[id]/not-found.tsx`.
- Availability rendering ported from the design's own `liveState`/
  `stateLine` logic, driven by the real `AvailabilityStatus` the backend
  computes: available ("N available" / "1 left"), reserved, sold out
  (desaturated, struck-through price, red ribbon) — verified live with a
  real sold-out product, screenshot matches the design pixel-for-pixel.

### Verification
Ran the app for real — backend on :8080, frontend dev server on :3001
(port 3000 was held by an unrelated process on the machine, not killed
without knowing what it was) — and drove it with Playwright (browser
installed fresh; `chromium-cli` wasn't available). `mvn test`: 4/4,
confirmed repeatable by running twice back to back. Full admin →
catalog → detail cycle exercised live, including a real image upload
(see below) and a real sold-out product to check FR-B8's exact visual
treatment.

**Three real bugs found and fixed by actually running the app, not just
reading the code:**

1. **Category filter silently did nothing.** Clicking a filter updated
   the URL correctly but the grid never changed. First suspected the
   Next.js Router Cache and added `next.config.mjs`
   `experimental.staleTimes.dynamic = 0` — that didn't fix it, and in
   hindsight wasn't the real cause (though it's harmless to keep for a
   fully dynamic, `cache: "no-store"` page). The actual bug: `ProductGrid`
   seeded its list with `useState(initial)`, and since the component
   never unmounted across client-side filter navigations, React kept the
   *first* render's data forever, ignoring every fresh `initial` prop
   from the server. Fixed by giving it `key={params.toString()}` in
   `app/products/page.tsx` so it remounts — and resets its state — on
   every filter/sort/search change.
2. **Image upload 400'd** on a hand-crafted minimal test PNG —
   Thumbnailator threw on the degenerate 2×2 image. Not a real bug (a
   normal photograph uploads fine, verified with a real 200×200 PNG,
   both derivatives landed in Supabase Storage and are publicly
   fetchable, well under NFR-P3's size budgets), but added proper
   exception logging in `ProductImageService` since the original code
   silently swallowed the real cause.
3. **Register failed with a CORS error** in an actual browser (curl
   never would have caught this — CORS is browser-enforced). The dev
   server grabbed port 3001 because something unrelated already held
   3000, but `CORS_ALLOWED_ORIGINS` only listed 3000. Added 3001
   alongside it in `backend/.env` — confirmed with the project owner
   before editing, same as prior `.env` changes.

Root domain redirect updated: `app/page.tsx` now redirects `/` →
`/products` (was the Phase 1 health-check proof page, superseded now
that the real storefront exists).

## Phase 2 — Auth and catalog

**Design-source correction (before any UI work):** Phase 1's `tailwind.config.ts`
was built from the wrong file — `docs/design/.../_ds/industry-.../` is an
unrelated, unused design system left over in the same Claude Design project.
The actual approved design is `docs/design/app-refinement-feedback/project/
Archive 233.dc.html`, a complete interactive prototype with its own
self-contained palette (ink `#12100E`, cream `#FAF9F6`, grey `#8C877D`, rule
`#E4E1DA`, signal `#B23A20`) and type system (Archivo / IBM Plex Mono /
Instrument Serif). Confirmed with the project owner before rebuilding tokens.

### 2.1–2.5 — User, auth, error contract
- `user/` package: `User` entity (exact match to `users`), `Role` enum,
  `UserRepository`. `BCryptPasswordEncoder(10)` bean in `SecurityConfig`.
- `error/` package: `ApiException` + three concrete subclasses
  (`DuplicateEmailException` 409, `NotFoundException` 404,
  `InvalidCredentialsException` 401), `ApiError`/`ErrorResponse` records,
  `GlobalExceptionHandler` (`@RestControllerAdvice`) covering bean
  validation, type-mismatch path variables, oversized uploads, Spring
  Security's `AccessDeniedException`, and a sanitized catch-all.
- `auth/` package: `JwtService` (io.jsonwebtoken 0.12.6 — new dependency,
  HMAC-signed, secret/expiry from env), `JwtAuthenticationFilter`,
  `RegisterRequest`/`LoginRequest`/`AuthResponse` DTOs, `AuthService`,
  `AuthController` (`POST /api/auth/register`, `POST /api/auth/login`).
- `SecurityConfig` rewritten: stateless, `@EnableMethodSecurity`, JWT filter,
  public routes permitted by URL, everything else `authenticated()` with
  role gates via `@PreAuthorize` on individual controller methods (hard
  rule 9 — per resource, not per route).

**Deviation found and fixed:** an admin route hit with **no** token returned
a bare, bodyless 403 — Spring Security's `AuthorizationFilter` rejects
unauthenticated requests before they ever reach Spring MVC, so
`GlobalExceptionHandler` never saw it. Added `RestAuthenticationEntryPoint`
(401, code `UNAUTHENTICATED`) and `RestAccessDeniedHandler` (403, code
`FORBIDDEN`) wired into the filter chain's `exceptionHandling()`, so every
401/403 — filter-level or `@PreAuthorize`-level — now returns the one error
contract.

### 2.6–2.9 — Catalog read path
- `catalog/` package: `SizeGroup`/`ProductCondition`/`ProductStatus`/
  `AvailabilityStatus` enums, `Category`/`SizeOption`/`Product`/
  `ProductImage` entities (exact match to schema), `ProductAvailability` —
  a read-only `@Immutable` mapping of the `product_availability` view.
- `ProductRepository.search(...)`: one JPQL query joins category, the
  primary image (`ON pi.position = 0`, not a fetch-joined collection —
  avoids the classic pagination/fetch-join multiplication problem) and the
  availability view; Spring Data supplies the count query only when
  needed. Verified live with `spring.jpa.show-sql=true`: exactly one
  `Hibernate:` statement per listing call regardless of row count — no N+1
  (NFR-P5).
- `ProductController` (`GET /api/products`, `GET /api/products/{id}`),
  `CatalogController` (`GET /api/catalog/filters` — categories, distinct
  published brands/sizes, all condition values) to support the frontend
  filter bar; not a named objective but required by 2.14.

**Deviation found and fixed:** the catalog query 500'd with `ERROR:
function lower(bytea) does not exist` whenever the free-text search
parameter was null — a PgJDBC quirk where a null-valued bind parameter used
only inside a function call (`lower(?)`) can't be type-inferred and
defaults to `bytea`. Fixed with an explicit `cast(:query as string)`.

### 2.10–2.11 — Admin writes
- `ProductRequest` DTO, `AdminProductController` (`@PreAuthorize
  hasRole('ADMIN')`): create, full update, `PATCH .../archive`. No delete
  endpoint exists — hard-delete is structurally impossible via this API.
  Server-side validates the category exists and the size label is one of
  that category's actual `size_options` (real enforcement of FR-G8, not
  just a frontend dropdown).
- `storage/` package: `ImageMagicBytes` (JPEG/PNG/WebP signature check —
  FR-G6, ignores declared content-type entirely), `SupabaseStorageClient`
  (REST upload via `RestClient`, service-role key server-side only).
  `ProductImageService`: caps at 6 images/product, derives exactly two
  JPEG derivatives per upload (1600px display, 400px thumbnail) via
  `net.coobird:thumbnailator` (new dependency) — re-encoding through it
  also strips EXIF (NFR-S11) after applying orientation correction, and
  discards the original entirely (FR-G7).

### 2.12 — Seed data
- `db/02_seed.sql`: 5 categories, 18 size options, 5 delivery zones, one
  admin user. Proposed to the project owner before running; applied to
  both local Docker Postgres and Supabase. Admin credentials shared
  out-of-band, not committed.

### Verification
- `mvn test`: 4/4 passing (register, duplicate-email 409, validation 400,
  wrong-password 401), run twice back-to-back to confirm no test
  pollution — an earlier draft used `TestTransaction.flagForCommit()` to
  force a real commit so a "second" request would see the first, which
  actually leaked two rows into the live Supabase `users` table and broke
  the *next* run. Fixed by relying on Hibernate's auto-flush-before-query
  within the single enclosing `@Transactional` test transaction instead;
  cleaned up the two leaked rows manually.
- Live curl transcripts against the locally-running app (Supabase-backed):
  register, duplicate 409, login, wrong-password 401, admin route with no
  token (401), admin route with a customer token (403), full admin
  create → publish → public-listing → archive → 404 cycle. All match the
  one error contract.

## Phase 1 — Foundation, deployed

### 1.1–1.2 — Docker Compose Postgres
- Added `docker-compose.yml` at repo root: Postgres 16, `db/01_schema.sql` mounted
  read-only to `/docker-entrypoint-initdb.d/`, named volume `archive233_pgdata`.
- `docker compose up -d` created all 11 tables from the schema on first boot.
  `\dt` output captured (see CHECKPOINT 1).

### 1.3 — Supabase schema
- Already applied by the project owner before this session started. Verified
  the project (`hfvfjipofeqydtjvirrr`, region `eu-west-1`) is reachable and
  the app's own `SELECT 1` health check passes against it — see 1.7.

### 1.4–1.7 — Spring Boot skeleton
- `backend/pom.xml`: Spring Boot 3.3.5 parent, Web/Security/Data JPA/Validation
  starters, PostgreSQL driver, `me.paulschwarz:spring-dotenv` (loads
  `backend/.env` into the Spring `Environment` for local runs — Render will
  inject the same variables natively via its dashboard). `maven.compiler`
  release target 21 (LTS), independent of the host JDK.
- `backend/src/main/resources/application.properties`: every value is a
  `${PLACEHOLDER}`; `ddl-auto=validate`, Hikari `maximum-pool-size=5`,
  `spring.main.lazy-initialization=true`, UTC timezone for both JPA/Hibernate
  and Jackson.
- `ArchiveApplication` main class.
- `config/SecurityConfig`: stateless, CSRF disabled, permits all requests for
  now — no auth exists until Phase 2, this just stops Spring Security's
  default login page from blocking the health endpoints.
- `config/CorsConfig`: origins read from `app.cors.allowed-origins`
  (`CORS_ALLOWED_ORIGINS` env var), never a wildcard.
- `health/` package: `HealthController` (HTTP only) → `HealthService`
  (business logic — a call to the repository) → `HealthRepository`
  (the only layer touching the database, via `JdbcTemplate`). `GET
  /api/health` never reaches the repository; `GET /api/health/db` runs a
  real `SELECT 1`.

**Deviation encountered and resolved (see chat for full detail):**
`backend/.env`'s `SPRING_DATASOURCE_URL` was Supabase's default direct
connection string, in two ways incompatible with this setup:
1. It used the bare `postgresql://` scheme; Spring's `DataSourceProperties`
   requires a JDBC URL (`jdbc:postgresql://...`).
2. The direct-connection host (`db.<ref>.supabase.co`) has no IPv4 (A)
   record — only IPv6 (AAAA) — and this network path can't route IPv6,
   producing `UnknownHostException`.

Used the Supabase CLI (owner generated a personal access token and logged
in interactively, since the sandbox has no browser for OAuth) to query the
Management API (`/v1/projects/{ref}/config/database/pooler`) directly,
rather than guessing a pooler hostname. The project's only configured
pooler is Supavisor in **transaction mode**, host
`aws-1-eu-west-1.pooler.supabase.com:6543`, user
`postgres.hfvfjipofeqydtjvirrr`. Switched `SPRING_DATASOURCE_URL`/
`SPRING_DATASOURCE_USERNAME` to that pooler, and — because transaction-mode
pooling doesn't preserve prepared statements across pooled connections —
added `spring.datasource.hikari.data-source-properties.prepareThreshold=0`
to `application.properties`, per PRD risk #6's named mitigation.

Verified: `mvn spring-boot:run` starts cleanly, Hibernate validates the
schema against live Supabase, `GET /api/health` → `200 {"status":"ok"}`,
`GET /api/health/db` → `200 {"status":"ok"}` after a real round-trip query.

### 1.8 — Dockerfile
- `backend/Dockerfile`: multi-stage (`maven:3.9-eclipse-temurin-21` build
  stage → `eclipse-temurin:21-jre-alpine` runtime stage).
- JVM flags: `-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0
  -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Xss512k`. `MaxRAMPercentage=70`
  is the only flag the PRD names explicitly (risk #2, section 9); the rest
  follow standard practice for a 512 MB container (SerialGC and a smaller
  thread stack keep per-thread/GC overhead low at this heap size).
- `ENTRYPOINT` reads `$PORT` at container start via a shell-form command,
  matching `server.port=${PORT:8080}` in `application.properties`.

### 1.10–1.11 — Next.js skeleton and design tokens
- Scaffolded `frontend/` with `create-next-app@14` (TypeScript, Tailwind,
  App Router, ESLint).
- `tailwind.config.ts`: colors, font families, spacing, radius and shadow
  tokens extracted verbatim from
  `docs/design/app-refinement-feedback/project/_ds/industry-.../styles.css`
  (no `STYLE_GUIDE.md` exists in the repo — flagged and confirmed with the
  project owner; this CSS token sheet is the actual source per that folder's
  own `readme.md`). No component classes ported — Phase 1 is tokens only, no
  screens beyond the health-check page.
- `app/layout.tsx`: Barlow / Barlow Condensed loaded via `next/font/google`
  at the weights the design specifies, wired to the `font-body`/`font-heading`
  Tailwind tokens. Removed the scaffold's unused Geist font files.
- `app/page.tsx`: server component, fetches `NEXT_PUBLIC_API_URL + /api/health`
  with `cache: "no-store"`, renders the raw JSON or an error string. No other
  UI.

### 1.14 — CORS
- Done as part of 1.4–1.7 (`CorsConfig`, above).

### 1.15 — .gitignore
- Found and removed a stray bare `.md` line that would have ignored every
  Markdown file in the repo (`docs/PRD.md`, `docs/OBJECTIVES.md`, this file,
  `CLAUDE.md`, etc.) — flagged to the project owner before removing it.
- `git check-ignore -v backend/.env` output captured (see CHECKPOINT 1).

### 1.16 — first commit and push
- `git init`, verified `git check-ignore -v backend/.env` and
  `frontend/.env.local` both resolve to ignore rules before staging anything.
- Removed a nested `.git` directory `create-next-app` had initialized inside
  `frontend/` (would otherwise be tracked as a broken submodule reference).
- Caught and removed `backend/supabase/.temp/` before staging — leftover
  local cache from the Supabase CLI diagnostic session above (no credentials
  in it, just project ref/hostname, but it doesn't belong in the repo).
  Added `supabase/.temp/` and `supabase/.branches/` to `.gitignore`
  defensively.
- Root commit `639b183`, pushed to `main` on `iamromelalvin7/swe_project3`.

### 1.9 — Render deploy
- Neither Render nor Vercel were actually set up yet, despite the initial
  task framing — walked the project owner through creating both from
  scratch after the push, since Render can't build a repo with no commits.
- Backend deployed as a Docker web service (root directory `backend`,
  Dockerfile auto-detected), env vars copied from `backend/.env` (the
  corrected pooler URL/username). Live at
  https://archive233-backend.onrender.com — both `/api/health` and
  `/api/health/db` verified `200 {"status":"ok"}` in production.

### 1.12–1.13 — Vercel deploy
- First deploy failed: `Error: No Output Directory named "public" found`.
  Root cause was a Vercel project-setting mismatch, not a code issue —
  Framework Preset had reverted to "Other" (expects a static `public/`
  build) instead of "Next.js" (outputs to `.next/`) after the Root
  Directory was changed to `frontend`. Fixed in Vercel's dashboard
  (Framework Preset → Next.js) and redeployed with no code changes.
- Second snag: the deployment URL returned a 302 to `vercel.com/sso-api` —
  Vercel's Deployment Protection (SSO wall) was on by default for the
  team-scoped project, which would have blocked public/grader access.
  Disabled it in Project Settings.
- Live at https://archive233.vercel.app — confirmed server-rendering the
  live `{"status":"ok"}` fetched from the Render backend.
- Updated Render's `CORS_ALLOWED_ORIGINS` from the `localhost:3000`
  placeholder to `https://archive233.vercel.app`; verified live via a
  request with an `Origin` header — response reflects that exact origin,
  never `*`.
