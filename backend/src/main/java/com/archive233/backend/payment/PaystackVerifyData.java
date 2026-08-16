package com.archive233.backend.payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackVerifyData(String status, String reference, int amount) {

    public boolean isSuccessful() {
        return "success".equals(status);
    }
}
