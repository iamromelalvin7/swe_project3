package com.archive233.backend.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, UUID> {

    Optional<PendingRegistration> findByEmail(String email);
}
