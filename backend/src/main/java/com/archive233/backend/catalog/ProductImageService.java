package com.archive233.backend.catalog;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Semaphore;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.archive233.backend.error.ApiException;
import com.archive233.backend.error.NotFoundException;
import com.archive233.backend.storage.ImageMagicBytes;
import com.archive233.backend.storage.SupabaseStorageClient;

import net.coobird.thumbnailator.Thumbnails;

/**
 * Owns the derivative pipeline for product photography: validate the real
 * file type by magic bytes (FR-G6), derive exactly two derivatives and
 * discard the original (FR-G7) — re-encoding through Thumbnailator also
 * strips EXIF metadata as a side effect (NFR-S11), after first applying any
 * EXIF orientation so photos don't end up sideways.
 */
@Service
public class ProductImageService {

    private static final Logger log = LoggerFactory.getLogger(ProductImageService.class);
    private static final int MAX_IMAGES_PER_PRODUCT = 6;
    private static final int DISPLAY_MAX_DIMENSION = 1600;
    private static final int THUMB_MAX_DIMENSION = 400;

    // PRD risk #2: Render's instance is 512 MB, and decoding+resizing a
    // full-resolution photo is the single most memory-hungry thing this
    // service does. Capping concurrent resize work at 2 is the documented
    // mitigation — without it, several admins uploading photos at once
    // (or a burst of retries) can OOM the whole instance, not just the
    // one request.
    private static final int MAX_CONCURRENT_PROCESSING = 2;
    private final Semaphore processingPermits = new Semaphore(MAX_CONCURRENT_PROCESSING);

    private final ProductRepository productRepository;
    private final SupabaseStorageClient storageClient;

    public ProductImageService(ProductRepository productRepository, SupabaseStorageClient storageClient) {
        this.productRepository = productRepository;
        this.storageClient = storageClient;
    }

    public List<ProductImage> upload(UUID productId, List<MultipartFile> files) {
        Product product = productRepository.findDetailById(productId)
            .orElseThrow(() -> new NotFoundException("Product not found."));

        int existing = product.getImages().size();
        if (existing + files.size() > MAX_IMAGES_PER_PRODUCT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "A product may have at most " + MAX_IMAGES_PER_PRODUCT + " images.");
        }

        int nextPosition = existing;
        for (MultipartFile file : files) {
            byte[] original = readBytes(file);
            MediaType detected = ImageMagicBytes.detect(original);
            if (detected == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "'" + file.getOriginalFilename() + "' is not a supported image type.");
            }

            byte[] display;
            byte[] thumb;
            try {
                processingPermits.acquire();
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "SERVER_BUSY",
                    "The server is busy processing other images. Try again in a moment.");
            }
            try {
                display = resize(original, DISPLAY_MAX_DIMENSION);
                thumb = resize(original, THUMB_MAX_DIMENSION);
            } finally {
                processingPermits.release();
            }

            String baseName = productId + "/" + UUID.randomUUID();
            String displayUrl = storageClient.upload("products/" + baseName + ".jpg", display, MediaType.IMAGE_JPEG);
            String thumbUrl = storageClient.upload("products/" + baseName + "_thumb.jpg", thumb, MediaType.IMAGE_JPEG);

            product.getImages().add(new ProductImage(product, displayUrl, thumbUrl, nextPosition));
            nextPosition++;
        }

        productRepository.save(product);
        return product.getImages();
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Could not read '" + file.getOriginalFilename() + "'.");
        }
    }

    private byte[] resize(byte[] original, int maxDimension) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Thumbnails.of(new ByteArrayInputStream(original))
                .size(maxDimension, maxDimension)
                .outputFormat("jpg")
                .outputQuality(0.85)
                .toOutputStream(out);
            return out.toByteArray();
        } catch (IOException | RuntimeException ex) {
            log.warn("Failed to derive image", ex);
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Could not process image.");
        }
    }
}
