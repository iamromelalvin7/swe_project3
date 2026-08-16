package com.archive233.backend.delivery;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, UUID> {

    List<DeliveryZone> findByActiveTrueOrderByPositionAsc();

    Optional<DeliveryZone> findByIdAndActiveTrue(UUID id);
}
