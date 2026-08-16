package com.archive233.backend.payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackInitializeData(
    @JsonProperty("authorization_url") String authorizationUrl,
    @JsonProperty("access_code") String accessCode,
    String reference
) {
}
