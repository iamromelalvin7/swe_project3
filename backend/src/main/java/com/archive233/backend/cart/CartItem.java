package com.archive233.backend.cart;

import java.time.OffsetDateTime;

import com.archive233.backend.catalog.Product;
import com.archive233.backend.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "cart_items")
public class CartItem {

    @EmbeddedId
    private CartItemId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("productId")
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "added_at", insertable = false, updatable = false)
    private OffsetDateTime addedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    protected CartItem() {
    }

    public CartItemId getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Product getProduct() {
        return product;
    }

    public int getQuantity() {
        return quantity;
    }

    public OffsetDateTime getAddedAt() {
        return addedAt;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }
}
