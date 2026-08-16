package com.archive233.backend.cart.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CartLineDto(
    UUID productId,
    String title,
    String brand,
    String sizeLabel,
    int pricePesewas,
    String primaryImageUrl,
    String primaryThumbUrl,
    int quantity,
    OffsetDateTime expiresAt
) {
}
