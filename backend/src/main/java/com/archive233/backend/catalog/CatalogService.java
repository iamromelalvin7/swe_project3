package com.archive233.backend.catalog;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.archive233.backend.catalog.dto.CatalogFilterOptionsDto;
import com.archive233.backend.catalog.dto.CategoryDto;

@Service
public class CatalogService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final SizeOptionRepository sizeOptionRepository;

    public CatalogService(CategoryRepository categoryRepository, ProductRepository productRepository,
                           SizeOptionRepository sizeOptionRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.sizeOptionRepository = sizeOptionRepository;
    }

    public CatalogFilterOptionsDto filterOptions() {
        List<CategoryDto> categories = categoryRepository.findAllByOrderByPositionAsc().stream()
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getSizeGroup()))
            .toList();

        // Every size actually offerable when listing a product, per size group —
        // not just the sizes that happen to be in use by a published product
        // (findDistinctPublishedSizeLabels), which is the wrong source for an
        // admin picking a size while creating a brand new listing.
        Map<SizeGroup, List<String>> sizeOptionsByGroup = new LinkedHashMap<>();
        for (SizeGroup group : SizeGroup.values()) {
            sizeOptionsByGroup.put(group, sizeOptionRepository.findBySizeGroupOrderByPositionAsc(group).stream()
                .map(SizeOption::getLabel)
                .toList());
        }

        return new CatalogFilterOptionsDto(
            categories,
            productRepository.findDistinctPublishedBrands(),
            productRepository.findDistinctPublishedSizeLabels(),
            List.of(ProductCondition.values()),
            sizeOptionsByGroup
        );
    }
}
