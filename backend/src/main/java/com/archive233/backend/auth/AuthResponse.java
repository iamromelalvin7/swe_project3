package com.archive233.backend.auth;

import java.util.UUID;

import com.archive233.backend.user.Role;

public record AuthResponse(String token, UUID id, String fullName, String email, Role role) {
}
