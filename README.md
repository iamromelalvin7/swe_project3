<h1 align="center">ARCHIVE 233</h1>

<p align="center">
An online thrift and vintage storefront for a single Ghanaian menswear shop —
CPEN 208 Project 3, University of Ghana, School of Engineering Sciences.
</p>

<p align="center">
  <a href="https://archive233.vercel.app">Live storefront</a> ·
  <a href="https://archive233-backend.onrender.com/api/health">Live API health</a>
</p>

---

## What this is

Secondhand-clothing resellers in Ghana mostly operate over Instagram DMs and
WhatsApp: a photo goes up, the caption names a size and price, and whoever
messages first claims it. That workflow double-sells items, has no catalog
or search, keeps no sales record, and gives buyers no honest signal of what's
actually still available.

ARCHIVE 233 replaces it with a real web application: a browsable catalog with
genuine stock reservation, a checkout that is structurally incapable of
double-selling a unit, and an owner dashboard that tracks every order from
payment to delivery.

This workflow fails in four specific ways:

**Double-selling.** The seller cannot see who claimed an item first when
several messages arrive together. Items get promised to two buyers, and one
is disappointed.

**No catalog.** A buyer looking for a size 34 jean must scroll a
chronological feed. There is no filter, no search, and no way to see what
is currently unsold.

**No record.** The seller reconstructs orders from chat history. Revenue,
stock, and best-selling categories are unknown. Disputes have no evidence.

**No availability signal.** A post from three weeks ago looks identical
whether the item sold the same day or is still available.

## Requirements

The full PRD (`docs/PRD.md`, v1.0, approved).

### Objectives

1. Give the shop owner a single system for listing inventory, tracking
   orders, and fulfilling deliveries.
2. Guarantee that stock can never be oversold, including under simultaneous
   checkout.
3. Give the customer an honest, real-time view of what is available,
   reserved, and sold.
4. Support the payment and delivery norms actually used in Ghana: Mobile
   Money via Paystack, cash on delivery, and zone-based delivery fees in
   Ghana cedis.
5. Demonstrate correct layered architecture, relational design, and REST
   API practice for CPEN 208 assessment.

### Users

| Role | Description | Access |
|---|---|---|
| Visitor | Unauthenticated browser | Catalog, product detail, search, filter |
| Customer | Registered buyer | All visitor access plus cart, checkout, order history |
| Admin | The shop owner | Product management, order management, dashboard |

There is exactly one shop. Multi-vendor is explicitly out of scope.

### User stories

**Visitor**
- As a visitor, I want to browse all available items so I can see what the
  shop has.
- As a visitor, I want to filter by category, size, brand, and price so I
  can find things that fit me and my budget.
- As a visitor, I want to see clearly whether an item is available,
  reserved, or sold so I do not waste time on something I cannot buy.
- As a visitor, I want to view full detail and multiple photographs of an
  item before deciding.

**Customer**
- As a customer, I want to register with my name, email, and phone so I
  can buy.
- As a customer, I want adding an item to my cart to actually hold it for
  me, so someone else cannot take it while I am completing checkout.
- As a customer, I want to see how long my hold lasts so I know how much
  time I have.
- As a customer, I want to enter my delivery details and see the delivery
  fee for my area before I pay.
- As a customer, I want to pay by Mobile Money, or choose to pay cash on
  delivery.
- As a customer, I want to see my past orders and their current delivery
  status.

**Admin**
- As the owner, I want to list a new item with photographs, size,
  condition, brand, and price in a single form.
- As the owner, I want to set a quantity greater than one when I have
  several identical pieces, and leave it at one for one-of-a-kind pieces.
- As the owner, I want to save an incomplete listing as a draft and finish
  it later.
- As the owner, I want to list several items in a row without the form
  throwing me back to the dashboard each time.
- As the owner, I want to see every order with the customer's name, phone,
  and full delivery address so I can fulfil it.
- As the owner, I want to advance an order through packing and delivery so
  I know what is outstanding.
- As the owner, I want to see total revenue, orders, items sold, and live
  stock at a glance.

### Functional requirements

Requirement IDs are traceable; test cases reference them. Priority is
MoSCoW: **M** must ship, **S** should ship, **C** could ship if ahead of
schedule.

