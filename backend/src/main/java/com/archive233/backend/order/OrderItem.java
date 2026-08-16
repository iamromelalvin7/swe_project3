package com.archive233.backend.order;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Every field here is a snapshot taken at order time — hard rule 5. Never
 * join to products to render a past order; that's exactly what this table
 * exists to avoid.
 */
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_title", nullable = false)
    private String productTitle;

    @Column(name = "product_size", nullable = false)
    private String productSize;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "price_pesewas", nullable = false)
    private int pricePesewas;

    protected OrderItem() {
    }

    public OrderItem(Order order, UUID productId, String productTitle, String productSize, String imageUrl,
                      int quantity, int pricePesewas) {
        this.order = order;
        this.productId = productId;
        this.productTitle = productTitle;
        this.productSize = productSize;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        this.pricePesewas = pricePesewas;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProductId() {
        return productId;
    }

    public String getProductTitle() {
        return productTitle;
    }

    public String getProductSize() {
        return productSize;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public int getQuantity() {
        return quantity;
    }

    public int getPricePesewas() {
        return pricePesewas;
    }
}
