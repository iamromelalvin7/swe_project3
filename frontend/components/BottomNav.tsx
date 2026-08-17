"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The design's showBottomNav: store && m — mobile only, customer-facing
// screens only (never inside /admin, which has its own AdminShell sidebar).
const SHOP_PATHS = ["/products"];
const CART_PATHS = ["/cart", "/checkout"];
const ACCOUNT_PATHS = ["/account", "/login", "/register", "/orders"];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  if (pathname.startsWith("/admin")) return null;

  const isShop = SHOP_PATHS.some((p) => pathname.startsWith(p));
  const isCart = CART_PATHS.some((p) => pathname.startsWith(p));
  const isAccount = ACCOUNT_PATHS.some((p) => pathname.startsWith(p));

  const tabs: { href: string; label: string; active: boolean; icon: React.ReactNode }[] = [
    {
      href: "/products",
      label: "Shop",
      active: isShop,
      icon: (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
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
      active: isCart,
      icon: (
        <svg width="16" height="17" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="1" y="5" width="14" height="12" />
          <path d="M5 5V3.5A3 3 0 0 1 11 3.5V5" />
        </svg>
      ),
    },
    {
      href: "/account",
      label: "Account",
      active: isAccount,
      icon: (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="9" cy="6" r="3.2" />
          <path d="M2.5 16c0-3.2 2.9-5.2 6.5-5.2s6.5 2 6.5 5.2" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 border-t border-rule bg-cream min-[640px]:hidden">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex h-[60px] flex-col items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
            t.active ? "text-ink" : "text-grey"
          }`}
        >
          {t.icon}
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
