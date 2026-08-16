package com.archive233.backend.catalog;

import java.util.UUID;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Read-only mapping of the {@code product_availability} view — hard rule 3:
 * availability is derived, never stored, and this is the single definition,
 * used everywhere. Never written to from application code.
 */
@Entity
@Immutable
@Table(name = "product_availability")
public class ProductAvailability {

    @Id
    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "stock_quantity")
    private int stockQuantity;

    @Column(name = "held_quantity")
    private long heldQuantity;

    @Column(name = "available_quantity")
    private long availableQuantity;

    protected ProductAvailability() {
    }

    public UUID getProductId() {
        return productId;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public long getHeldQuantity() {
        return heldQuantity;
    }

    public long getAvailableQuantity() {
        return availableQuantity;
    }
}
