package com.archive233.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Fixed-window request counter keyed by an arbitrary string. In-memory only:
 * this app runs as a single Render instance, so there is no shared cache to
 * keep consistent, and counters resetting on redeploy is an accepted trade.
 * Moving to a shared store (e.g. Redis) becomes necessary only if the backend
 * is ever scaled to more than one instance.
 */
public class FixedWindowRateLimiter {

    private final int maxAttempts;
    private final Duration window;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong callCount = new AtomicLong();

    public FixedWindowRateLimiter(int maxAttempts, Duration window) {
        this.maxAttempts = maxAttempts;
        this.window = window;
    }

    /** Returns true if {@code key} is still within its limit for the current window. */
    public boolean tryAcquire(String key) {
        Instant now = Instant.now();
        Window w = windows.compute(key, (k, existing) ->
            (existing == null || existing.expired(now)) ? new Window(now) : existing);
        int count = w.count.incrementAndGet();

        // Opportunistic sweep so keys that stop sending traffic don't sit in
        // the map forever; exact cadence doesn't matter.
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
