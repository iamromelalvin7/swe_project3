package com.archive233.backend.catalog.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

/** Every existing image id for the product, in the desired display order (index 0 = primary). */
public record ImageOrderRequest(
    @NotEmpty(message = "At least one image id is required") List<UUID> imageIds
) {
}
