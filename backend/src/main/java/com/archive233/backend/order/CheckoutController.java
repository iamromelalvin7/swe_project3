package com.archive233.backend.order;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.order.dto.CheckoutRequest;
import com.archive233.backend.order.dto.CheckoutResponse;
import com.archive233.backend.order.dto.OrderDetailDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping
    public ResponseEntity<CheckoutResponse> checkout(@AuthenticationPrincipal UUID userId,
                                                       @Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(checkoutService.checkout(userId, request));
    }

    @GetMapping("/verify")
    public OrderDetailDto verify(@AuthenticationPrincipal UUID userId, @RequestParam String reference) {
        return checkoutService.verify(userId, reference);
    }
}
