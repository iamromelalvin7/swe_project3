package com.archive233.backend.catalog.dto;

import java.util.List;
import java.util.UUID;

import com.archive233.backend.catalog.ProductCondition;
import com.archive233.backend.catalog.ProductStatus;

/**
 * The admin single-product view — unlike {@link ProductDetailDto} (the
 * public detail response), this carries {@code categoryId} (needed to
 * preselect the edit form's category dropdown), the raw
 * {@code stockQuantity}, and {@link ProductStatus}, none of which the public
 * endpoint should expose.
 */
public record AdminProductDetailDto(
    UUID id,
    String title,
    String description,
    UUID categoryId,
    String categoryName,
    String brand,
    String sizeLabel,
    ProductCondition condition,
    String colour,
    String era,
    String flaws,
    String sizingNotes,
    int pricePesewas,
    int stockQuantity,
    ProductStatus status,
    List<ProductImageDto> images
) {
}
