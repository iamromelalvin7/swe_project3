"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

// Mobile-only tab bar for customer screens (never inside /admin, which has
// its own AdminBottomNav). Its height is reserved on <body> in globals.css.
const SHOP_PATHS = ["/products"];
const CART_PATHS = ["/cart", "/checkout"];
const ACCOUNT_PATHS = ["/account", "/login", "/register", "/orders", "/verify-email", "/forgot-password", "/reset-password"];

export function BottomNav() {
  const pathname = usePathname() ?? "";
  const { count } = useCart();

  if (pathname.startsWith("/admin")) return null;

  const tabs: { href: string; label: string; active: boolean; badge?: number; icon: React.ReactNode }[] = [
    {
      href: "/products",
      label: "Shop",
      active: SHOP_PATHS.some((p) => pathname.startsWith(p)),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <rect x="2" y="2" width="6" height="6" />
          <rect x="10" y="2" width="6" height="6" />
          <rect x="2" y="10" width="6" height="6" />
          <rect x="10" y="10" width="6" height="6" />
        </svg>
      ),
    },
    {
      href: "/cart",
      label: "Cart",
      active: CART_PATHS.some((p) => pathname.startsWith(p)),
      badge: count,
      icon: (
        <svg width="17" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <rect x="1" y="5" width="14" height="12" />
          <path d="M5 5V3.5A3 3 0 0 1 11 3.5V5" />
        </svg>
      ),
    },
    {
      href: "/account",
      label: "Account",
      active: ACCOUNT_PATHS.some((p) => pathname.startsWith(p)),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <circle cx="9" cy="6" r="3.2" />
          <path d="M2.5 16c0-3.2 2.9-5.2 6.5-5.2s6.5 2 6.5 5.2" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Shortcuts"
      className="fixed inset-x-0 bottom-0 z-40 hidden grid-cols-3 border-t border-rule bg-cream pb-[env(safe-area-inset-bottom)] max-[849px]:grid"
    >
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          aria-label={t.badge ? `${t.label}, ${t.badge} ${t.badge === 1 ? "item" : "items"}` : undefined}
          className={`relative flex h-[var(--bottom-nav-height)] flex-col items-center justify-center gap-1.5 font-mono text-micro uppercase tracking-label -outline-offset-4 ${
            t.active ? "text-ink" : "text-grey"
          }`}
        >
          <span className="relative">
            {t.icon}
            {t.badge ? (
              <span aria-hidden="true" className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-micro leading-none text-cream">
                {t.badge}
              </span>
            ) : null}
          </span>
          <span>{t.label}</span>
          {t.active && <span aria-hidden="true" className="absolute inset-x-[30%] top-0 h-px bg-ink" />}
        </Link>
      ))}
    </nav>
  );
}
