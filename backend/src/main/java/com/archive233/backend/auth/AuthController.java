package com.archive233.backend.auth;

import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.common.MessageResponse;
import com.archive233.backend.error.ApiException;
import com.archive233.backend.user.UserRepository;

import jakarta.validation.Valid;

/**
 * Sign-in endpoints. Successful sign-ins set the HttpOnly session cookie
 * ({@link AuthCookies}) and return only the user's public details — the
 * token itself never appears in a response body.
 *
 * Each endpoint that names an email is also limited per email address, on
 * top of {@link AuthRateLimitFilter}'s per-IP limit: that stops one account's
 * password or 6-digit code being guessed from many IPs, and stops a victim's
 * inbox being flooded with codes.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookies authCookies;
    private final AuthRateLimiter rateLimiter;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, AuthCookies authCookies, AuthRateLimiter rateLimiter,
                          UserRepository userRepository) {
        this.authService = authService;
        this.authCookies = authCookies;
        this.rateLimiter = rateLimiter;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public MessageResponse register(@Valid @RequestBody RegisterRequest request) {
        limitPerEmail("register", request.email());
        return authService.register(request);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<SessionUser> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        limitPerEmail("verify-email", request.email());
        return signedIn(authService.verifyEmail(request));
    }

    @PostMapping("/resend-code")
    public MessageResponse resendCode(@Valid @RequestBody ResendCodeRequest request) {
        limitPerEmail("resend-code", request.email());
        return authService.resendCode(request);
    }

    @PostMapping("/login")
    public ResponseEntity<SessionUser> login(@Valid @RequestBody LoginRequest request) {
        limitPerEmail("login", request.email());
        return signedIn(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        limitPerEmail("forgot-password", request.email());
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<SessionUser> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return signedIn(authService.resetPassword(request));
    }

    /**
     * Who is signed in, if anyone — lets the frontend restore the session
     * without ever seeing the token. Always 200; {@code user} is omitted when
     * signed out (the app serialises nulls away).
     */
    @GetMapping("/session")
    public SessionResponse session(@AuthenticationPrincipal UUID userId) {
        SessionUser user = userId == null ? null : userRepository.findById(userId)
            .map(u -> new SessionUser(u.getId(), u.getFullName(), u.getEmail(), u.getRole()))
            .orElse(null);
        return new SessionResponse(user);
    }

    public record SessionResponse(SessionUser user) {
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, authCookies.clear().toString())
            .build();
    }

    private ResponseEntity<SessionUser> signedIn(AuthResponse auth) {
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, authCookies.issue(auth.token()).toString())
            .body(SessionUser.from(auth));
    }

    private void limitPerEmail(String action, String email) {
        String key = "email|" + action + "|" + (email == null ? "" : email.trim().toLowerCase(Locale.ROOT));
        if (!rateLimiter.tryAcquire(key)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "Too many attempts. Try again later.");
        }
    }
}
