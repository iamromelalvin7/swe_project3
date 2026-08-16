package com.archive233.backend.order;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.order.dto.AdminDashboardDto;

/** Objective 4.3: revenue, order count, items sold, live stock, orders awaiting action. */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final OrderService orderService;

    public AdminDashboardController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public AdminDashboardDto get() {
        return orderService.getDashboard();
    }
}
