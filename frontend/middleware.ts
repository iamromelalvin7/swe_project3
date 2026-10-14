import { NextResponse, type NextRequest } from "next/server";

/** Must match the backend's AuthCookies.NAME. */
const SESSION_COOKIE = "a233_session";
/** Must match the backend's ClientIpResolver header names. */
const PROXY_SECRET_HEADER = "x-archive-proxy-secret";
const CLIENT_IP_HEADER = "x-archive-client-ip";

/** Pages that need a signed-in user. */
const PROTECTED = [/^\/account(\/|$)/, /^\/cart(\/|$)/, /^\/checkout(\/|$)/, /^\/orders(\/|$)/, /^\/admin(\/|$)/];

/**
 * 1. API proxy: /api/* is rewritten to the backend (next.config.mjs). Here we
 *    attach the shopper's IP plus a shared secret, so the backend's rate
 *    limits key on the real shopper rather than on this server's address.
 *    Any copy of those headers sent by the client is dropped first.
 * 2. Signed-out visitors to account/cart/checkout/admin pages go straight to
 *    sign-in instead of loading the page first. This is a convenience, not
 *    the security boundary — the backend rejects every protected API call
 *    without a valid session regardless.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const headers = new Headers(request.headers);
    headers.delete(PROXY_SECRET_HEADER);
    headers.delete(CLIENT_IP_HEADER);
    const secret = process.env.PROXY_SHARED_SECRET;
    const clientIp = clientIpOf(request);
    if (secret && clientIp) {
      headers.set(PROXY_SECRET_HEADER, secret);
      headers.set(CLIENT_IP_HEADER, clientIp);
    }
    return NextResponse.next({ request: { headers } });
  }

  if (PROTECTED.some((re) => re.test(pathname)) && !request.cookies.get(SESSION_COOKIE)?.value) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

/**
 * The visitor's IP as reported by the hosting platform. On Vercel,
 * x-real-ip / x-forwarded-for are set by Vercel's edge (not passed through
 * from the client). Locally there is no proxy, so this is usually absent
 * and the backend falls back to the connection address.
 */
function clientIpOf(request: NextRequest): string | null {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}

export const config = {
  matcher: ["/api/:path*", "/account/:path*", "/cart/:path*", "/checkout/:path*", "/orders/:path*", "/admin/:path*"],
};
