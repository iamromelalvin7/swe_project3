package com.archive233.backend.order.dto;

import com.archive233.backend.order.OrderStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(@NotNull(message = "Status is required") OrderStatus status) {
}
