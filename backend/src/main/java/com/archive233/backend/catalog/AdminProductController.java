package com.archive233.backend.catalog;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.archive233.backend.catalog.dto.AdminProductDetailDto;
import com.archive233.backend.catalog.dto.AdminProductSummaryDto;
import com.archive233.backend.catalog.dto.ImageOrderRequest;
import com.archive233.backend.catalog.dto.ProductImageDto;
import com.archive233.backend.catalog.dto.ProductRequest;
import com.archive233.backend.common.PageResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;
    private final ProductImageService productImageService;

    public AdminProductController(ProductService productService, ProductImageService productImageService) {
        this.productService = productService;
        this.productImageService = productImageService;
    }

    @GetMapping
    public PageResponse<AdminProductSummaryDto> list(
        @RequestParam(required = false) ProductStatus status,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return productService.listForAdmin(status, q, page, pageSize);
    }

    @GetMapping("/{id}")
    public AdminProductDetailDto get(@PathVariable UUID id) {
        return productService.getDetailForAdmin(id);
    }

    @PostMapping
    public ResponseEntity<AdminProductDetailDto> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/{id}")
    public AdminProductDetailDto update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PatchMapping("/{id}/archive")
    public AdminProductDetailDto archive(@PathVariable UUID id) {
        return productService.archive(id);
    }

    @PutMapping("/{id}/images/order")
    public AdminProductDetailDto reorderImages(@PathVariable UUID id, @Valid @RequestBody ImageOrderRequest request) {
        return productService.reorderImages(id, request.imageIds());
    }

    @PostMapping("/{id}/images")
    public List<ProductImageDto> uploadImages(@PathVariable UUID id, @RequestParam("files") List<MultipartFile> files) {
        return productImageService.upload(id, files).stream()
            .map(img -> new ProductImageDto(img.getId(), img.getUrl(), img.getThumbUrl(), img.getPosition()))
            .toList();
    }

    @PutMapping("/{id}/images/{imageId}")
    public ProductImageDto replaceImage(@PathVariable UUID id, @PathVariable UUID imageId, @RequestParam("file") MultipartFile file) {
        ProductImage image = productImageService.replace(id, imageId, file);
        return new ProductImageDto(image.getId(), image.getUrl(), image.getThumbUrl(), image.getPosition());
    }
}
