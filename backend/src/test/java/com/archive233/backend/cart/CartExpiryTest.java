package com.archive233.backend.cart;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.catalog.Category;
import com.archive233.backend.catalog.CategoryRepository;
import com.archive233.backend.catalog.Product;
import com.archive233.backend.catalog.ProductCondition;
import com.archive233.backend.catalog.ProductRepository;
import com.archive233.backend.catalog.ProductStatus;
import com.archive233.backend.user.Role;
import com.archive233.backend.user.User;
import com.archive233.backend.user.UserRepository;

/**
 * FR-D4 / objective 3.6: correctness never depends on the sweeper. This
 * test never starts it, never waits for it, and never disables it in
 * config — it just proves a lapsed-but-unswept row is already excluded
 * from availability purely by the view's {@code WHERE expires_at > now()}.
 */
@SpringBootTest
@Transactional
class CartExpiryTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private CartItemRepository cartItemRepository;

    @Test
    void lapsedHold_isExcludedFromAvailability_withoutTheSweeperRunning() {
        Category category = categoryRepository.findAllByOrderByPositionAsc().get(0);
        Product product = productRepository.save(new Product(
            "Lazy Expiry Test Item", null, category, "TestBrand", "M",
            ProductCondition.GOOD, null, null, null, null, 10000, 1));
        product.setStatus(ProductStatus.PUBLISHED);
        productRepository.save(product);

        User holder = userRepository.save(new User(
            "lazy-expiry-" + UUID.randomUUID() + "@example.com",
            passwordEncoder.encode("irrelevant"), "Lazy Expiry Tester", "024 000 0000"));

        // Insert a hold that already lapsed — bypassing the app entirely,
        // exactly as if the sweeper had never run and never will.
        jdbcTemplate.update("""
            INSERT INTO cart_items (user_id, product_id, quantity, expires_at)
            VALUES (?, ?, 1, now() - interval '1 minute')
            """, holder.getId(), product.getId());

        Integer available = jdbcTemplate.queryForObject(
            "SELECT available_quantity FROM product_availability WHERE product_id = ?",
            Integer.class, product.getId());

        assertThat(available).isEqualTo(1); // full stock — the lapsed row counts for nothing

        // Also proves the add-to-cart guard (sumHeldByOtherUsers) agrees —
        // a second, different user can claim the full quantity.
        int heldByOthers = cartItemRepository.sumHeldByOtherUsers(product.getId(), UUID.randomUUID());
        assertThat(heldByOthers).isZero();
    }
}
