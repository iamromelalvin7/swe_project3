package com.archive233.backend.config;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Fails startup when a required secret or URL is missing.
 *
 * The app runs with spring.main.lazy-initialization=true (shorter cold
 * starts on Render's free tier), which means beans like the Paystack and
 * Resend clients — and the placeholders they read — aren't touched until
 * the first request that needs them. Without this check a deploy with a
 * missing key boots and reports healthy, then fails at checkout or
 * sign-up. This one bean is eager, so misconfiguration fails the deploy
 * instead. Only setting names are reported, never values.
 *
 * Disabled for the test suite (src/test/resources/config/application.properties),
 * which deliberately runs without real third-party keys.
 */
@Component
@Lazy(false)
@ConditionalOnProperty(name = "app.startup-validation.enabled", havingValue = "true", matchIfMissing = true)
public class StartupConfigValidator implements InitializingBean {

    private static final List<String> REQUIRED = List.of(
        "spring.datasource.url",
        "spring.datasource.username",
        "spring.datasource.password",
        "app.jwt.secret",
        "app.cors.allowed-origins",
        "app.frontend-url",
        "app.supabase.url",
        "app.supabase.service-role-key",
        "app.paystack.secret-key",
        "app.resend.api-key",
        "app.resend.from"
    );

    /** HS256 needs a key of at least 256 bits; jjwt rejects anything shorter at first use. */
    private static final int MIN_JWT_SECRET_BYTES = 32;

    private final Environment environment;

    public StartupConfigValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void afterPropertiesSet() {
        List<String> problems = new ArrayList<>();
        for (String key : REQUIRED) {
            String value = read(key);
            if (value == null || value.isBlank()) {
                problems.add(key + " is not set");
            }
        }
        String jwtSecret = read("app.jwt.secret");
        if (jwtSecret != null && !jwtSecret.isBlank()
            && jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_JWT_SECRET_BYTES) {
            problems.add("app.jwt.secret (JWT_SECRET) must be at least " + MIN_JWT_SECRET_BYTES + " bytes");
        }
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Missing or invalid configuration: " + String.join("; ", problems));
        }
    }

    /** An unresolvable ${PLACEHOLDER} throws rather than returning null — treat that as "not set". */
    private String read(String key) {
        try {
            return environment.getProperty(key);
        } catch (IllegalArgumentException unresolved) {
            return null;
        }
    }
}
