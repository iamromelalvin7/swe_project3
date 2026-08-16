package com.archive233.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Full name is required") String fullName,
    @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
    @NotBlank(message = "Phone number is required") String phone,
    @NotBlank(message = "Password is required") @Size(min = 8, message = "Password must be at least 8 characters") String password
) {
}