**A — Authentication and accounts**

| ID | Requirement | Pri |
|---|---|---|
| FR-A1 | A visitor can register with full name, email, phone, and password | M |
| FR-A2 | Passwords are hashed with BCrypt; plaintext is never persisted or logged | M |
| FR-A3 | A registered user can log in and receive a signed JWT | M |
| FR-A4 | The JWT carries user ID and role and expires after a fixed period | M |
| FR-A5 | Each user holds exactly one role: CUSTOMER or ADMIN | M |
| FR-A6 | Admin endpoints reject CUSTOMER tokens with 403 | M |
| FR-A7 | Browsing requires no account; login is required at add-to-cart | M |
| FR-A8 | A user can view and edit name, phone, and default delivery address | S |
| FR-A9 | A user can log out, clearing the token client-side | M |
| FR-A10 | Duplicate email registration returns 409 with a clear message | M |

**B — Catalog and browsing**

| ID | Requirement | Pri |
|---|---|---|
| FR-B1 | The storefront lists PUBLISHED products in a paginated grid | M |
| FR-B2 | Products filter by category, brand, size, condition, and price range | M |
| FR-B3 | Filters combine with AND and are reflected in the URL query string | S |
| FR-B4 | Products sort by newest, price ascending, price descending | M |
| FR-B5 | Free-text search matches product title and brand | S |
| FR-B6 | Each card shows primary image, title, brand, size, price, availability | M |
| FR-B7 | Availability is derived at read time, never stored as a flag | M |
| FR-B8 | Sold-out items stay visible: desaturated, price struck through, SOLD OUT | M |
| FR-B9 | Items with all units held show RESERVED and no add-to-cart control | M |
| FR-B10 | Items with one unit remaining display a "1 LEFT" marker | C |
| FR-B11 | ARCHIVED products are excluded from the storefront but retained in the DB | S |

**C — Product detail**

| ID | Requirement | Pri |
|---|---|---|
| FR-C1 | The product page shows all images in a gallery, primary first | M |
| FR-C2 | It displays title, description, brand, category, size, condition, colour, era, flaws, sizing notes, price | M |
| FR-C3 | It displays currently available quantity | M |
| FR-C4 | Add-to-cart while logged out redirects to login and returns to the product | S |
| FR-C5 | A non-existent or unpublished product returns 404 | M |

**D — Cart and reservation holds**

| ID | Requirement | Pri |
|---|---|---|
| FR-D1 | Adding to cart creates a hold expiring 10 minutes from creation | M |
| FR-D2 | Held units are subtracted from availability for all other users | M |
| FR-D3 | A hold releases on removal, expiry, order cancellation, or checkout completion | M |
| FR-D4 | Expired holds are ignored at read time; correctness never depends on a background job | M |
| FR-D5 | Requesting more than available returns 409 naming the shortfall | M |
| FR-D6 | Line quantity is capped at min(available, 5) | M |
| FR-D7 | A cart holds at most 10 distinct products | M |
| FR-D8 | The cart shows a live countdown per line; the window refreshes when checkout begins | M |
| FR-D9 | A customer can change line quantity or remove a line | M |
| FR-D10 | The cart persists across sessions for the same user | M |
| FR-D11 | A scheduled sweeper deletes lapsed rows for hygiene only | S |

**E — Checkout and payment**

| ID | Requirement | Pri |
|---|---|---|
| FR-E1 | Checkout requires delivery name, phone, address, and zone | M |
| FR-E2 | The delivery fee is read from the selected zone and added to the subtotal | M |
| FR-E3 | Checkout re-validates every hold before creating the order | M |
| FR-E4 | Order creation, stock decrement, and cart clearing run in one transaction | M |
| FR-E5 | Stock decrements via conditional UPDATE with a stock guard; zero rows affected aborts with 409 | M |
| FR-E6 | Item price, title, and image URL are snapshotted onto order_items | M |
| FR-E7 | Delivery name, phone, address, zone name, and fee are snapshotted onto orders | M |
| FR-E8 | Each order receives a human-readable unique order number | M |
| FR-E9 | Paystack is initialised with the total in pesewas and a unique reference | M |
| FR-E10 | Payment is confirmed only by a server-side verify call, never by the redirect | M |
| FR-E11 | A signature-verified Paystack webhook acts as backstop confirmation | S |
| FR-E12 | Webhook processing is idempotent; repeat events cause no state change | M |
| FR-E13 | Abandoned payment leaves the order PENDING and releases stock after a grace window | S |
| FR-E14 | Cash on delivery is selectable and creates a PENDING order without Paystack | S |

