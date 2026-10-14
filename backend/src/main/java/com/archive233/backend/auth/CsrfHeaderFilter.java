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
 * CSRF protection for cookie-authenticated requests. Any state-changing
 * request that was authenticated by the session cookie must also carry
 * {@value #HEADER}: {@value #VALUE}. A cross-site page can't add a custom
 * header without a CORS preflight, which this API only grants to the shop's
 * own origins — so a forged request arrives without it and is refused.
 * (The cookie's SameSite=Lax is the first line; this is the second.)
 */
@Component
public class CsrfHeaderFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Archive-Request";
    public static final String VALUE = "1";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final ObjectMapper objectMapper;

    public CsrfHeaderFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean viaCookie = Boolean.TRUE.equals(request.getAttribute(JwtAuthenticationFilter.VIA_COOKIE_ATTRIBUTE));
        boolean unsafe = !SAFE_METHODS.contains(request.getMethod().toUpperCase());
        if (viaCookie && unsafe && !VALUE.equals(request.getHeader(HEADER))) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(),
                ErrorResponse.of(new ApiError("CSRF_REJECTED", "This request was blocked. Reload the page and try again.")));
            return;
        }
        chain.doFilter(request, response);
    }
}
