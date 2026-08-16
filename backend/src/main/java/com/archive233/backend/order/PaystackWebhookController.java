package com.archive233.backend.order;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.payment.PaystackService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/webhooks/paystack")
public class PaystackWebhookController {

    private final PaystackService paystackService;
    private final CheckoutService checkoutService;
    private final ObjectMapper objectMapper;

    public PaystackWebhookController(PaystackService paystackService, CheckoutService checkoutService,
                                      ObjectMapper objectMapper) {
        this.paystackService = paystackService;
        this.checkoutService = checkoutService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<Void> handle(@RequestBody String rawBody,
                                        @RequestHeader(value = "x-paystack-signature", required = false) String signature) {
        if (!paystackService.verifySignature(rawBody, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String reference = root.path("data").path("reference").asText(null);
            if (reference != null) {
                // Re-verifies via Paystack's own API rather than trusting the
                // webhook body — the payload only tells us *which* reference
                // to check, never the confirmation itself (FR-E10's spirit
                // applies here too, not just the browser-facing verify call).
                checkoutService.processWebhook(reference);
            }
        } catch (Exception ignored) {
            // Malformed payload from a source we've already authenticated via
            // signature — nothing to act on; still acknowledge with 200 so
            // Paystack doesn't retry a payload that will never parse.
        }
        return ResponseEntity.ok().build();
    }
}
