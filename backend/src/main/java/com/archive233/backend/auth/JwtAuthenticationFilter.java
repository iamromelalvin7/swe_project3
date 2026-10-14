package com.archive233.backend.auth;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authenticates from the HttpOnly session cookie (the browser) or an
 * {@code Authorization: Bearer} header (scripts and API clients). Requests
 * authenticated by cookie are flagged so {@link CsrfHeaderFilter} can apply
 * its check — a Bearer header can't be attached by a cross-site page, a
 * cookie can.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String VIA_COOKIE_ATTRIBUTE = "archive233.auth.viaCookie";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final AuthCookies authCookies;

    public JwtAuthenticationFilter(JwtService jwtService, AuthCookies authCookies) {
        this.jwtService = jwtService;
        this.authCookies = authCookies;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        String token = null;
        boolean viaCookie = false;
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            token = header.substring(BEARER_PREFIX.length());
        } else {
            token = authCookies.read(request);
            viaCookie = token != null;
        }

        if (token != null) {
            Claims claims = jwtService.parseClaims(token);
            if (claims != null) {
                UUID userId = jwtService.getUserId(claims);
                var authority = new SimpleGrantedAuthority("ROLE_" + jwtService.getRole(claims).name());
                var authentication = new UsernamePasswordAuthenticationToken(userId, null, List.of(authority));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                if (viaCookie) {
                    request.setAttribute(VIA_COOKIE_ATTRIBUTE, Boolean.TRUE);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
