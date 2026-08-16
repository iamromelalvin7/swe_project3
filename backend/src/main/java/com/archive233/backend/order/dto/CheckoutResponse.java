package com.archive233.backend.order.dto;

public record CheckoutResponse(OrderDetailDto order, String authorizationUrl) {
}
