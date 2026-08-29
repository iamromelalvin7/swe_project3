package com.archive233.backend.catalog;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.archive233.backend.catalog.dto.AdminProductDetailDto;
import com.archive233.backend.catalog.dto.AdminProductSummaryDto;
import com.archive233.backend.catalog.dto.ProductDetailDto;
import com.archive233.backend.catalog.dto.ProductImageDto;
import com.archive233.backend.catalog.dto.ProductRequest;
import com.archive233.backend.catalog.dto.ProductSummaryDto;
import com.archive233.backend.common.PageResponse;
import com.archive233.backend.error.ApiException;
import com.archive233.backend.error.NotFoundException;

@Service
public class ProductService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 50;

    private final ProductRepository productRepository;
    private final ProductAvailabilityRepository availabilityRepository;
    private final CategoryRepository categoryRepository;
    private final SizeOptionRepository sizeOptionRepository;

    public ProductService(ProductRepository productRepository, ProductAvailabilityRepository availabilityRepository,
                           CategoryRepository categoryRepository, SizeOptionRepository sizeOptionRepository) {
        this.productRepository = productRepository;
        this.availabilityRepository = availabilityRepository;
        this.categoryRepository = categoryRepository;
        this.sizeOptionRepository = sizeOptionRepository;
    }

    public PageResponse<ProductSummaryDto> list(String category, String brand, String size, ProductCondition condition,
                                                 Integer minPrice, Integer maxPrice, String query, String sort,
                                                 int page, Integer pageSize) {
        int size1 = pageSize == null ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
        Sort sortOrder = switch (sort == null ? "newest" : sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "pricePesewas");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "pricePesewas");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        Page<ProductSummaryDto> result = productRepository.search(
            category, brand, size, condition, minPrice, maxPrice, query,
            PageRequest.of(Math.max(page, 0), size1, sortOrder)
        );
        return PageResponse.of(result);
    }

    public ProductDetailDto getDetail(UUID id) {
        Product product = productRepository.findDetailById(id)
            .filter(p -> p.getStatus() == ProductStatus.PUBLISHED)
            .orElseThrow(() -> new NotFoundException("Product not found."));
        return toDetailDto(product);
    }

    public PageResponse<AdminProductSummaryDto> listForAdmin(ProductStatus status, String query, int page, Integer pageSize) {
        int size1 = pageSize == null ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
        Page<AdminProductSummaryDto> result = productRepository.searchForAdmin(
            status, query, PageRequest.of(Math.max(page, 0), size1, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return PageResponse.of(result);
    }

    public AdminProductDetailDto getDetailForAdmin(UUID id) {
        Product product = productRepository.findDetailById(id)
            .orElseThrow(() -> new NotFoundException("Product not found."));
        return toAdminDetailDto(product);
    }

    public AdminProductDetailDto create(ProductRequest request) {
        Category category = requireCategory(request.categoryId());
        requireValidSize(category, request.sizeLabel());

        Product product = new Product(
            request.title(), request.description(), category, request.brand(), request.sizeLabel(),
            request.condition(), request.colour(), request.era(), request.flaws(), request.sizingNotes(),
            request.pricePesewas(), request.stockQuantity() == null ? 1 : request.stockQuantity()
        );
        if (request.status() != null) {
            requireCreatableStatus(request.status());
            product.setStatus(request.status());
        }
        product = productRepository.save(product);
        return getDetailForAdmin(product.getId());
    }

    public AdminProductDetailDto update(UUID id, ProductRequest request) {
        Product product = productRepository.findDetailById(id)
            .orElseThrow(() -> new NotFoundException("Product not found."));
        Category category = requireCategory(request.categoryId());
        requireValidSize(category, request.sizeLabel());

        product.setTitle(request.title());
        product.setDescription(request.description());
        product.setCategory(category);
        product.setBrand(request.brand());
        product.setSizeLabel(request.sizeLabel());
        product.setCondition(request.condition());
        product.setColour(request.colour());
        product.setEra(request.era());
        product.setFlaws(request.flaws());
        product.setSizingNotes(request.sizingNotes());
        product.setPricePesewas(request.pricePesewas());
        if (request.stockQuantity() != null) {
            product.setStockQuantity(request.stockQuantity());
        }
        if (request.status() != null) {
            requireCreatableStatus(request.status());
            product.setStatus(request.status());
        }
        productRepository.save(product);
        return getDetailForAdmin(id);
    }

    public AdminProductDetailDto archive(UUID id) {
        Product product = productRepository.findDetailById(id)
            .orElseThrow(() -> new NotFoundException("Product not found."));
        product.setStatus(ProductStatus.ARCHIVED);
        productRepository.save(product);
        return getDetailForAdmin(id);
    }

    private ProductDetailDto toDetailDto(Product product) {
        ProductAvailability availability = availabilityRepository.findByProductId(product.getId())
            .orElseThrow(() -> new NotFoundException("Product not found."));

        List<ProductImageDto> images = product.getImages().stream()
            .map(img -> new ProductImageDto(img.getUrl(), img.getThumbUrl(), img.getPosition()))
            .toList();

        AvailabilityStatus status = AvailabilityStatus.of(product.getStockQuantity(), availability.getAvailableQuantity());

        return new ProductDetailDto(
            product.getId(),
            product.getTitle(),
            product.getDescription(),
            product.getCategory().getName(),
            product.getCategory().getSlug(),
            product.getBrand(),
            product.getSizeLabel(),
            product.getCondition(),
            product.getColour(),
            product.getEra(),
            product.getFlaws(),
            product.getSizingNotes(),
            product.getPricePesewas(),
            availability.getAvailableQuantity(),
            status,
            images
        );
    }

    private AdminProductDetailDto toAdminDetailDto(Product product) {
        List<ProductImageDto> images = product.getImages().stream()
            .map(img -> new ProductImageDto(img.getUrl(), img.getThumbUrl(), img.getPosition()))
            .toList();

        return new AdminProductDetailDto(
            product.getId(),
            product.getTitle(),
            product.getDescription(),
            product.getCategory().getId(),
            product.getCategory().getName(),
            product.getBrand(),
            product.getSizeLabel(),
            product.getCondition(),
            product.getColour(),
            product.getEra(),
            product.getFlaws(),
            product.getSizingNotes(),
            product.getPricePesewas(),
            product.getStockQuantity(),
            product.getStatus(),
            images
        );
    }

    private Category requireCategory(UUID categoryId) {
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Category does not exist.",
                Map.of("categoryId", "Category does not exist")));
    }

    private void requireValidSize(Category category, String sizeLabel) {
        boolean valid = sizeOptionRepository.findBySizeGroupOrderByPositionAsc(category.getSizeGroup()).stream()
            .anyMatch(opt -> opt.getLabel().equalsIgnoreCase(sizeLabel));
        if (!valid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Size is not valid for this category.",
                Map.of("sizeLabel", "Not a valid size for this category"));
        }
    }

    private void requireCreatableStatus(ProductStatus status) {
        if (status == ProductStatus.ARCHIVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Use the archive endpoint to archive a product.", Map.of("status", "Cannot set ARCHIVED directly"));
        }
    }
}
