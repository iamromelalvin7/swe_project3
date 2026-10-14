package com.archive233.backend.auth;

import java.util.UUID;

import com.archive233.backend.user.Role;

/** The signed-in user as the browser sees it — never includes the session token. */
public record SessionUser(UUID id, String fullName, String email, Role role) {

    static SessionUser from(AuthResponse auth) {
        return new SessionUser(auth.id(), auth.fullName(), auth.email(), auth.role());
    }
}
