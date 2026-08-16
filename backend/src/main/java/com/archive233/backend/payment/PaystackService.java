package com.archive233.backend.payment;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * FR-E10: the server-side verify call is the sole source of truth for
 * payment confirmation — never the browser redirect. FR-E11/E12: the
 * webhook is a signature-verified, idempotent backstop.
 */
@Component
public class PaystackService {

    private static final String HMAC_ALGORITHM = "HmacSHA512";

    private final RestClient restClient;
    private final String secretKey;
    private final String frontendUrl;

    public PaystackService(RestClient.Builder builder,
                            @Value("${app.paystack.secret-key}") String secretKey,
                            @Value("${app.frontend-url}") String frontendUrl) {
        this.restClient = builder
            .baseUrl("https://api.paystack.co")
            .defaultHeader("Authorization", "Bearer " + secretKey)
            .build();
        this.secretKey = secretKey;
        this.frontendUrl = frontendUrl;
    }

    public String initialize(String email, String reference, int amountPesewas) {
        PaystackInitializeResponse response = restClient.post()
            .uri("/transaction/initialize")
            .body(Map.of(
                "email", email,
                "amount", amountPesewas,
                "reference", reference,
                "callback_url", frontendUrl + "/checkout/confirm"
            ))
            .retrieve()
            .body(PaystackInitializeResponse.class);
        return response == null || response.data() == null ? null : response.data().authorizationUrl();
    }

    public PaystackVerifyData verify(String reference) {
        PaystackVerifyResponse response = restClient.get()
            .uri("/transaction/verify/{reference}", reference)
            .retrieve()
            .body(PaystackVerifyResponse.class);
        return response == null ? null : response.data();
    }

    /**
     * Recomputes the HMAC over the exact raw body bytes Paystack sent —
     * the signature will not match if the payload is re-serialized first.
     */
    public boolean verifySignature(String rawBody, String signatureHeader) {
        if (signatureHeader == null) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] computed = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computedHex = HexFormat.of().formatHex(computed);
            return computedHex.equalsIgnoreCase(signatureHeader);
        } catch (Exception ex) {
            return false;
        }
    }
}
