package com.archive233.backend.order.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.archive233.backend.order.OrderStatus;
import com.archive233.backend.order.PaymentStatus;

/** FR-H1: number, customer, phone, zone, item count, total, payment status, order status. */
public record AdminOrderSummaryDto(
    UUID id,
    String orderNumber,
    String customerName,
    String customerPhone,
    String zoneName,
    long itemCount,
    int totalPesewas,
    PaymentStatus paymentStatus,
    OrderStatus status,
    OffsetDateTime createdAt
) {
}
