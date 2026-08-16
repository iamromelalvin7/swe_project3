package com.archive233.backend.error;

import java.util.Map;

public record ApiError(String code, String message, Map<String, String> fields) {

    public ApiError(String code, String message) {
        this(code, message, null);
    }
}
