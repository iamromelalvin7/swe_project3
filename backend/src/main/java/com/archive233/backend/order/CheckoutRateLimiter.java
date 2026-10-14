package com.archive233.backend.order;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.archive233.backend.auth.FixedWindowRateLimiter;

/**
 * Limits checkout attempts per signed-in user — each attempt can create an
 * order and initialise a Paystack transaction. Keyed by user, not IP: many
 * Ghanaian mobile customers share one carrier-grade-NAT address, so an IP
 * limit tight enough to matter would block unrelated shoppers.
 */
@Component
public class CheckoutRateLimiter extends FixedWindowRateLimiter {

    public CheckoutRateLimiter(
            @Value("${app.rate-limit.checkout.max-attempts:10}") int maxAttempts,
            @Value("${app.rate-limit.checkout.window-minutes:15}") long windowMinutes) {
        super(maxAttempts, Duration.ofMinutes(windowMinutes));
    }
}
