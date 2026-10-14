package com.archive233.backend.order;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.order.dto.CheckoutRequest;
import com.archive233.backend.order.dto.CheckoutResponse;
import com.archive233.backend.error.ApiException;
import com.archive233.backend.order.dto.OrderDetailDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final CheckoutRateLimiter rateLimiter;

    public CheckoutController(CheckoutService checkoutService, CheckoutRateLimiter rateLimiter) {
        this.checkoutService = checkoutService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    public ResponseEntity<CheckoutResponse> checkout(@AuthenticationPrincipal UUID userId,
                                                       @Valid @RequestBody CheckoutRequest request) {
        // Each attempt can create an order and a Paystack transaction.
        if (!rateLimiter.tryAcquire("checkout|" + userId)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                "Too many checkout attempts. Wait a few minutes and try again.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(checkoutService.checkout(userId, request));
    }

    /** POST, not GET: it changes order and payment state, so it must not be triggerable by a link or prefetch. */
    @PostMapping("/verify")
    public OrderDetailDto verify(@AuthenticationPrincipal UUID userId, @RequestParam String reference) {
        return checkoutService.verify(userId, reference);
    }
}
