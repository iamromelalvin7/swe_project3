package com.archive233.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hits the real endpoints end to end against the configured database.
 * {@code @Transactional} rolls each test back, so nothing persists — a
 * second call within the same test sees the first save() via Hibernate's
 * auto-flush-before-query, no need to force a real commit.
 *
 * Fixture emails are randomized per run (not e.g. "kojo.mensah@example.com")
 * because this suite runs against whatever database `SPRING_DATASOURCE_URL`
 * points at, including live Supabase — a hardcoded email that happens to
 * match a real seeded user makes the "register" step itself fail with 409
 * before the test even reaches what it's meant to check.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthApiTest {

    @Autowired
    private MockMvc mockMvc;

    private static String uniqueEmail(String localPart) {
        return localPart + "+" + UUID.randomUUID() + "@example.com";
    }

    @Test
    void register_returnsTokenAndUser() throws Exception {
        String email = uniqueEmail("ama.owusu");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Ama Owusu","email":"%s","phone":"024 111 2222","password":"secret123"}
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void register_duplicateEmail_returns409WithErrorContract() throws Exception {
        String body = """
            {"fullName":"Kojo Mensah","email":"%s","phone":"024 333 4444","password":"secret123"}
            """.formatted(uniqueEmail("kojo.mensah"));
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("DUPLICATE_EMAIL"))
            .andExpect(jsonPath("$.error.message").isNotEmpty());
    }

    @Test
    void register_missingFields_returns400ValidationError() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.fields.email").isNotEmpty());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        String email = uniqueEmail("yaa.asantewaa");
        String register = """
            {"fullName":"Yaa Asantewaa","email":"%s","phone":"024 555 6666","password":"correct-password"}
            """.formatted(email);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(register))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"wrong-password"}
                    """.formatted(email)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }
}
