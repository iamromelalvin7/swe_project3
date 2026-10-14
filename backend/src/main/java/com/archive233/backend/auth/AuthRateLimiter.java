package com.archive233.backend.auth;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Limits the auth endpoints. Used with two kinds of key:
 * per client IP (scripted signup abuse, spraying many accounts) by
 * {@link AuthRateLimitFilter}, and per email address (brute-forcing one
 * account's password or 6-digit code from many IPs, and email-bombing a
 * victim with codes) by {@link AuthController}.
 */
@Component
public class AuthRateLimiter extends FixedWindowRateLimiter {

    public AuthRateLimiter(
            @Value("${app.rate-limit.auth.max-attempts:5}") int maxAttempts,
            @Value("${app.rate-limit.auth.window-minutes:15}") long windowMinutes) {
        super(maxAttempts, Duration.ofMinutes(windowMinutes));
    }
}
