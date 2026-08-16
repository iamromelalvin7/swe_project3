package com.archive233.backend.order.dto;

import java.util.UUID;

import com.archive233.backend.order.PaymentMethod;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
    @NotBlank(message = "Full name is required") String deliveryName,
    @NotBlank(message = "Phone number is required") String deliveryPhone,
    @NotBlank(message = "Delivery address is required") String deliveryAddress,
    @NotNull(message = "Select a delivery zone") UUID deliveryZoneId,
    @NotNull(message = "Select a payment method") PaymentMethod paymentMethod
) {
}
