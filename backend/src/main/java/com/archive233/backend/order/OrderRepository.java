package com.archive233.backend.order;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.archive233.backend.order.dto.OrderSummaryDto;

public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    boolean existsByOrderNumber(String orderNumber);

    @Query("""
        SELECT o FROM Order o
        JOIN FETCH o.user
        LEFT JOIN FETCH o.items
        WHERE o.id = :id
        """)
    Optional<Order> findDetailById(@Param("id") UUID id);

    @Query("""
        SELECT new com.archive233.backend.order.dto.OrderSummaryDto(
            o.id, o.orderNumber, o.status, COUNT(oi), o.totalPesewas, o.createdAt)
        FROM Order o
        LEFT JOIN o.items oi
        WHERE o.user.id = :userId
        GROUP BY o.id, o.orderNumber, o.status, o.totalPesewas, o.createdAt
        """)
    Page<OrderSummaryDto> findSummariesForUser(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Item counts for a page of orders, batched into one query keyed by
     * order id — not N+1, and avoids touching the lazy o.items collection
     * outside findDetailById (open-in-view is off).
     */
    @Query("SELECT oi.order.id, COUNT(oi) FROM OrderItem oi WHERE oi.order.id IN :orderIds GROUP BY oi.order.id")
    List<Object[]> countItemsByOrderIds(@Param("orderIds") List<UUID> orderIds);
}
