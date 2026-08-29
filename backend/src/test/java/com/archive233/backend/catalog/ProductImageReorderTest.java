package com.archive233.backend.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.catalog.dto.AdminProductDetailDto;
import com.archive233.backend.catalog.dto.ProductImageDto;
import com.archive233.backend.error.ApiException;

/**
 * Covers ProductService.reorderImages directly (not through MockMvc/HTTP —
 * the controller method is a one-line pass-through) since this is the one
 * genuinely new piece of logic behind the admin edit page's photo-reorder
 * buttons: reassigning `position` from an admin-submitted order, and
 * rejecting anything that isn't exactly the product's current photo set.
 * Never calls ProductImageService, so no real Supabase Storage upload
 * happens — the test attaches ProductImage rows directly, like
 * CartExpiryTest attaches cart rows directly.
 */
@SpringBootTest
@Transactional
class ProductImageReorderTest {

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductService productService;

    private Product newTestProduct(String title) {
        Category category = categoryRepository.findAllByOrderByPositionAsc().get(0);
        Product product = new Product(
            title, null, category, "TestBrand", "M",
            ProductCondition.GOOD, null, null, null, null, 10000, 1);
        product.setStatus(ProductStatus.PUBLISHED);
        return productRepository.save(product);
    }

    @Test
    void reorder_swapsPositionsAndReturnsThemInOrder() {
        Product product = newTestProduct("Reorder Test Item " + UUID.randomUUID());
        product.getImages().add(new ProductImage(product, "https://example.com/a.jpg", "https://example.com/a_thumb.jpg", 0));
        product.getImages().add(new ProductImage(product, "https://example.com/b.jpg", "https://example.com/b_thumb.jpg", 1));
        // save() on an already-persisted Product merges rather than persisting
        // in place, so the generated child ids only exist on the returned
        // (merged) instance — not on the ProductImage objects added above.
        product = productRepository.save(product);
        UUID firstId = product.getImages().get(0).getId();
        UUID secondId = product.getImages().get(1).getId();

        AdminProductDetailDto result = productService.reorderImages(product.getId(), List.of(secondId, firstId));

        List<ProductImageDto> images = result.images();
        assertThat(images).hasSize(2);
        assertThat(images.get(0).id()).isEqualTo(secondId);
        assertThat(images.get(0).position()).isZero();
        assertThat(images.get(1).id()).isEqualTo(firstId);
        assertThat(images.get(1).position()).isEqualTo(1);
    }

    @Test
    void reorder_rejectsAnythingOtherThanExactlyTheExistingSet() {
        Product product = newTestProduct("Reorder Reject Test " + UUID.randomUUID());
        product.getImages().add(new ProductImage(product, "https://example.com/a.jpg", "https://example.com/a_thumb.jpg", 0));
        product = productRepository.save(product);
        UUID productId = product.getId();
        UUID onlyId = product.getImages().get(0).getId();

        UUID unrelatedId = UUID.randomUUID();

        assertThatThrownBy(() -> productService.reorderImages(productId, List.of(unrelatedId)))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("existing photos");

        assertThatThrownBy(() -> productService.reorderImages(productId, List.of(onlyId, unrelatedId)))
            .isInstanceOf(ApiException.class);
    }
}
