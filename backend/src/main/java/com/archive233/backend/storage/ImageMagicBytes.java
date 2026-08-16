package com.archive233.backend.storage;

import org.springframework.http.MediaType;

/**
 * Identifies an image's real type from its own bytes, never the client's
 * declared content-type (FR-G6 / NFR-S10).
 */
public final class ImageMagicBytes {

    private ImageMagicBytes() {
    }

    public static MediaType detect(byte[] header) {
        if (startsWith(header, 0xFF, 0xD8, 0xFF)) {
            return MediaType.IMAGE_JPEG;
        }
        if (startsWith(header, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return MediaType.IMAGE_PNG;
        }
        if (header.length >= 12
            && startsWith(header, 0x52, 0x49, 0x46, 0x46)
            && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) {
            return new MediaType("image", "webp");
        }
        return null;
    }

    private static boolean startsWith(byte[] header, int... signature) {
        if (header.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((header[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }
}
