package com.archive233.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void register_returnsTokenAndUser() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Ama Owusu","email":"ama.owusu@example.com","phone":"024 111 2222","password":"secret123"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.email").value("ama.owusu@example.com"));
    }

    @Test
    void register_duplicateEmail_returns409WithErrorContract() throws Exception {
        String body = """
            {"fullName":"Kojo Mensah","email":"kojo.mensah@example.com","phone":"024 333 4444","password":"secret123"}
            """;
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
        String register = """
            {"fullName":"Yaa Asantewaa","email":"yaa.asantewaa@example.com","phone":"024 555 6666","password":"correct-password"}
            """;
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(register))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"yaa.asantewaa@example.com","password":"wrong-password"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }
}
