package com.archive233.backend.order;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.error.ApiException;
import com.archive233.backend.error.NotFoundException;
import com.archive233.backend.order.dto.CheckoutRequest;
import com.archive233.backend.order.dto.CheckoutResponse;
import com.archive233.backend.order.dto.OrderDetailDto;
import com.archive233.backend.payment.PaystackService;
import com.archive233.backend.payment.PaystackVerifyData;
import com.archive233.backend.user.User;
import com.archive233.backend.user.UserRepository;

/**
 * Orchestrates checkout: the DB transaction lives entirely in
 * {@link OrderService#placeOrder}; the Paystack call happens after it
 * commits, deliberately outside any transaction.
 */
@Service
public class CheckoutService {

    private final OrderService orderService;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PaystackService paystackService;

    public CheckoutService(OrderService orderService, PaymentRepository paymentRepository,
                            UserRepository userRepository, PaystackService paystackService) {
        this.orderService = orderService;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.paystackService = paystackService;
    }

    public CheckoutResponse checkout(UUID userId, CheckoutRequest request) {
        OrderDetailDto order = orderService.placeOrder(userId, request);

        String authorizationUrl = null;
        if (request.paymentMethod() == PaymentMethod.PAYSTACK) {
            User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
            authorizationUrl = paystackService.initialize(user.getEmail(), order.orderNumber(), order.totalPesewas());
        }
        return new CheckoutResponse(order, authorizationUrl);
    }

    /**
     * FR-E10: this is the sole source of truth for payment confirmation —
     * called by the frontend after the Paystack redirect, never trusting
     * the redirect itself.
     *
     * {@code @Transactional} is load-bearing here, not decorative:
     * {@code payment.getOrder()} and {@code order.getUser()} are both LAZY
     * and {@code spring.jpa.open-in-view=false}, so without an open session
     * spanning this whole method every call threw {@code
     * LazyInitializationException} on the ownership check below — after
     * Paystack had already charged the customer, since that happens on
     * Paystack's side regardless of what this method does afterward. The
     * payment/order state was never being recorded as a result.
     */
    @Transactional
    public OrderDetailDto verify(UUID userId, String reference) {
        Payment payment = paymentRepository.findByProviderReference(reference)
            .orElseThrow(() -> new NotFoundException("Payment not found."));
        if (!payment.getOrder().getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "This payment does not belong to you.");
        }
        applyVerification(payment, paystackService.verify(reference));
        return orderService.getForCustomer(userId, payment.getOrder().getId());
    }

    /**
     * FR-E11/E12: the webhook backstop — not user-scoped (Paystack calls
     * this server-to-server), and idempotent regardless of how many times
     * the same event is delivered. Same {@code @Transactional} reasoning
     * as {@link #verify}: {@code applyVerification} touches the same lazy
     * associations, and the caller ({@code PaystackWebhookController})
     * swallows exceptions silently, so this path was failing exactly the
     * same way without ever surfacing an error to anyone.
     */
    @Transactional
    public void processWebhook(String reference) {
        paymentRepository.findByProviderReference(reference)
            .ifPresent(payment -> applyVerification(payment, paystackService.verify(reference)));
    }

    private void applyVerification(Payment payment, PaystackVerifyData verification) {
        if (payment.getStatus() == PaymentStatus.PAID) {
            return; // FR-E12: already confirmed, a repeat call is a no-op
        }
        if (verification == null || !verification.isSuccessful() || verification.amount() != payment.getAmountPesewas()) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return;
        }
        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);
        if (payment.getOrder().getStatus() == OrderStatus.PENDING) {
            orderService.updateStatus(payment.getOrder().getId(), OrderStatus.CONFIRMED, null);
        }
    }
}
