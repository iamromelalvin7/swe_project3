# Suggestions — logged, not acted on

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

