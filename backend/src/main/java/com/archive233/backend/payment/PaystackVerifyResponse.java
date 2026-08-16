package com.archive233.backend.payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackVerifyResponse(boolean status, String message, PaystackVerifyData data) {
}
