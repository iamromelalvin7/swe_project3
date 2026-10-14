package com.archive233.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Works out the real client IP for rate limiting without trusting anything
 * the client can set.
 *
 * The first entry of {@code X-Forwarded-For} is whatever the client sent, so
 * keying limits on it (as this app used to) let anyone bypass every auth rate
 * limit by sending a fresh fake value per request. Each trusted proxy in
 * front of the app appends the address it received the request from, so the
 * entry {@code trustedHops} from the end is the caller's real address:
 * 1 on Render (its one proxy appends the caller's IP), 0 when nothing sits in
 * front of the app (the header is then ignored entirely, since a client could
 * have written all of it).
 *
 * When the browser reaches the API through the Next.js frontend (same-origin
 * proxy), that last entry is the frontend server's address, not the
 * shopper's. The frontend therefore forwards the shopper's IP in
 * {@value #CLIENT_IP_HEADER}, and proves it is the frontend by also sending
 * the shared secret in {@value #PROXY_SECRET_HEADER}. Without a matching
 * secret that header is ignored.
 */
@Component
public class ClientIpResolver {

    public static final String PROXY_SECRET_HEADER = "X-Archive-Proxy-Secret";
    public static final String CLIENT_IP_HEADER = "X-Archive-Client-Ip";

    /** IPv4 / IPv6 characters only, bounded — anything else is ignored rather than used as a map key. */
    private static final Pattern IP_LIKE = Pattern.compile("^[0-9A-Fa-f:.]{2,45}$");

    private final byte[] proxySecret;
    private final int trustedHops;

    public ClientIpResolver(@Value("${app.proxy.shared-secret:}") String proxySecret,
                            @Value("${app.proxy.trusted-hops:1}") int trustedHops) {
        this.proxySecret = proxySecret.getBytes(StandardCharsets.UTF_8);
        this.trustedHops = Math.max(0, trustedHops);
    }

    public String resolve(HttpServletRequest request) {
        if (proxySecret.length > 0) {
            String presented = request.getHeader(PROXY_SECRET_HEADER);
            if (presented != null
                && MessageDigest.isEqual(proxySecret, presented.getBytes(StandardCharsets.UTF_8))) {
                String forwardedClient = request.getHeader(CLIENT_IP_HEADER);
                if (forwardedClient != null && IP_LIKE.matcher(forwardedClient.trim()).matches()) {
                    return forwardedClient.trim();
                }
            }
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (trustedHops > 0 && forwarded != null && !forwarded.isBlank()) {
            String[] hops = forwarded.split(",");
            int index = hops.length - trustedHops;
            if (index >= 0) {
                String hop = hops[index].trim();
                if (IP_LIKE.matcher(hop).matches()) {
                    return hop;
                }
            }
        }
        return request.getRemoteAddr();
    }
}
