package com.archive233.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(
    @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
    @NotBlank(message = "Verification code is required") String code
) {
}
