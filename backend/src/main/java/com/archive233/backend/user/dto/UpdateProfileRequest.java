package com.archive233.backend.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
    @NotBlank(message = "Full name is required") String fullName,
    @NotBlank(message = "Phone number is required") String phone,
    String defaultAddress
) {
}
