package com.archive233.backend.health;

import org.springframework.stereotype.Service;

@Service
public class HealthService {

    private final HealthRepository healthRepository;

    public HealthService(HealthRepository healthRepository) {
        this.healthRepository = healthRepository;
    }

    public HealthStatus checkApp() {
        return HealthStatus.ok();
    }

    public HealthStatus checkDatabase() {
        healthRepository.pingDatabase();
        return HealthStatus.ok();
    }
}
