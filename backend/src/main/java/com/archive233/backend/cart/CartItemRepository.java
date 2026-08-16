package com.archive233.backend.cart;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.archive233.backend.cart.dto.CartLineDto;

public interface CartItemRepository extends JpaRepository<CartItem, CartItemId> {

    /**
     * Every line for the user, expired or not — a lapsed hold stays visible
     * to its own owner ("Hold expired · Renew") until the sweeper clears it;
     * only availability for OTHER users excludes it (the view does that).
     */
    @Query("""
        SELECT new com.archive233.backend.cart.dto.CartLineDto(
            p.id, p.title, p.brand, p.sizeLabel, p.pricePesewas,
            pi.url, pi.thumbUrl, ci.quantity, ci.expiresAt)
        FROM CartItem ci
        JOIN ci.product p
        LEFT JOIN ProductImage pi ON pi.product = p AND pi.position = 0
        WHERE ci.id.userId = :userId
        ORDER BY ci.addedAt ASC
        """)
    List<CartLineDto> findLinesForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(DISTINCT ci.id.productId) FROM CartItem ci WHERE ci.id.userId = :userId AND ci.expiresAt > CURRENT_TIMESTAMP")
    long countLiveDistinctProducts(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.id.userId = :userId")
    void deleteAllForUser(@Param("userId") UUID userId);

    // --- Native queries implementing the schema's reference statements ---
    // (db/01_schema.sql, "REFERENCE" section) — see hard rule 4: these are
    // not rewritten as read-then-write, and the interval is parameterised
    // from CART_HOLD_MINUTES rather than hardcoded, since that env var
    // exists precisely to make it configurable.

    @Query(value = "SELECT stock_quantity FROM products WHERE id = :productId FOR UPDATE", nativeQuery = true)
    Integer lockAndGetStockQuantity(@Param("productId") UUID productId);

    @Query(value = """
        SELECT COALESCE(SUM(quantity), 0) FROM cart_items
        WHERE product_id = :productId AND expires_at > now() AND user_id <> :userId
        """, nativeQuery = true)
    int sumHeldByOtherUsers(@Param("productId") UUID productId, @Param("userId") UUID userId);

    @Modifying
    @Query(value = """
        INSERT INTO cart_items (user_id, product_id, quantity, expires_at)
        VALUES (:userId, :productId, :quantity, now() + (:holdMinutes || ' minutes')::interval)
        ON CONFLICT (user_id, product_id) DO UPDATE
          SET quantity = :quantity, expires_at = now() + (:holdMinutes || ' minutes')::interval
        """, nativeQuery = true)
    void claimHold(@Param("userId") UUID userId, @Param("productId") UUID productId,
                    @Param("quantity") int quantity, @Param("holdMinutes") int holdMinutes);

    @Modifying
    @Query(value = "DELETE FROM cart_items WHERE expires_at < now()", nativeQuery = true)
    int deleteExpired();
}
