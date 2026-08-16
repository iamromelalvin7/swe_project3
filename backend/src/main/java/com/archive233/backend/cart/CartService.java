package com.archive233.backend.cart;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.cart.dto.CartLineDto;
import com.archive233.backend.catalog.Product;
import com.archive233.backend.catalog.ProductRepository;
import com.archive233.backend.catalog.ProductStatus;
import com.archive233.backend.error.ApiException;
import com.archive233.backend.error.NotFoundException;

@Service
public class CartService {

    private static final int MAX_LINE_QUANTITY = 5;
    private static final int MAX_DISTINCT_PRODUCTS = 10;

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final int holdMinutes;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository,
                        @Value("${app.cart.hold-minutes}") int holdMinutes) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.holdMinutes = holdMinutes;
    }

    public List<CartLineDto> getCart(UUID userId) {
        return cartItemRepository.findLinesForUser(userId);
    }

    @Transactional
    public List<CartLineDto> addItem(UUID userId, UUID productId, int requestedQuantity) {
        Product product = productRepository.findById(productId)
            .filter(p -> p.getStatus() == ProductStatus.PUBLISHED)
            .orElseThrow(() -> new NotFoundException("Product not found."));

        boolean isNewLine = !cartItemRepository.existsById(new CartItemId(userId, productId));
        if (isNewLine && cartItemRepository.countLiveDistinctProducts(userId) >= MAX_DISTINCT_PRODUCTS) {
            throw new ApiException(HttpStatus.CONFLICT, "CART_FULL",
                "Your cart already holds " + MAX_DISTINCT_PRODUCTS + " different pieces.");
        }

        // Locks the product row for the rest of this transaction — no other
        // add-to-cart call for this product can compute availability until
        // this one commits or rolls back.
        Integer stockQuantity = cartItemRepository.lockAndGetStockQuantity(productId);
        if (stockQuantity == null) {
            throw new NotFoundException("Product not found.");
        }
        int heldByOthers = cartItemRepository.sumHeldByOtherUsers(productId, userId);
        int available = Math.max(0, stockQuantity - heldByOthers);
        int effectiveMax = Math.min(available, MAX_LINE_QUANTITY);

        if (requestedQuantity > effectiveMax) {
            throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK",
                available == 0 ? "This piece is no longer available." : "Only " + effectiveMax + " available.",
                Map.of("available", String.valueOf(effectiveMax)));
        }

        cartItemRepository.claimHold(userId, productId, requestedQuantity, holdMinutes);
        return getCart(userId);
    }

    public List<CartLineDto> removeItem(UUID userId, UUID productId) {
        cartItemRepository.deleteById(new CartItemId(userId, productId));
        return getCart(userId);
    }
}
