package com.archive233.backend.catalog.dto;

import java.util.List;

import com.archive233.backend.catalog.ProductCondition;

public record CatalogFilterOptionsDto(
    List<CategoryDto> categories,
    List<String> brands,
    List<String> sizes,
    List<ProductCondition> conditions
) {
}
