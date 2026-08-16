package com.archive233.backend.order;

import java.time.OffsetDateTime;

import org.springframework.data.jpa.domain.Specification;

/**
 * Deliberately not a single dynamic JPQL query with "(:param IS NULL OR
 * ...)" branches — PgJDBC repeatedly failed to infer a type for a
 * null-valued bind parameter used only inside such a branch (it falls back
 * to bytea and the query 500s), even after several targeted casts. A
 * Specification only ever adds a predicate for a filter that's actually
 * present, so an absent filter never reaches Postgres as an ambiguous
 * parameter at all.
 */
public final class OrderSpecifications {

    private OrderSpecifications() {
    }

    public static Specification<Order> hasStatus(OrderStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Order> createdAfter(OffsetDateTime from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<Order> createdBefore(OffsetDateTime to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }
}
