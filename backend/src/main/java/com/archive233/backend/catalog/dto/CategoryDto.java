package com.archive233.backend.catalog.dto;

import java.util.UUID;

import com.archive233.backend.catalog.SizeGroup;

public record CategoryDto(UUID id, String name, String slug, SizeGroup sizeGroup) {
}
