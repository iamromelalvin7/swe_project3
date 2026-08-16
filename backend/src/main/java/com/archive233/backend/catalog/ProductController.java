package com.archive233.backend.catalog;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.catalog.dto.ProductDetailDto;
import com.archive233.backend.catalog.dto.ProductSummaryDto;
import com.archive233.backend.common.PageResponse;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public PageResponse<ProductSummaryDto> list(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String brand,
        @RequestParam(required = false) String size,
        @RequestParam(required = false) ProductCondition condition,
        @RequestParam(required = false) Integer minPrice,
        @RequestParam(required = false) Integer maxPrice,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return productService.list(category, brand, size, condition, minPrice, maxPrice, q, sort, page, pageSize);
    }

    @GetMapping("/{id}")
    public ProductDetailDto get(@PathVariable UUID id) {
        return productService.getDetail(id);
    }
}