**F — Customer orders**

| ID | Requirement | Pri |
|---|---|---|
| FR-F1 | A customer can list their own orders, newest first | M |
| FR-F2 | A customer can view one order in full | M |
| FR-F3 | A customer cannot access another customer's order; 403 on attempt | M |
| FR-F4 | A customer can cancel an order while PENDING or CONFIRMED | S |
| FR-F5 | Cancellation returns ordered quantities to stock | M |

**G — Admin product management**

| ID | Requirement | Pri |
|---|---|---|
| FR-G1 | Admin can create a product with title, category, brand, size, condition, price, quantity | M |
| FR-G2 | Quantity is optional at entry and defaults to 1 | M |
| FR-G3 | Admin can save as DRAFT and publish later | M |
| FR-G4 | Admin can upload 1–6 images per product and reorder them; position 1 is primary | M |
| FR-G5 | Images are downscaled and converted to WebP client-side before upload | M |
| FR-G6 | The server validates file type by magic bytes, not the declared content type | M |
| FR-G7 | The server derives a thumbnail and stores exactly two derivatives; originals discarded | M |
| FR-G8 | Size is selected from a per-category option list, never free text | M |
| FR-G9 | Admin can edit any field and adjust stock on an existing product | M |
| FR-G10 | Admin can archive a product, removing it from the storefront without deleting it | M |
| FR-G11 | Products referenced by an order are never hard-deleted | M |
| FR-G12 | "Publish and add another" returns a blank form retaining category and brand | S |

**H — Admin order management**

| ID | Requirement | Pri |
|---|---|---|
| FR-H1 | Admin can list all orders with number, customer, phone, zone, item count, total, payment status, order status | M |
| FR-H2 | Orders filter by status and date range and are paginated | M |
| FR-H3 | Order detail shows the picking list: image, title, size, quantity, price paid | M |
| FR-H4 | Order detail shows delivery name, phone, full address, and zone | M |
| FR-H5 | Admin can advance PENDING to CONFIRMED to PACKED to OUT_FOR_DELIVERY to DELIVERED | M |
| FR-H6 | Any non-terminal status can move to CANCELLED | M |
| FR-H7 | Illegal transitions are rejected with 409 | M |
| FR-H8 | DELIVERED is terminal | M |
| FR-H9 | Status changes are timestamped and retained as history | S |

**I — Admin dashboard**

| ID | Requirement | Pri |
|---|---|---|
| FR-I1 | Dashboard shows total revenue, order count, items sold, live stock count | M |
| FR-I2 | Dashboard shows a count of orders awaiting action | M |
| FR-I3 | Dashboard lists the five most recent orders | S |
| FR-I4 | Dashboard shows sales by category | C |

### Non-functional requirements

**Performance**

| ID | Requirement |
|---|---|
| NFR-P1 | Catalog listing responds under 500 ms server-side at p95 with 500 seeded products |
| NFR-P2 | Storefront initial JS payload under 250 KB gzipped |
| NFR-P3 | Grid thumbnails at most 60 KB; detail images at most 300 KB |
| NFR-P4 | First Contentful Paint under 2.5 s on simulated 4G |
| NFR-P5 | No endpoint issues N+1 queries; listing joins images in one query |
| NFR-P6 | All list endpoints paginate; default 20, maximum 50 |
| NFR-P7 | Indexes exist on every foreign key and every filtered column |

**Security**

