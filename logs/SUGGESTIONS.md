# Suggestions — logged, not acted on

- **A few detail (non-list) pages still don't catch fetch errors** —
  `app/admin/orders/[id]/page.tsx` and `app/checkout/page.tsx`'s
  delivery-zone fetch have no `.catch`, so a failed request leaves them
  stuck on their loading state forever with an unhandled rejection in
  the console. Out of 4.4's literal scope (that objective is about
  lists), but the same class of gap fixed there for
  cart/orders/admin-orders/admin-dashboard — worth doing here too.
- **`AuthApiTest` runs against live Supabase, not an isolated test
  schema/database.** It generally works because its fixture emails are
  meant to be fresh, but Phase 4's order-history seed registered a real
  customer (`kojo.mensah@example.com`) that happens to collide with
  `AuthApiTest`'s hardcoded duplicate-email fixture, so that one test now
  fails — not a code bug, but proof the test suite is fragile to
  whatever real data happens to exist in the shared database at run
  time. A proper fix (a dedicated test schema/profile, or `@Transactional`
  rollback across the whole test, or randomized fixture emails) is worth
  doing before this happens again with a less obvious cause.

- **WebP upload support is half-built.** `ImageMagicBytes` (FR-G6)
  correctly recognizes WebP by its file signature and lets it through,
  but `ProductImageService`'s Thumbnailator/`ImageIO`-based resize step
  has no WebP decoder on the classpath, so any real WebP upload 400s with
  a generic "Could not process image." Either add a WebP `ImageIO`
  plugin (e.g. `webp-imageio-core`) so the accepted-format claim is
  actually true, or narrow `ImageMagicBytes`/the admin UI's accepted
  types to JPEG/PNG only so the two don't disagree. Found while seeding
  Phase 4 product photos (`carhartt-vintage-jacket.webp`,
  `pendleton-t.webp`) — worked around by converting those two source
  files to JPEG before upload, app code untouched.
- **Objective 4.1 needs ~25 more real product photographs.** Only 15
  photos were available, so only 15 real-photo products exist against
  the PRD's 40. If more real photographs become available before Phase 4
  closes, the same seeding script/pipeline can extend the catalog; if
  not, this should be named explicitly as an accepted gap in the final
  report rather than quietly left implying full seed data.

