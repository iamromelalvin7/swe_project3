# Suggestions — logged, not acted on

- **Objective 4.1 needs ~25 more real product photographs.** Only 15
  photos were available, so only 15 real-photo products exist against
  the PRD's 40. If more real photographs become available before Phase 4
  closes, the same seeding script/pipeline can extend the catalog; if
  not, this should be named explicitly as an accepted gap in the final
  report rather than quietly left implying full seed data.

- **No rate limiting anywhere.** `/api/auth/login` and
  `/api/auth/register` have zero brute-force protection — no lockout, no
  throttling, no CAPTCHA. Not in the PRD's FR/NFR list, so not a spec
  gap, but worth naming in the report rather than leaving implicit.

