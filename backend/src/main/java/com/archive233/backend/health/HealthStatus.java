package com.archive233.backend.health;

public record HealthStatus(String status) {

    public static HealthStatus ok() {
        return new HealthStatus("ok");
    }
}
