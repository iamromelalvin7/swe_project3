-- ARCHIVE 233 — disable Row Level Security on the two tables added by
-- 05_email_verification_and_password_reset.sql
--
-- Same drift as 04_disable_rls.sql: Supabase's own rls_auto_enable() event
-- trigger enabled RLS (zero policies) on both new tables the moment they
-- were created, contradicting the PRD's "RLS deliberately not used"
-- decision (see 04_disable_rls.sql for the full rationale — this project
-- is a three-tier architecture where the backend holds the sole database
-- credential and connects as the table owner, which bypasses RLS anyway,
-- so this has no functional effect; it only brings production's actual
-- posture back in line with what's documented).

ALTER TABLE pending_registrations  DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens  DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Verify after running the above. Expect both rows' rls_enabled = false.
--
--   SELECT relname AS table_name, relrowsecurity AS rls_enabled
--   FROM pg_class
--   WHERE relname IN ('pending_registrations', 'password_reset_tokens');
-- ---------------------------------------------------------------------------
