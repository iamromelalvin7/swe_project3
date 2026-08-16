package com.archive233.backend.order;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.common.PageResponse;
import com.archive233.backend.order.dto.OrderDetailDto;
import com.archive233.backend.order.dto.OrderSummaryDto;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public PageResponse<OrderSummaryDto> list(@AuthenticationPrincipal UUID userId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(required = false) Integer pageSize) {
        return orderService.listForCustomer(userId, page, pageSize);
    }

    @GetMapping("/{id}")
    public OrderDetailDto get(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return orderService.getForCustomer(userId, id);
    }

    @PostMapping("/{id}/cancel")
    public OrderDetailDto cancel(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return orderService.cancel(userId, id);
    }
}
