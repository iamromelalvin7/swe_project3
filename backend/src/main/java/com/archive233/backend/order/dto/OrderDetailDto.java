package com.archive233.backend.order.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.archive233.backend.order.OrderStatus;
import com.archive233.backend.order.PaymentMethod;

public record OrderDetailDto(
    UUID id,
    String orderNumber,
    OrderStatus status,
    String deliveryName,
    String deliveryPhone,
    String deliveryAddress,
    String deliveryZoneName,
    int deliveryFeePesewas,
    int subtotalPesewas,
    int totalPesewas,
    PaymentMethod paymentMethod,
    List<OrderItemDto> items,
    OffsetDateTime createdAt
) {
}