| ID | Requirement |
|---|---|
| NFR-S1 | All traffic over HTTPS; no mixed content |
| NFR-S2 | Passwords hashed with BCrypt, cost factor at least 10 |
| NFR-S3 | Every input validated server-side; client validation is convenience only |
| NFR-S4 | All database access parameterised or via JPA; no concatenated SQL |
| NFR-S5 | Authorization checked per resource, not merely per route |
| NFR-S6 | Secrets in environment variables; none committed; none prefixed NEXT_PUBLIC_ |
| NFR-S7 | The Paystack secret key is server-side only |
| NFR-S8 | Webhook signatures verified by HMAC before processing |
| NFR-S9 | CORS restricted to the known frontend origin, never wildcard |
| NFR-S10 | Uploads restricted by magic-byte type check and size cap |
| NFR-S11 | EXIF stripped from every uploaded image |
| NFR-S12 | Error responses expose no stack traces, SQL, or internal paths |
| NFR-S13 | Primary keys are UUIDs, not sequential integers |

**Reliability and data integrity**

| ID | Requirement |
|---|---|
| NFR-R1 | Stock can never go negative; enforced by a CHECK constraint |
| NFR-R2 | Concurrent checkout on the last unit yields exactly one success and one 409 |
| NFR-R3 | Money stored as integer pesewas; floating point never used for currency |
| NFR-R4 | Orders are immutable historical records; snapshots never re-derive from live tables |
| NFR-R5 | Sold inventory is archived, never deleted |
| NFR-R6 | All timestamps timestamptz, stored UTC, displayed GMT |
| NFR-R7 | Every write spanning more than one table runs in a transaction |
| NFR-R8 | System state stays correct if the scheduled sweeper never runs |
| NFR-R9 | Database backup exported via pg_dump and committed to the repository |

**Usability**

| ID | Requirement |
|---|---|
| NFR-U1 | Fully responsive from 360 px upward; designed mobile-first |
| NFR-U2 | Every list defines a loading, empty, and error state |
| NFR-U3 | Validation errors appear inline beside the offending field |
| NFR-U4 | Every destructive action requires confirmation |
| NFR-U5 | Text contrast meets WCAG AA |
| NFR-U6 | Every interactive control is keyboard reachable with visible focus |
| NFR-U7 | Prices display as GH₵ 380.00 throughout; never raw pesewas |

**Maintainability**

| ID | Requirement |
|---|---|
| NFR-M1 | Strict layering: controller, service, repository. Controllers hold no business logic; services hold no SQL |
| NFR-M2 | One error contract across every endpoint: code, message, optional fields |
| NFR-M3 | HTTP status codes used honestly; never 200 with an error body |
| NFR-M4 | Schema owned by SQL migration files; Hibernate set to ddl-auto=validate |
| NFR-M5 | Conventional commits; never "wip", "fix", or "update" |
| NFR-M6 | README documents local setup, environment variables, and how to run |

**Deployment**

| ID | Requirement |
|---|---|
| NFR-D1 | The local environment runs fully offline via Docker Compose Postgres |
| NFR-D2 | The backend is containerised with JVM flags tuned for a 512 MB instance |
| NFR-D3 | Frontend and backend are deployed and reachable from day one |
| NFR-D4 | Cold-start mitigation via scheduled health-check pings before demo week |
| NFR-D5 | No hardcoded URLs; everything environment-driven |

### Out of scope

Not built. Each appears in the graded report's Conclusion as future work:

Multi-vendor sellers · product reviews and ratings · email or SMS
notifications · password reset by email · returns and refunds workflow ·
delivery tracking integration · social login · bulk CSV import ·
real-time inventory push over WebSocket.

**Gated stretch queue** — touched only after every M-priority requirement
passes, the app is deployed and reachable, and the report is drafted
through the Technologies section. Ranked by value per hour:

| # | Item | Est. |
|---|---|---|
| 1 | Dashboard analytics: sales by category, revenue over time, top brands | 3 h |
| 2 | Order status history timeline | 2 h |
| 3 | Wishlist / saved items | 3 h |
| 4 | Discount codes | 5 h |

