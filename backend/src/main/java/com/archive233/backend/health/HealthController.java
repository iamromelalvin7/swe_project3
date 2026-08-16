package com.archive233.backend.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    public HealthStatus health() {
        return healthService.checkApp();
    }

    @GetMapping("/db")
    public HealthStatus healthDb() {
        return healthService.checkDatabase();
    }
}
