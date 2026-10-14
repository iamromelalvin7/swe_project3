/**
 * Where to send a customer after signing in. Only mid-purchase places are
 * honoured (cart, checkout, a product page); anything else — including any
 * absolute or protocol-relative URL — falls back to the storefront.
 */
export function safeRedirect(redirect: string | null | undefined): string {
  if (!isLocalPath(redirect)) return "/products";
  const path = redirect.split(/[?#]/)[0];
  if (path === "/cart" || path === "/checkout" || /^\/products\/[A-Za-z0-9-]+$/.test(path)) {
    return redirect;
  }
  return "/products";
}

/**
 * Post-sign-in destination for any role. Admins return to the admin page
 * they were sent from, or land on the dashboard; customers follow
 * {@link safeRedirect}.
 */
export function redirectAfterLogin(redirect: string | null | undefined, role: "CUSTOMER" | "ADMIN"): string {
  if (role === "ADMIN") {
    return isLocalPath(redirect) && /^\/admin(\/|$)/.test(redirect) ? redirect : "/admin/dashboard";
  }
  return safeRedirect(redirect);
}

function isLocalPath(value: string | null | undefined): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}
