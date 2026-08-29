package com.archive233.backend.auth;

import java.io.IOException;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.archive233.backend.error.ApiError;
import com.archive233.backend.error.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Throttles the auth endpoints per client IP: register/login (brute-force
 * and signup abuse — not in the PRD's FR/NFR list, built once approved) and
 * verify-email/resend-code/forgot-password/reset-password (added alongside
 * email verification and password reset — verify-email in particular needs
 * this, or the 6-digit code space is only as strong as an unthrottled
 * attacker's patience). Runs at the security-filter level, like
 * {@link JwtAuthenticationFilter}, so a throttled request never reaches a
 * controller and still gets the one error contract (hard rule 11) rather
 * than a bodyless response.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> GUARDED_PATHS = Set.of(
        "/api/auth/register",
        "/api/auth/verify-email",
        "/api/auth/resend-code",
        "/api/auth/login",
        "/api/auth/forgot-password",
        "/api/auth/reset-password"
    );

    private final AuthRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public AuthRateLimitFilter(AuthRateLimiter rateLimiter, ObjectMapper objectMapper) {
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean guarded = "POST".equalsIgnoreCase(request.getMethod()) && GUARDED_PATHS.contains(request.getRequestURI());

        if (guarded && !rateLimiter.tryAcquire(request.getRequestURI() + "|" + clientIp(request))) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(),
                ErrorResponse.of(new ApiError("RATE_LIMITED", "Too many attempts. Try again later.")));
            return;
        }

        chain.doFilter(request, response);
    }

    /** Render terminates TLS in front of the app, so the real client IP is in this header, not getRemoteAddr(). */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
