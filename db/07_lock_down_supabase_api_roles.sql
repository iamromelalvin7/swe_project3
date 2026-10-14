-- ARCHIVE 233 — lock Supabase's public API roles out of the database
-- PostgreSQL 16 · written 2026-10-14 · APPLIED to production 2026-10-14.
-- To re-run: Supabase SQL editor (or psql), then the checks at the end.
--
-- Why: 04_disable_rls.sql and 06_disable_rls_new_tables.sql turned Row Level
-- Security OFF on every table, on the reasoning that the browser never talks
-- to Postgres directly. That reasoning holds for this app's own code, but it
-- missed that Supabase also exposes every `public` table through its
-- auto-generated REST API (PostgREST, /rest/v1/*) as the `anon` and
-- `authenticated` roles — and Supabase grants those roles ALL privileges on
-- `public` tables by default. A read-only check of production on 2026-10-14
-- confirmed anon/authenticated held SELECT/INSERT/UPDATE/DELETE/TRUNCATE on
-- all 14 relations (users with password hashes, orders, payments, reset
-- tokens…) with RLS off and no policies: anyone holding the project's anon
-- key could read or wipe the database without going through Spring Boot.
-- RLS being ON (zero policies) had been the only thing denying them.
--
-- What this does (defence in depth — either layer alone blocks the API):
--   1. Revokes every privilege anon/authenticated hold in `public`, and their
--      USAGE on the schema itself.
--   2. Changes default privileges so tables, sequences and functions created
--      later by `postgres` are NOT granted to them again (Supabase's defaults
--      would otherwise re-open each new table).
--   3. Re-enables RLS with no policies (deny-by-default for every non-owner
--      role), matching what Supabase's rls_auto_enable() trigger does anyway.
--
-- Safe for the app: the backend connects as `postgres`, which owns every
-- table and has BYPASSRLS, so none of this changes what Spring Boot can do.
-- Supabase Storage lives in the `storage` schema and is unaffected.
--
-- Supersedes 04_disable_rls.sql and 06_disable_rls_new_tables.sql. Safe to
-- re-run. On a plain local Postgres (Docker), the anon/authenticated roles
-- don't exist, so those steps are skipped and only RLS is enabled.

BEGIN;

DO $$
DECLARE
  api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', api_role);
      EXECUTE format('REVOKE USAGE ON SCHEMA public FROM %I', api_role);
    END IF;
  END LOOP;
END
$$;

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_options           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_registrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens  ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify. Expect: zero rows from the first query, rls = true on every table
-- from the second. The third may still show usage = true: that comes from
-- Postgres's standard PUBLIC grant on the schema, not a grant to these roles,
-- and gives no table access (has_table_privilege is false for both).
--
--   SELECT grantee, table_name FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated');
--
--   SELECT c.relname, c.relrowsecurity AS rls
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1;
--
--   SELECT r, has_schema_privilege(r, 'public', 'USAGE') AS usage
--   FROM unnest(ARRAY['anon', 'authenticated']) r;
--
-- Rollback (only if something unexpected breaks — this re-opens the hole):
--   GRANT USAGE ON SCHEMA public TO anon, authenticated;
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
