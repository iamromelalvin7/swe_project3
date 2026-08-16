# Build Log

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