### Technical stack and rationale

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind | Course requirement; server components reduce client JS |
| Backend | Java Spring Boot, Spring Security, Spring Data JPA | Course requirement |
| Database | PostgreSQL 16 | Course requirement |
| DB hosting | Supabase (Postgres only) | Managed Postgres, free tier, pg_dump compatible |
| Local DB | Docker Compose Postgres 16 | Offline development; identical schema for both members |
| Object storage | Supabase Storage, bucket `product-images` (public) | Images live outside the database |
| Auth | Hand-rolled JWT in Spring Security | One auth system only; Supabase Auth deliberately unused |
| Payments | Paystack (test mode) | Ghana-native, GHS, amounts in pesewas |
| Frontend hosting | Vercel | First-class Next.js support, no adapter risk |
| Backend hosting | Render (Docker web service) | Free tier, container control for JVM tuning |
| Uptime | cron-job.org pinging `/api/health` | Mitigates free-tier spin-down before demo week |

**Architectural decisions worth defending in the report:**

**Row Level Security is deliberately not used.** RLS is the correct control
when a browser holds a database credential and talks to Postgres directly.
This is a three-tier architecture: the browser talks only to Spring Boot,
which holds the sole database credential. Authorization is enforced in the
service layer, per resource. Half-implemented RLS would be worse than none.

**Availability is derived, never stored.** There is no `is_available`
column. A product's purchasable quantity is `stock_quantity` minus the sum
of live holds, computed at read time. A lapsed hold falls out of the sum
automatically, so the system reports the truth even when no background
job has run.

**Optimistic concurrency on checkout.** Stock decrements with a conditional
UPDATE guarded by a stock check rather than a read-then-write. Postgres
evaluates the guard and writes atomically, so there is no window between
checking and decrementing.

### Risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Render free tier cold start delays demo | High | High | cron-job.org ping from demo week; JVM startup flags; warm manually 20 min before |
| 2 | Render 512 MB OOM during image processing | Medium | High | Client-side resize before upload; server semaphore of 2; MaxRAMPercentage=70 |
| 3 | Integration day (CORS, JWT, date serialisation) overruns | High | Medium | One endpoint end-to-end deployed on Day 1 against a trivial payload |
| 4 | Report started too late; screenshots require a finished app | High | Medium | Draft sections 1–7 on Day 4; screenshots only on Day 6 |
| 5 | Thin seed data makes the demo look broken | Medium | High | 40 real photographed items with GHS prices before Day 5 |
| 6 | Supabase pooler breaks Hibernate prepared statements | Medium | Medium | Direct connection on 5432, or prepareThreshold=0 |
| 7 | Scope creep back into deferred features | High | Medium | Stretch queue gated; nothing starts until all M requirements pass |
| 8 | Power or connectivity loss blocks work | Medium | High | Full offline dev loop via Docker Compose; cloud is deploy target only |
| 9 | Paystack test-mode behaviour differs from expectation | Low | Medium | Integrate on Day 3, not Day 6; verify test cards against current docs |
| 10 | Inconsistent product photography weakens the light UI | Medium | Medium | Single shoot setup: same wall, light, distance, crop ratio |

### Success criteria

The project is done when:

- Every M-priority functional requirement passes manual test.
- Two browsers checking out the last unit of a product produce one order
  and one 409.
- The app is reachable at its production URLs and completes a full
  purchase there.
- `pg_dump` output and all SQL scripts are committed.
- The PDF report covers all nine required sections in 10–20 pages.
- The repository is public with a README that lets a stranger run it
  locally.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind |
| Backend | Java Spring Boot 3.3.5, Spring Security, Spring Data JPA, Java 21 |
| Database | PostgreSQL 16 — Supabase in production, Docker Compose locally |
| Object storage | Supabase Storage, bucket `product-images` |
| Auth | Hand-rolled JWT — Supabase Auth deliberately unused |
| Payments | Paystack, test mode |
| Hosting | Vercel (frontend), Render Docker web service (backend) |

## Architecture

Strict three-tier: browser → Spring Boot → Postgres. The browser never holds
a database credential, which is why Row Level Security is deliberately not
used — authorization is enforced once, correctly, in the service layer, per
resource rather than per route.

Two decisions worth understanding before reading the code:

- **Availability is derived, never stored.** There is no `is_available`
  column and no `SOLD` status. A product's purchasable quantity is
  `stock_quantity` minus the sum of *live* reservation holds, computed at
  read time by the `product_availability` view in
  [`db/01_schema.sql`](db/01_schema.sql). A lapsed hold falls out of that sum
  automatically — correctness never depends on a background sweeper running.
