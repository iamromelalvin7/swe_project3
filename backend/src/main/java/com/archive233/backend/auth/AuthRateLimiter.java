package com.archive233.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Fixed-window request counter guarding /api/auth/register and
 * /api/auth/login against brute-force and scripted signup abuse. In-memory
 * only — this is a single Render instance (no shared cache to keep
 * consistent), and resetting on redeploy is an acceptable trade for not
 * adding infrastructure for a gap that isn't in the PRD's FR/NFR list.
 */
@Component
public class AuthRateLimiter {

    private final int maxAttempts;
    private final Duration window;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong callCount = new AtomicLong();

    public AuthRateLimiter(
            @Value("${app.rate-limit.auth.max-attempts:5}") int maxAttempts,
            @Value("${app.rate-limit.auth.window-minutes:15}") long windowMinutes) {
        this.maxAttempts = maxAttempts;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    /** Returns true if {@code key} is still within its limit for the current window. */
    public boolean tryAcquire(String key) {
        Instant now = Instant.now();
        Window w = windows.compute(key, (k, existing) ->
            (existing == null || existing.expired(now)) ? new Window(now) : existing);
        int count = w.count.incrementAndGet();

        // Opportunistic sweep so keys (client IPs) that stop sending traffic
        // don't sit in the map forever; exact cadence doesn't matter.
        if (callCount.incrementAndGet() % 200 == 0) {
            windows.entrySet().removeIf(e -> e.getValue().expired(now));
        }

        return count <= maxAttempts;
    }

    private final class Window {
        private final Instant start;
        private final AtomicInteger count = new AtomicInteger();

        Window(Instant start) {
            this.start = start;
        }

        boolean expired(Instant now) {
            return Duration.between(start, now).compareTo(window) >= 0;
        }
    }
}
