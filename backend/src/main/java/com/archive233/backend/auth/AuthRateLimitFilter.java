package com.archive233.backend.auth;

import java.io.IOException;

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
 * Throttles POST /api/auth/register and /api/auth/login per client IP.
 * Not in the PRD's FR/NFR list — a bare-minimum brute-force/signup-abuse
 * guard logged in SUGGESTIONS.md and built once approved. Runs at the
 * security-filter level, like {@link JwtAuthenticationFilter}, so a
 * throttled request never reaches a controller and still gets the one
 * error contract (hard rule 11) rather than a bodyless response.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final AuthRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public AuthRateLimitFilter(AuthRateLimiter rateLimiter, ObjectMapper objectMapper) {
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean guarded = "POST".equalsIgnoreCase(request.getMethod()) && isGuardedPath(request.getRequestURI());

        if (guarded && !rateLimiter.tryAcquire(request.getRequestURI() + "|" + clientIp(request))) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(),
                ErrorResponse.of(new ApiError("RATE_LIMITED", "Too many attempts. Try again later.")));
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isGuardedPath(String uri) {
        return uri.equals("/api/auth/register") || uri.equals("/api/auth/login");
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
