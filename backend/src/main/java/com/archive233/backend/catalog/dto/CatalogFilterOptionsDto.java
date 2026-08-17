package com.archive233.backend.catalog.dto;

import java.util.List;
import java.util.Map;

import com.archive233.backend.catalog.ProductCondition;
import com.archive233.backend.catalog.SizeGroup;

public record CatalogFilterOptionsDto(
    List<CategoryDto> categories,
    List<String> brands,
    List<String> sizes,
    List<ProductCondition> conditions,
    Map<SizeGroup, List<String>> sizeOptionsByGroup
) {
}
