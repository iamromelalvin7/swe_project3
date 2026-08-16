package com.archive233.backend.catalog;

import java.util.List;

import org.springframework.stereotype.Service;

import com.archive233.backend.catalog.dto.CatalogFilterOptionsDto;
import com.archive233.backend.catalog.dto.CategoryDto;

@Service
public class CatalogService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public CatalogFilterOptionsDto filterOptions() {
        List<CategoryDto> categories = categoryRepository.findAllByOrderByPositionAsc().stream()
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getSizeGroup()))
            .toList();
        return new CatalogFilterOptionsDto(
            categories,
            productRepository.findDistinctPublishedBrands(),
            productRepository.findDistinctPublishedSizeLabels(),
            List.of(ProductCondition.values())
        );
    }
}
