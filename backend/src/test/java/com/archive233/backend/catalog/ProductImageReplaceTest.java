package com.archive233.backend.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import com.archive233.backend.error.ApiException;
import com.archive233.backend.error.NotFoundException;
import com.archive233.backend.storage.SupabaseStorageClient;

/**
 * Covers ProductImageService.replace — the "re-crop an already-uploaded
 * photo" flow behind the edit page's per-photo Edit button.
 *
 * SupabaseStorageClient is swapped for a hand-written subclass (below)
 * rather than a Mockito @MockBean: Mockito's inline mock maker needs a
 * bytecode-instrumentation agent that isn't compatible with this machine's
 * JDK (26, a preview build — the project itself still targets 21 per
 * pom.xml). A plain subclass overriding the one method that would otherwise
 * make a real network call sidesteps that entirely. The resize pipeline
 * itself (magic-byte check, Thumbnailator decode/re-encode) still runs for
 * real against a genuine in-memory PNG.
 */
@SpringBootTest
@Transactional
class ProductImageReplaceTest {

    @TestConfiguration
    static class FakeStorageConfig {
        @Bean
        @Primary
        SupabaseStorageClient fakeStorageClient() {
            return new SupabaseStorageClient(RestClient.builder(), "https://fake.test", "fake-key", "fake-bucket") {
                private final AtomicInteger callCount = new AtomicInteger();

                @Override
                public String upload(String path, byte[] bytes, MediaType contentType) {
                    return "https://fake.test/replacement-" + callCount.incrementAndGet() + ".jpg";
                }
            };
        }
    }

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductImageService productImageService;

    private static byte[] pngBytes() throws IOException {
        BufferedImage image = new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private Product newTestProductWithOneImage(String title) {
        Category category = categoryRepository.findAllByOrderByPositionAsc().get(0);
        Product product = new Product(
            title, null, category, "TestBrand", "M",
            ProductCondition.GOOD, null, null, null, null, 10000, 1);
        product.setStatus(ProductStatus.PUBLISHED);
        product = productRepository.save(product);
        product.getImages().add(new ProductImage(product, "https://fake.test/original.jpg", "https://fake.test/original_thumb.jpg", 0));
        return productRepository.save(product);
    }

    @Test
    void replace_repointsTheSameRowKeepingIdAndPosition() throws IOException {
        Product product = newTestProductWithOneImage("Replace Test Item " + UUID.randomUUID());
        UUID imageId = product.getImages().get(0).getId();

        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", pngBytes());
        ProductImage result = productImageService.replace(product.getId(), imageId, file);

        assertThat(result.getId()).isEqualTo(imageId);
        assertThat(result.getPosition()).isZero();
        assertThat(result.getUrl()).startsWith("https://fake.test/replacement-");
        assertThat(result.getUrl()).isNotEqualTo("https://fake.test/original.jpg");
    }

    @Test
    void replace_rejectsAnImageIdThatDoesNotBelongToTheProduct() throws IOException {
        Product product = newTestProductWithOneImage("Replace Reject Test " + UUID.randomUUID());
        UUID productId = product.getId();
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", pngBytes());

        assertThatThrownBy(() -> productImageService.replace(productId, UUID.randomUUID(), file))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void replace_rejectsAFileThatIsNotARealImage() {
        Product product = newTestProductWithOneImage("Replace Bad File Test " + UUID.randomUUID());
        UUID productId = product.getId();
        UUID imageId = product.getImages().get(0).getId();
        MockMultipartFile notAnImage = new MockMultipartFile("file", "notes.txt", "text/plain", "hello".getBytes());

        assertThatThrownBy(() -> productImageService.replace(productId, imageId, notAnImage))
            .isInstanceOf(ApiException.class);
    }
}
