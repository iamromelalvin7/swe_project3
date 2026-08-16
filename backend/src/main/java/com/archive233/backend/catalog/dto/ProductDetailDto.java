package com.archive233.backend.catalog.dto;

import java.util.List;
import java.util.UUID;

import com.archive233.backend.catalog.AvailabilityStatus;
import com.archive233.backend.catalog.ProductCondition;

public record ProductDetailDto(
    UUID id,
    String title,
    String description,
    String categoryName,
    String categorySlug,
    String brand,
    String sizeLabel,
    ProductCondition condition,
    String colour,
    String era,
    String flaws,
    String sizingNotes,
    int pricePesewas,
    long availableQuantity,
    AvailabilityStatus status,
    List<ProductImageDto> images
) {
}
