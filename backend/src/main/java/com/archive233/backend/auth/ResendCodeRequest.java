package com.archive233.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendCodeRequest(
    @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email
) {
}
