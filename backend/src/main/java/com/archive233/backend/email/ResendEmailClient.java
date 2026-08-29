package com.archive233.backend.email;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Sends transactional email (verification codes, password-reset links) via
 * Resend's REST API. The API key is server-side only (hard rule 10) — never
 * sent to the browser.
 */
@Component
public class ResendEmailClient {

    private final RestClient restClient;
    private final String fromAddress;

    public ResendEmailClient(RestClient.Builder builder,
                              @Value("${app.resend.api-key}") String apiKey,
                              @Value("${app.resend.from}") String fromAddress) {
        this.restClient = builder
            .baseUrl("https://api.resend.com")
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .build();
        this.fromAddress = fromAddress;
    }

    public void send(String to, String subject, String html) {
        restClient.post()
            .uri("/emails")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "from", fromAddress,
                "to", List.of(to),
                "subject", subject,
                "html", html
            ))
            .retrieve()
            .toBodilessEntity();
    }
}
