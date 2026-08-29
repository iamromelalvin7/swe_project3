package com.archive233.backend.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Iterator;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;

import org.junit.jupiter.api.Test;

/**
 * Regression test for the WebP upload gap (BUILD_LOG): {@link ImageMagicBytes}
 * recognizes WebP by signature, but that's only honest if ImageIO actually has
 * a decoder for it — otherwise every such upload passes validation and then
 * fails at the resize step with a confusing error. This doesn't decode a real
 * file (no WebP fixture in the repo), but it does prove the exact thing that
 * was missing before {@code imageio-webp} was added to pom.xml: a reader
 * registered for the format at all.
 */
class WebpSupportTest {

    @Test
    void imageIoHasAWebpReader() {
        Iterator<ImageReader> readers = ImageIO.getImageReadersByMIMEType("image/webp");
        assertThat(readers.hasNext())
            .as("expected a WebP ImageReader to be registered via the imageio-webp dependency")
            .isTrue();
    }
}