- **Checkout uses optimistic concurrency, not read-then-write.** Stock
  decrements through one conditional `UPDATE ... WHERE stock_quantity >=
  :qty`. Postgres evaluates the guard and writes atomically, so two
  simultaneous checkouts on the last unit produce exactly one success and one
  `409`, never a double-sell.

Backend layering is strict: controllers handle HTTP and validation only,
services hold business rules, repositories are the only layer that touches
SQL. Every endpoint responds with one error contract:
`{ error: { code, message, fields? } }`.

Backend packages (`backend/src/main/java/com/archive233/backend/`): `auth`,
`user`, `catalog`, `cart`, `order`, `payment`, `delivery`, `storage`, `error`,
`config`, `health`, `common`.

## Repository layout

```
backend/    Spring Boot API
frontend/   Next.js 14 app
db/         schema, seed data, pg_dump backup
docs/       PRD, build objectives, approved frontend design export
logs/       build log and logged-not-acted-on suggestions
```

## Running it locally

Running from a clean checkout, against local Docker Postgres (not Supabase).

### Prerequisites

- Docker Desktop (or Docker Engine + Compose v2) — runs Postgres 16
- Java JDK 21 — `backend/pom.xml` pins `<java.version>21</java.version>`
- Apache Maven 3.9+ (a locally installed `mvn` on PATH) — Spring Boot 3.3.5 parent
- Node.js 18.18+ or 20 LTS, with npm — Next.js 14.2.35 requires Node 18.17+
- A `psql` client, or use `docker exec` into the running Postgres container
  (both are covered below)
- git

Optional, only if you want these specific features to work locally rather
than just start:
- A Supabase project with a Storage bucket named `product-images`, if you
  want product-image upload to actually work (otherwise the app still
  runs; only the upload endpoint fails at request time, not at startup).
