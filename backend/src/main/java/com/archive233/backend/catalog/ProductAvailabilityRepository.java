package com.archive233.backend.catalog;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductAvailabilityRepository extends JpaRepository<ProductAvailability, UUID> {

    Optional<ProductAvailability> findByProductId(UUID productId);
}
