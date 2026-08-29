package com.archive233.backend.common;

/** A generic acknowledgement body for endpoints that intentionally reveal nothing else (e.g. forgot-password). */
public record MessageResponse(String message) {
}
