package com.archive233.backend.catalog.dto;

import java.util.UUID;

import com.archive233.backend.catalog.AvailabilityStatus;

public record ProductSummaryDto(
    UUID id,
    String title,
    String brand,
    String sizeLabel,
    int pricePesewas,
    String categoryName,
    String primaryImageUrl,
    String primaryThumbUrl,
    long availableQuantity,
    AvailabilityStatus status
) {
}
