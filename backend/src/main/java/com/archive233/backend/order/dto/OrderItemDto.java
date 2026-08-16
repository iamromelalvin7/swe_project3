package com.archive233.backend.order.dto;

public record OrderItemDto(String productTitle, String productSize, String imageUrl, int quantity, int pricePesewas) {
}
