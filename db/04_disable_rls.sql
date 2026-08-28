-- ARCHIVE 233 — disable Row Level Security
-- PostgreSQL 16
--
-- The PRD's own architectural decision is explicit: "Row Level Security is
-- deliberately not used." This is a three-tier architecture — the browser
-- never holds a database credential, it talks only to Spring Boot, which
-- holds the sole database credential and enforces authorization per
-- resource in the service layer (hard rule 9). RLS is the correct control
-- when a browser holds a database credential and talks to Postgres
-- directly; it isn't that here, and a half-implemented policy set would be
-- worse than none.
--
-- Despite that decision, a schema-only pg_dump of production on 2026-08-28
-- (db/backup_production_schema_2026-08-28.sql) showed RLS enabled, with
-- zero policies defined, on all 11 tables below. This was never something
-- this project's own migrations did — it's Supabase's own
-- `rls_auto_enable()` event trigger, which ships on every new Supabase
-- project and auto-enables RLS on any table created in `public`. It had no
-- functional effect (the backend connects as the table owner, which
-- bypasses RLS), but it left production's actual security posture
-- silently out of sync with what this file — and the report — say the
-- posture is.
--
-- This migration brings reality back in line with the documented decision.
-- Note: the event trigger itself is a Supabase platform object, not owned
-- by this project's schema, and isn't touched here — if a future migration
-- adds a new table, it will need this same treatment (or the trigger
-- investigated separately) unless Supabase's own default changes.

ALTER TABLE users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories          DISABLE ROW LEVEL SECURITY;
ALTER TABLE size_options        DISABLE ROW LEVEL SECURITY;
ALTER TABLE products            DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images      DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones      DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items          DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders              DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments            DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Verify after running the above. Expect every row's rls_enabled = false.
--
--   SELECT relname AS table_name, relrowsecurity AS rls_enabled
--   FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
--   ORDER BY relname;
-- ---------------------------------------------------------------------------
