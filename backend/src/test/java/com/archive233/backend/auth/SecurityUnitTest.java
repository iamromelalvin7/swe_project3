package com.archive233.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.RestClient;

import com.archive233.backend.payment.PaystackService;
import com.archive233.backend.user.Role;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;

/**
 * Plain unit tests for the security fixes — no Spring context and no
 * database, so they're safe to run anywhere (the integration tests in this
 * package run against whatever database SPRING_DATASOURCE_URL points at).
 *
 * Run just these with: mvn test -Dtest=SecurityUnitTest
 */
class SecurityUnitTest {

    private static final String JWT_SECRET = "unit-test-secret-that-is-at-least-32-bytes-long";

    // --- ClientIpResolver -------------------------------------------------

    @Test
    void clientIp_ignoresTheSpoofableFirstForwardedForEntry() {
        var resolver = new ClientIpResolver("", 1);
        var request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "6.6.6.6, 203.0.113.9");
        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.9");
    }

    @Test
    void clientIp_trustsTheProxyHeaderOnlyWithTheRightSecret() {
        var resolver = new ClientIpResolver("proxy-secret", 1);

        var trusted = new MockHttpServletRequest();
        trusted.addHeader(ClientIpResolver.PROXY_SECRET_HEADER, "proxy-secret");
        trusted.addHeader(ClientIpResolver.CLIENT_IP_HEADER, "198.51.100.7");
        trusted.addHeader("X-Forwarded-For", "10.0.0.1");
        assertThat(resolver.resolve(trusted)).isEqualTo("198.51.100.7");

        var forged = new MockHttpServletRequest();
        forged.addHeader(ClientIpResolver.PROXY_SECRET_HEADER, "guess");
        forged.addHeader(ClientIpResolver.CLIENT_IP_HEADER, "1.2.3.4");
        forged.addHeader("X-Forwarded-For", "10.0.0.2");
        assertThat(resolver.resolve(forged)).isEqualTo("10.0.0.2");
    }

    @Test
    void clientIp_withNoTrustedProxy_ignoresForwardedForEntirely() {
        var resolver = new ClientIpResolver("", 0);
        var request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.44");
        request.addHeader("X-Forwarded-For", "6.6.6.6");
        assertThat(resolver.resolve(request)).isEqualTo("192.0.2.44");
    }

    @Test
    void clientIp_rejectsJunkValuesAndFallsBackToTheSocketAddress() {
        var resolver = new ClientIpResolver("", 1);
        var request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.1");
        request.addHeader("X-Forwarded-For", "not-an-ip");
        assertThat(resolver.resolve(request)).isEqualTo("192.0.2.1");
    }

    // --- FixedWindowRateLimiter --------------------------------------------

    @Test
    void rateLimiter_blocksAfterTheLimitPerKeyOnly() {
        var limiter = new FixedWindowRateLimiter(2, Duration.ofMinutes(15));
        assertThat(limiter.tryAcquire("a")).isTrue();
        assertThat(limiter.tryAcquire("a")).isTrue();
        assertThat(limiter.tryAcquire("a")).isFalse();
        assertThat(limiter.tryAcquire("b")).isTrue();
    }

    // --- Session cookie ----------------------------------------------------

    @Test
    void sessionCookie_isHttpOnlySecureLax_andClearedWithMaxAgeZero() {
        var cookies = new AuthCookies(true, 24);
        ResponseCookie issued = cookies.issue("tok");
        assertThat(issued.isHttpOnly()).isTrue();
        assertThat(issued.isSecure()).isTrue();
        assertThat(issued.getSameSite()).isEqualTo("Lax");
        assertThat(issued.getPath()).isEqualTo("/");
        assertThat(issued.getMaxAge()).isEqualTo(Duration.ofHours(24));
        assertThat(cookies.clear().getMaxAge()).isEqualTo(Duration.ZERO);
    }

    @Test
    void jwtFilter_authenticatesFromTheCookieAndFlagsTheRequest() throws Exception {
        var cookies = new AuthCookies(true, 24);
        var jwt = new JwtService(JWT_SECRET, 24);
        var filter = new JwtAuthenticationFilter(jwt, cookies);
        UUID userId = UUID.randomUUID();

        var request = new MockHttpServletRequest("GET", "/api/cart");
        request.setCookies(new Cookie(AuthCookies.NAME, jwt.generateToken(userId, Role.CUSTOMER)));
        try {
            filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
            assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isEqualTo(userId);
            assertThat(request.getAttribute(JwtAuthenticationFilter.VIA_COOKIE_ATTRIBUTE)).isEqualTo(Boolean.TRUE);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    // --- CSRF header guard -------------------------------------------------

    @Test
    void csrf_rejectsCookieAuthenticatedWritesWithoutTheHeader() throws Exception {
        var filter = new CsrfHeaderFilter(new ObjectMapper());

        var forged = new MockHttpServletRequest("POST", "/api/cart/items");
        forged.setAttribute(JwtAuthenticationFilter.VIA_COOKIE_ATTRIBUTE, Boolean.TRUE);
        var forgedResponse = new MockHttpServletResponse();
        filter.doFilter(forged, forgedResponse, new MockFilterChain());
        assertThat(forgedResponse.getStatus()).isEqualTo(403);
        assertThat(forgedResponse.getContentAsString()).contains("CSRF_REJECTED");

        var genuine = new MockHttpServletRequest("POST", "/api/cart/items");
        genuine.setAttribute(JwtAuthenticationFilter.VIA_COOKIE_ATTRIBUTE, Boolean.TRUE);
        genuine.addHeader(CsrfHeaderFilter.HEADER, CsrfHeaderFilter.VALUE);
        var genuineResponse = new MockHttpServletResponse();
        filter.doFilter(genuine, genuineResponse, new MockFilterChain());
        assertThat(genuineResponse.getStatus()).isEqualTo(200);
    }

    @Test
    void csrf_leavesReadsAndBearerRequestsAlone() throws Exception {
        var filter = new CsrfHeaderFilter(new ObjectMapper());

        var read = new MockHttpServletRequest("GET", "/api/cart");
        read.setAttribute(JwtAuthenticationFilter.VIA_COOKIE_ATTRIBUTE, Boolean.TRUE);
        var readResponse = new MockHttpServletResponse();
        filter.doFilter(read, readResponse, new MockFilterChain());
        assertThat(readResponse.getStatus()).isEqualTo(200);

        var bearerWrite = new MockHttpServletRequest("POST", "/api/cart/items");
        var bearerResponse = new MockHttpServletResponse();
        filter.doFilter(bearerWrite, bearerResponse, new MockFilterChain());
        assertThat(bearerResponse.getStatus()).isEqualTo(200);
    }

    // --- Paystack webhook signature ----------------------------------------

    @Test
    void paystackSignature_acceptsValidInEitherCase_rejectsTamperedAndMalformed() throws Exception {
        String secret = "sk_test_unit";
        var paystack = new PaystackService(RestClient.builder(), secret, "http://localhost:3000");
        String body = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"ref_1\"}}";

        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        String signature = HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));

        assertThat(paystack.verifySignature(body, signature)).isTrue();
        assertThat(paystack.verifySignature(body, signature.toUpperCase())).isTrue();
        assertThat(paystack.verifySignature(body + " ", signature)).isFalse();
        assertThat(paystack.verifySignature(body, "zz-not-hex")).isFalse();
        assertThat(paystack.verifySignature(body, null)).isFalse();
    }
}
