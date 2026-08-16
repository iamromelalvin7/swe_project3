package com.archive233.backend.order.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.archive233.backend.order.OrderStatus;

public record OrderSummaryDto(
    UUID id,
    String orderNumber,
    OrderStatus status,
    long itemCount,
    int totalPesewas,
    OffsetDateTime createdAt
) {
}