- A Paystack test-mode secret key, if you want the Mobile Money checkout
  path to actually work (cash-on-delivery checkout doesn't need this).

### 1. Clone

```bash
git clone https://github.com/iamromelalvin7/swe_project3.git
cd swe_project3
```

### 2. Create `backend/.env`

This file is gitignored — it will never be committed.
`application.properties` reads every one of these from the environment with
no default except where noted, so the app fails to start if a non-defaulted
one is missing (see the [environment variables](#environment-variables)
table below for what each one is for).

```bash
# Database (local Docker Postgres from step 4)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/archive233
SPRING_DATASOURCE_USERNAME=archive233
SPRING_DATASOURCE_PASSWORD=archive233_dev_only

# Auth — any long random string, e.g. `openssl rand -base64 48`
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRY_HOURS=24                     # optional, defaults to 24

# CORS / frontend origin — must match wherever the frontend dev server
# actually runs (Next.js defaults to 3000, but picks 3001+ if 3000 is busy;
# check step 8's terminal output and update this if it differs)
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Supabase Storage — only needed for product-image upload
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=product-images           # optional, this is the default

# Paystack — only needed for the Mobile Money checkout path
PAYSTACK_SECRET_KEY=sk_test_xxx

# Cart hold window
CART_HOLD_MINUTES=10                     # optional, this is the default
```

If you don't have real Supabase/Paystack credentials yet, use any
placeholder string for those three so the app starts — everything except
image upload and Mobile Money payment initialization still works correctly
(catalog, auth, cart holds, cash-on-delivery checkout, admin orders/
dashboard).

### 3. Create `frontend/.env.local`

Also gitignored:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 4. Start local Postgres

```bash
docker compose up -d
```

This starts Postgres 16 in a container named `archive233_db`, publishes
port 5432, and — on first boot only — automatically runs
`db/01_schema.sql` (mounted read-only into `/docker-entrypoint-initdb.d/`),
creating every table.

Verify:

```bash
docker exec -it archive233_db psql -U archive233 -d archive233 -c "\dt"
```

You should see 11 tables (`users`, `categories`, `size_options`, `products`,
`product_images`, `delivery_zones`, `cart_items`, `orders`, `order_items`,
`order_status_history`, `payments`) plus the `product_availability` view
visible with `\dv`.

To start completely over: `docker compose down -v` removes the named volume
too; the next `docker compose up -d` re-runs the schema from scratch.

### 5. Apply seed data

Both files are idempotent — safe to re-run:

```bash
docker exec -i archive233_db psql -U archive233 -d archive233 < db/02_seed.sql
docker exec -i archive233_db psql -U archive233 -d archive233 < db/03_seed_orders.sql
```

`db/02_seed.sql` creates 5 categories, 18 size options, 5 delivery zones,
and one seeded admin user (see step 9). `db/03_seed_orders.sql` creates 32
historical orders across every status so the admin dashboard and order list
aren't empty on first run. Neither seeds any live/published products — the
catalog is empty until you add products through the admin UI; the real
catalog was seeded directly against production through the admin API, not
via SQL, so there's no product seed script in this repo.

### 6. Start the backend

```bash
cd backend
mvn spring-boot:run
```

Wait for a clean startup banner with no stack trace. `backend/.env` is
loaded automatically via the `spring-dotenv` dependency already in
`pom.xml` — no need to export the variables yourself.

### 7. Verify the backend

```bash
curl http://localhost:8080/api/health      # expect: {"status":"ok"}
curl http://localhost:8080/api/health/db   # expect: {"status":"ok"} — runs a real SELECT 1
```

If `/api/health/db` fails but `/api/health` succeeds, the backend can't
reach the database — recheck the `SPRING_DATASOURCE_*` values against
step 4's container.

### 8. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Next.js prints the local URL it bound to (normally `http://localhost:3000`).
If it picked a different port because 3000 was already in use, update
`CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` in `backend/.env` to match, and
restart the backend — otherwise every authenticated request from the
browser fails with a CORS error (this exact issue is recorded in
`logs/BUILD_LOG.md`, Phase 2).

### 9. Verify the frontend and log in

Open `http://localhost:3000` — it redirects to `/products` (the catalog),
which will be empty since no products are seeded yet (see step 5).

Seeded administrator login (from `db/02_seed.sql`):

```
Email:    admin@archive233.test
Password: shared with the project owner out-of-band — NOT stored in this
          repository (db/02_seed.sql only contains the bcrypt hash, not
          the plaintext). Ask the project owner (romelalvin7@gmail.com)
          for it directly.
```

If you don't have that password and need a working local admin account,
generate a fresh BCrypt hash (cost factor 10, matching
`BCryptPasswordEncoder(10)` in `SecurityConfig`) for a password of your
choosing and update it locally — do not commit the change:

```bash
docker exec -it archive233_db psql -U archive233 -d archive233 -c \
  "UPDATE users SET password_hash = '<your-new-bcrypt-hash>' WHERE email = 'admin@archive233.test';"
```

Once logged in as admin, use `/admin/products/new` to create and publish
products so the storefront has something to browse.

### 10. Running the backend test suite (optional)

```bash
cd backend
mvn test
```

`AuthApiTest` connects to whatever database `backend/.env` points at, not an
isolated test schema (logged in `logs/SUGGESTIONS.md`). Against a fresh
local database seeded only with the two files above this should pass
cleanly; it has previously failed only against the live Supabase database,
where a real seeded customer email collided with the test's hardcoded
fixture email.

### Environment variables

| Variable | Used for | Required to start? |
|---|---|---|
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | Postgres connection | Yes |
| `JWT_SECRET` | Signs auth tokens | Yes |
| `JWT_EXPIRY_HOURS` | Token lifetime | No — defaults to 24 |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origin (never a wildcard) | Yes |
| `FRONTEND_URL` | Paystack callback URL | Yes |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Product image storage | Yes to start; only image upload fails without a real bucket |
| `SUPABASE_BUCKET` | Storage bucket name | No — defaults to `product-images` |
| `PAYSTACK_SECRET_KEY` | Mobile Money payment initialize/verify | Yes to start; cash-on-delivery works without a real key |
| `CART_HOLD_MINUTES` | Reservation hold window | No — defaults to 10 |
| `NEXT_PUBLIC_API_URL` (frontend) | Backend base URL the browser calls | Yes |

Secrets are never committed and never `NEXT_PUBLIC_`-prefixed on the server
side; both `.env` files are gitignored.

