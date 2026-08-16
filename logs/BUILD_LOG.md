# Build Log

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
