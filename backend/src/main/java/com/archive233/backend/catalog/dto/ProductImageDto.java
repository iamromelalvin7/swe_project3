package com.archive233.backend.catalog.dto;

import java.util.UUID;

public record ProductImageDto(UUID id, String url, String thumbUrl, int position) {
}
