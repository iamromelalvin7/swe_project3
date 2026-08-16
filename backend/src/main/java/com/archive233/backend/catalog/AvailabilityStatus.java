package com.archive233.backend.catalog;

public enum AvailabilityStatus {
    AVAILABLE,
    RESERVED,
    SOLD_OUT;

    /**
     * Mirrors the CASE expression in ProductRepository's catalog listing
     * query — keep the two in sync if this logic ever changes.
     */
    public static AvailabilityStatus of(int stockQuantity, long availableQuantity) {
        if (stockQuantity == 0) {
            return SOLD_OUT;
        }
        if (availableQuantity == 0) {
            return RESERVED;
        }
        return AVAILABLE;
    }
}
