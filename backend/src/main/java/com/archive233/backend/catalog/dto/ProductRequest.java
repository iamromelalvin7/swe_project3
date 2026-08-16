package com.archive233.backend.catalog.dto;

import java.util.UUID;

import com.archive233.backend.catalog.ProductCondition;
import com.archive233.backend.catalog.ProductStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ProductRequest(
    @NotBlank @Size(min = 5, max = 120, message = "Title must be between 5 and 120 characters") String title,
    String description,
    @NotNull(message = "Category is required") UUID categoryId,
    @NotBlank(message = "Brand is required") String brand,
    @NotBlank(message = "Size is required") String sizeLabel,
    @NotNull(message = "Condition is required") ProductCondition condition,
    String colour,
    String era,
    String flaws,
    String sizingNotes,
    @NotNull(message = "Price is required") @Positive(message = "Price must be greater than zero") Integer pricePesewas,
    @PositiveOrZero(message = "Quantity cannot be negative") Integer stockQuantity,
    ProductStatus status
) {
}
