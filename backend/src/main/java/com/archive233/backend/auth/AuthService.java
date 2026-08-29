package com.archive233.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.common.MessageResponse;
import com.archive233.backend.email.ResendEmailClient;
import com.archive233.backend.error.ApiException;
import com.archive233.backend.error.DuplicateEmailException;
import com.archive233.backend.error.InvalidCredentialsException;
import com.archive233.backend.user.User;
import com.archive233.backend.user.UserRepository;

/**
 * Registration no longer creates a {@code users} row directly (hard rule:
 * don't let just anyone type an email and get added to the database) — it
 * stages the details in {@link PendingRegistration} and emails a code;
 * {@link #verifyEmail} is what actually creates the account. Forgot-password
 * follows the equivalent emailed-token pattern via {@link PasswordResetToken}.
 */
@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int CODE_LENGTH = 6;
    private static final int MAX_CODE_ATTEMPTS = 5;
    private static final int RESET_TOKEN_BYTES = 32;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ResendEmailClient emailClient;
    private final int verificationCodeTtlMinutes;
    private final int passwordResetTtlMinutes;
    private final String frontendUrl;

    public AuthService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService,
                        PendingRegistrationRepository pendingRegistrationRepository,
                        PasswordResetTokenRepository passwordResetTokenRepository,
                        ResendEmailClient emailClient,
                        @Value("${app.email.verification-code-ttl-minutes}") int verificationCodeTtlMinutes,
                        @Value("${app.email.password-reset-ttl-minutes}") int passwordResetTtlMinutes,
                        @Value("${app.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailClient = emailClient;
        this.verificationCodeTtlMinutes = verificationCodeTtlMinutes;
        this.passwordResetTtlMinutes = passwordResetTtlMinutes;
        this.frontendUrl = frontendUrl;
    }

    /**
     * Stages the registration and emails a verification code — no
     * {@code users} row exists yet. A second attempt with the same
     * not-yet-verified email replaces the pending row with a fresh code
     * rather than erroring.
     */
    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        String code = generateCode();
        String codeHash = sha256Hex(code);
        OffsetDateTime expiresAt = expiryFromNow(verificationCodeTtlMinutes);
        String passwordHash = passwordEncoder.encode(request.password());

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(request.email()).orElse(null);
        if (pending == null) {
            pending = new PendingRegistration(
                request.email(), passwordHash, request.fullName(), request.phone(), codeHash, expiresAt);
        } else {
            pending.setPasswordHash(passwordHash);
            pending.setFullName(request.fullName());
            pending.setPhone(request.phone());
            pending.setCodeHash(codeHash);
            pending.setExpiresAt(expiresAt);
            pending.setAttempts(0);
        }
        pendingRegistrationRepository.save(pending);

        sendVerificationCodeEmail(request.email(), code);
        return new MessageResponse("Check your email for a verification code.");
    }

    /** The only place a {@code users} row gets created from a self-service registration. */
    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        PendingRegistration pending = pendingRegistrationRepository.findByEmail(request.email())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "No pending registration for that email. Register again."));

        if (pending.getExpiresAt().isBefore(OffsetDateTime.now())) {
            pendingRegistrationRepository.delete(pending);
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "That code has expired. Register again to get a new one.");
        }
        if (pending.getAttempts() >= MAX_CODE_ATTEMPTS) {
            pendingRegistrationRepository.delete(pending);
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Too many incorrect attempts. Register again to get a new code.");
        }
        if (!pending.getCodeHash().equals(sha256Hex(request.code()))) {
            pending.setAttempts(pending.getAttempts() + 1);
            pendingRegistrationRepository.save(pending);
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "That code is incorrect.", Map.of("code", "Incorrect code"));
        }

        // The email might have been claimed by someone else while this one
        // sat unverified — the DB's own UNIQUE(email) is the real guard,
        // this just gives a clean error instead of a raw constraint violation.
        if (userRepository.existsByEmail(pending.getEmail())) {
            pendingRegistrationRepository.delete(pending);
            throw new DuplicateEmailException(pending.getEmail());
        }

        User user = new User(pending.getEmail(), pending.getPasswordHash(), pending.getFullName(), pending.getPhone());
        user = userRepository.save(user);
        pendingRegistrationRepository.delete(pending);
        return toAuthResponse(user);
    }

    @Transactional
    public MessageResponse resendCode(ResendCodeRequest request) {
        pendingRegistrationRepository.findByEmail(request.email()).ifPresent(pending -> {
            String code = generateCode();
            pending.setCodeHash(sha256Hex(code));
            pending.setExpiresAt(expiryFromNow(verificationCodeTtlMinutes));
            pending.setAttempts(0);
            pendingRegistrationRepository.save(pending);
            sendVerificationCodeEmail(request.email(), code);
        });
        // Same response whether or not a pending registration exists for
        // this email — matches forgotPassword's no-enumeration stance.
        return new MessageResponse("If that registration is still pending, a new code was sent.");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return toAuthResponse(user);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            byte[] tokenBytes = new byte[RESET_TOKEN_BYTES];
            RANDOM.nextBytes(tokenBytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
            passwordResetTokenRepository.save(
                new PasswordResetToken(user, sha256Hex(token), expiryFromNow(passwordResetTtlMinutes)));

            String link = frontendUrl + "/reset-password?token=" + token;
            emailClient.send(user.getEmail(), "Reset your Archive 233 password",
                "<p>Reset your password:</p><p><a href=\"" + link + "\">" + link + "</a></p>"
                    + "<p>This link expires in " + passwordResetTtlMinutes + " minutes. "
                    + "If you didn't request this, ignore this email.</p>");
        });
        // Never reveals whether the email has an account — avoids user
        // enumeration via this endpoint.
        return new MessageResponse("If that email has an account, a reset link was sent.");
    }

    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        String tokenHash = sha256Hex(request.token());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "That reset link is invalid or has already been used."));

        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "That reset link is invalid or has expired. Request a new one.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        resetToken.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        return toAuthResponse(user);
    }

    private void sendVerificationCodeEmail(String email, String code) {
        emailClient.send(email, "Your Archive 233 verification code",
            "<p>Your verification code is:</p>"
                + "<p style=\"font-size:24px;font-weight:bold;letter-spacing:4px;\">" + code + "</p>"
                + "<p>It expires in " + verificationCodeTtlMinutes + " minutes.</p>");
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getRole());
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }

    private static OffsetDateTime expiryFromNow(int minutes) {
        return OffsetDateTime.now().plusMinutes(minutes);
    }

    private static String generateCode() {
        int code = RANDOM.nextInt((int) Math.pow(10, CODE_LENGTH));
        return String.format("%0" + CODE_LENGTH + "d", code);
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
