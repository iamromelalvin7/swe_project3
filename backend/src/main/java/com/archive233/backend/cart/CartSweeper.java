package com.archive233.backend.cart;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hygiene only (FR-D11) — deletes lapsed holds so the table doesn't grow
 * unbounded. Correctness never depends on this running: a lapsed row is
 * already excluded from every availability computation at read time
 * (product_availability's WHERE expires_at > now(), and the cart-add
 * guard's sumHeldByOtherUsers) whether or not it has been swept yet.
 */
@Component
public class CartSweeper {

    private static final Logger log = LoggerFactory.getLogger(CartSweeper.class);

    private final CartItemRepository cartItemRepository;

    public CartSweeper(CartItemRepository cartItemRepository) {
        this.cartItemRepository = cartItemRepository;
    }

    @Scheduled(fixedRateString = "${app.cart.sweeper.interval-ms}")
    @Transactional
    public void sweep() {
        int deleted = cartItemRepository.deleteExpired();
        if (deleted > 0) {
            log.info("Cart sweeper removed {} lapsed hold(s)", deleted);
        }
    }
}
