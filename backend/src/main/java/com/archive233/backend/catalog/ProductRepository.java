package com.archive233.backend.catalog;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.archive233.backend.catalog.dto.ProductSummaryDto;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    /**
     * One query: category, primary image (position 0) and the live
     * availability view are all joined here — never N+1 (NFR-P5).
     */
    @Query(value = """
        SELECT new com.archive233.backend.catalog.dto.ProductSummaryDto(
            p.id, p.title, p.brand, p.sizeLabel, p.pricePesewas, c.name,
            pi.url, pi.thumbUrl, pa.availableQuantity,
            CASE
              WHEN p.stockQuantity = 0 THEN com.archive233.backend.catalog.AvailabilityStatus.SOLD_OUT
              WHEN pa.availableQuantity = 0 THEN com.archive233.backend.catalog.AvailabilityStatus.RESERVED
              ELSE com.archive233.backend.catalog.AvailabilityStatus.AVAILABLE
            END)
        FROM Product p
        JOIN p.category c
        LEFT JOIN ProductImage pi ON pi.product = p AND pi.position = 0
        JOIN ProductAvailability pa ON pa.productId = p.id
        WHERE p.status = com.archive233.backend.catalog.ProductStatus.PUBLISHED
          AND (:categorySlug IS NULL OR c.slug = :categorySlug)
          AND (:brand IS NULL OR p.brand = :brand)
          AND (:sizeLabel IS NULL OR p.sizeLabel = :sizeLabel)
          AND (:condition IS NULL OR p.condition = :condition)
          AND (:minPrice IS NULL OR p.pricePesewas >= :minPrice)
          AND (:maxPrice IS NULL OR p.pricePesewas <= :maxPrice)
          AND (:query IS NULL OR lower(p.title) LIKE lower(concat('%', cast(:query as string), '%'))
                               OR lower(p.brand) LIKE lower(concat('%', cast(:query as string), '%')))
        """,
        countQuery = """
        SELECT count(p)
        FROM Product p
        JOIN p.category c
        WHERE p.status = com.archive233.backend.catalog.ProductStatus.PUBLISHED
          AND (:categorySlug IS NULL OR c.slug = :categorySlug)
          AND (:brand IS NULL OR p.brand = :brand)
          AND (:sizeLabel IS NULL OR p.sizeLabel = :sizeLabel)
          AND (:condition IS NULL OR p.condition = :condition)
          AND (:minPrice IS NULL OR p.pricePesewas >= :minPrice)
          AND (:maxPrice IS NULL OR p.pricePesewas <= :maxPrice)
          AND (:query IS NULL OR lower(p.title) LIKE lower(concat('%', cast(:query as string), '%'))
                               OR lower(p.brand) LIKE lower(concat('%', cast(:query as string), '%')))
        """)
    Page<ProductSummaryDto> search(
        @Param("categorySlug") String categorySlug,
        @Param("brand") String brand,
        @Param("sizeLabel") String sizeLabel,
        @Param("condition") ProductCondition condition,
        @Param("minPrice") Integer minPrice,
        @Param("maxPrice") Integer maxPrice,
        @Param("query") String query,
        Pageable pageable
    );

    @Query("""
        SELECT p FROM Product p
        JOIN FETCH p.category
        LEFT JOIN FETCH p.images
        WHERE p.id = :id
        """)
    Optional<Product> findDetailById(@Param("id") UUID id);

    @Query("""
        SELECT DISTINCT p.brand FROM Product p
        WHERE p.status = com.archive233.backend.catalog.ProductStatus.PUBLISHED
        ORDER BY p.brand
        """)
    List<String> findDistinctPublishedBrands();

    @Query("""
        SELECT DISTINCT p.sizeLabel FROM Product p
        WHERE p.status = com.archive233.backend.catalog.ProductStatus.PUBLISHED
        ORDER BY p.sizeLabel
        """)
    List<String> findDistinctPublishedSizeLabels();

    @Query("SELECT COALESCE(SUM(p.stockQuantity), 0) FROM Product p WHERE p.status = :status")
    long sumStockQuantityByStatus(@Param("status") ProductStatus status);

    // --- REFERENCE — verbatim from db/01_schema.sql (hard rule 4) ---
    // Optimistic; zero rows affected means someone else won the race.

    @Modifying
    @Query(value = """
        UPDATE products
           SET stock_quantity = stock_quantity - :quantity
         WHERE id = :productId
           AND stock_quantity >= :quantity
        """, nativeQuery = true)
    int decrementStockIfAvailable(@Param("productId") UUID productId, @Param("quantity") int quantity);

    @Modifying
    @Query(value = "UPDATE products SET stock_quantity = stock_quantity + :quantity WHERE id = :productId",
        nativeQuery = true)
    void incrementStock(@Param("productId") UUID productId, @Param("quantity") int quantity);
}
