package com.archive233.backend.order.dto;

import java.util.List;

/** FR-I1/FR-I2, objective 4.3: revenue, order count, items sold, live stock, orders awaiting action. */
public record AdminDashboardDto(
    long totalRevenuePesewas,
    long orderCount,
    long itemsSold,
    long liveStockUnits,
    long awaitingActionCount,
    List<AdminOrderSummaryDto> awaitingAction
) {
}
