package com.archive233.backend.catalog.dto;

import java.util.UUID;

import com.archive233.backend.catalog.AvailabilityStatus;
import com.archive233.backend.catalog.ProductStatus;

/**
 * The admin product list's row shape — unlike {@link ProductSummaryDto}, this
 * carries the raw {@code stockQuantity} and the product's own
 * {@link ProductStatus} (draft/published/archived), neither of which the
 * public catalog should expose.
 */
public record AdminProductSummaryDto(
    UUID id,
    String title,
    String brand,
    String sizeLabel,
    int pricePesewas,
    int stockQuantity,
    String categoryName,
    String primaryImageUrl,
    String primaryThumbUrl,
    long availableQuantity,
    ProductStatus status,
    AvailabilityStatus availability
) {
}
