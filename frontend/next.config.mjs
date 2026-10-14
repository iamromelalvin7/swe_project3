/**
 * Where the Spring Boot API lives. API_URL is the server-only setting;
 * NEXT_PUBLIC_API_URL is still honoured so existing deployments keep working.
 */
const apiOrigin = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
if (!apiOrigin) {
  throw new Error("Set API_URL (or NEXT_PUBLIC_API_URL) to the backend's base URL, e.g. http://localhost:8080");
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. Scripts and styles are limited to this origin
 * (inline is still allowed because Next.js injects inline bootstrap scripts;
 * a nonce-based policy would require rendering every page dynamically).
 * Product photos come from Supabase Storage. Framing is refused outright.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // The client-side Router Cache otherwise serves a stale render when
    // navigating to the same route with only searchParams changed (the
    // catalog's filter bar does exactly this) — every product page fetch
    // is already `cache: "no-store"`, so opt dynamic pages out of the
    // Router Cache's stale-while-revalidate window entirely.
    staleTimes: {
      dynamic: 0,
    },
  },
  /**
   * The browser talks to the API through this same origin, so the HttpOnly
   * session cookie the API sets is first-party to the shop's own domain (not
   * blocked as a third-party cookie, and never readable by page scripts).
   * The destination is fixed from configuration — never from the request.
   */
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
