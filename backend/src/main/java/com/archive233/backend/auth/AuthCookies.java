package com.archive233.backend.auth;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

/**
 * The session lives in an HttpOnly cookie, so page JavaScript (and therefore
 * any injected script) can never read the token — unlike the old
 * localStorage storage. SameSite=Lax keeps it off cross-site POSTs, and
 * {@link CsrfHeaderFilter} adds a second CSRF check on top.
 *
 * The browser reaches the API through the frontend's same-origin proxy
 * (Next.js rewrites /api/* to this backend), so the cookie is first-party to
 * the shop's own domain and isn't affected by third-party-cookie blocking.
 */
@Component
public class AuthCookies {

    public static final String NAME = "a233_session";

    private final boolean secure;
    private final Duration maxAge;

    public AuthCookies(@Value("${app.auth.cookie-secure:true}") boolean secure,
                       @Value("${app.jwt.expiry-hours}") long expiryHours) {
        this.secure = secure;
        this.maxAge = Duration.ofHours(expiryHours);
    }

    public ResponseCookie issue(String token) {
        return base(token).maxAge(maxAge).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(Duration.ZERO).build();
    }

    public String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(NAME, value)
            .httpOnly(true)
            .secure(secure)
            .sameSite("Lax")
            .path("/");
    }
}
