package com.archive233.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.support.FakeEmailConfig;

/**
 * Overrides the max-attempts property so this class gets its own Spring
 * context (and its own {@link AuthRateLimiter} instance) rather than sharing
 * the default-config context's singleton with {@link AuthApiTest} — those
 * tests' register/login calls share the same simulated remote address and
 * would otherwise silently count against this test's limit, or vice versa.
 *
 * {@code @Transactional} rolls each registration back — see AuthApiTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(FakeEmailConfig.class)
@TestPropertySource(properties = {
    "app.rate-limit.auth.max-attempts=2",
    "app.rate-limit.auth.window-minutes=15"
})
@Transactional
class AuthRateLimitTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void register_exceedingLimit_returns429WithErrorContract() throws Exception {
        for (int i = 0; i < 2; i++) {
            registerAttempt(uniqueEmail("limit")).andExpect(status().isOk());
        }

        registerAttempt(uniqueEmail("limit"))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }

    private org.springframework.test.web.servlet.ResultActions registerAttempt(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"fullName":"Test User","email":"%s","phone":"024 000 0000","password":"secret123"}
                """.formatted(email)));
    }

    private static String uniqueEmail(String localPart) {
        return localPart + "+" + UUID.randomUUID() + "@example.com";
    }
}
