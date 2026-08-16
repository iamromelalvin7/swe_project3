package com.archive233.backend.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.archive233.backend.user.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtService {

    private static final String ROLE_CLAIM = "role";

    private final SecretKey key;
    private final long expiryHours;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                       @Value("${app.jwt.expiry-hours}") long expiryHours) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiryHours = expiryHours;
    }

    public String generateToken(UUID userId, Role role) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userId.toString())
            .claim(ROLE_CLAIM, role.name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expiryHours * 3600)))
            .signWith(key)
            .compact();
    }

    /**
     * Returns the token's claims, or {@code null} if the token is missing,
     * malformed, expired, or signed with a different key. Callers treat a
     * null result as "unauthenticated" rather than propagating the failure.
     */
    public Claims parseClaims(String token) {
        try {
            return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    public UUID getUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public Role getRole(Claims claims) {
        return Role.valueOf(claims.get(ROLE_CLAIM, String.class));
    }
}
