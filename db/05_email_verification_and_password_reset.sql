-- ARCHIVE 233 — email verification and password reset
-- PostgreSQL 16
--
-- Two new tables:
--
-- 1. pending_registrations — registration no longer creates a `users` row
--    directly. It stages the submitted details here with a hashed
--    verification code and an expiry, and sends that code by email. The
--    real `users` row is only created once the code is verified
--    (auth/AuthService.verifyEmail). A second registration attempt with the
--    same not-yet-verified email replaces this row (fresh code, reset
--    attempts) rather than erroring — application logic, not a DB trigger.
--
-- 2. password_reset_tokens — "forgot password" issues a random token here
--    (hashed, like the verification code — never store the thing an
--    attacker could use directly), emails a link containing the plain
--    token, and reset-password looks it up by hash, checks expiry and
--    that it hasn't already been used once.
--
-- Both code/token values are hashed (SHA-256, not bcrypt — these are
-- short-lived, high-entropy or attempt-limited secrets, not passwords) so a
-- read of either table alone doesn't hand out anything usable.

CREATE TABLE pending_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name     text NOT NULL,
  phone         text NOT NULL,
  code_hash     text NOT NULL,
  expires_at    timestamptz NOT NULL,
  attempts      int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
