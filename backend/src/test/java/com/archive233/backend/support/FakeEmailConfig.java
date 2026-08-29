package com.archive233.backend.support;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestClient;

import com.archive233.backend.email.ResendEmailClient;

/**
 * Captures every email a test would have sent instead of calling the real
 * Resend API — a hand-written subclass via {@code @Primary}, not a Mockito
 * {@code @MockBean}: Mockito's inline mock maker needs a bytecode agent
 * that isn't compatible with this machine's JDK (26, a preview build; the
 * project itself targets 21 per pom.xml). Same approach as
 * ProductImageReplaceTest's SupabaseStorageClient fake.
 *
 * Import with {@code @Import(FakeEmailConfig.class)} on the test class, and
 * clear {@link #SENT} in a {@code @BeforeEach} — it's a plain static list,
 * not transaction-rolled-back.
 */
@TestConfiguration
public class FakeEmailConfig {

    public record SentEmail(String to, String subject, String html) {
    }

    public static final List<SentEmail> SENT = new ArrayList<>();

    @Bean
    @Primary
    ResendEmailClient fakeResendEmailClient() {
        return new ResendEmailClient(RestClient.builder(), "fake-key", "test@example.com") {
            @Override
            public void send(String to, String subject, String html) {
                SENT.add(new SentEmail(to, subject, html));
            }
        };
    }
}
