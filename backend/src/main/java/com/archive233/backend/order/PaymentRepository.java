package com.archive233.backend.order;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByProviderReference(String providerReference);

    Optional<Payment> findByOrderId(UUID orderId);

    List<Payment> findByOrderIdIn(List<UUID> orderIds);
}
