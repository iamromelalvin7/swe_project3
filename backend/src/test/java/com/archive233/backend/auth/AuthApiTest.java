package com.archive233.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.support.FakeEmailConfig;
import com.archive233.backend.user.User;
import com.archive233.backend.user.UserRepository;

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
 *
 * Registration no longer creates a `users` row directly — it stages a
 * pending registration and emails a code (FakeEmailConfig captures it
 * instead of calling the real Resend API); verify-email is what actually
 * creates the account. Tests that only care about login/duplicate-email
 * behavior create the User directly via the repository instead of going
 * through register+verify, since that flow isn't what they're testing.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(FakeEmailConfig.class)
@Transactional
class AuthApiTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void clearSentEmails() {
        FakeEmailConfig.SENT.clear();
    }

    private static String uniqueEmail(String localPart) {
        return localPart + "+" + UUID.randomUUID() + "@example.com";
    }

    private static String extractCode(String html) {
        Matcher matcher = Pattern.compile("\\d{6}").matcher(html);
        if (!matcher.find()) {
            throw new IllegalStateException("No 6-digit code found in email body: " + html);
        }
        return matcher.group();
    }

    @Test
    void register_stagesRegistrationAndEmailsACode_withNoAccountCreatedYet() throws Exception {
        String email = uniqueEmail("ama.owusu");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Ama Owusu","email":"%s","phone":"024 111 2222","password":"secret123"}
                    """.formatted(email)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").isNotEmpty());

        assertThat(userRepository.existsByEmail(email)).isFalse();
        assertThat(FakeEmailConfig.SENT).hasSize(1);
        assertThat(FakeEmailConfig.SENT.get(0).to()).isEqualTo(email);
    }

    @Test
    void verifyEmail_withCorrectCode_createsAccountAndReturnsToken() throws Exception {
        String email = uniqueEmail("kwame.boateng");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Kwame Boateng","email":"%s","phone":"024 222 3333","password":"secret123"}
                    """.formatted(email)))
            .andExpect(status().isOk());

        String code = extractCode(FakeEmailConfig.SENT.get(0).html());

        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","code":"%s"}
                    """.formatted(email, code)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.email").value(email));

        assertThat(userRepository.existsByEmail(email)).isTrue();
    }

    @Test
    void verifyEmail_withWrongCode_returns400AndDoesNotCreateAccount() throws Exception {
        String email = uniqueEmail("abena.owusu");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Abena Owusu","email":"%s","phone":"024 444 5555","password":"secret123"}
                    """.formatted(email)))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","code":"000000"}
                    """.formatted(email)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));

        assertThat(userRepository.existsByEmail(email)).isFalse();
    }

    @Test
    void register_duplicateEmail_returns409WithErrorContract() throws Exception {
        String email = uniqueEmail("kojo.mensah");
        userRepository.save(new User(email, passwordEncoder.encode("secret123"), "Kojo Mensah", "024 333 4444"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Kojo Mensah","email":"%s","phone":"024 333 4444","password":"secret123"}
                    """.formatted(email)))
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
        userRepository.save(new User(email, passwordEncoder.encode("correct-password"), "Yaa Asantewaa", "024 555 6666"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"wrong-password"}
                    """.formatted(email)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }
}
