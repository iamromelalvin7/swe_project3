package com.archive233.backend.user.dto;

import java.util.UUID;

import com.archive233.backend.user.Role;

public record UserProfileDto(
    UUID id,
    String fullName,
    String email,
    String phone,
    String defaultAddress,
    Role role
) {
}
