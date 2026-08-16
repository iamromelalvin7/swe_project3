package com.archive233.backend.order;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.common.PageResponse;
import com.archive233.backend.order.dto.AdminOrderSummaryDto;
import com.archive233.backend.order.dto.OrderDetailDto;
import com.archive233.backend.order.dto.UpdateOrderStatusRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public PageResponse<AdminOrderSummaryDto> list(
        @RequestParam(required = false) OrderStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return orderService.listForAdmin(status, from, to, page, pageSize);
    }

    @GetMapping("/{id}")
    public OrderDetailDto get(@PathVariable UUID id) {
        return orderService.getForAdmin(id);
    }

    @PatchMapping("/{id}/status")
    public OrderDetailDto updateStatus(@AuthenticationPrincipal UUID adminId, @PathVariable UUID id,
                                        @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.status(), adminId);
    }
}
