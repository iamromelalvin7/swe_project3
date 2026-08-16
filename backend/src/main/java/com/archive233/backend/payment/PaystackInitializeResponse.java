package com.archive233.backend.payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackInitializeResponse(boolean status, String message, PaystackInitializeData data) {
}
