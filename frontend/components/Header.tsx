"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export function Header() {
  const { user } = useAuth();
  const { count } = useCart();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-rule px-14 max-[640px]:h-[60px] max-[640px]:px-5">
      <Link href="/products" className="font-serif text-[26px] text-ink hover:text-grey max-[640px]:text-[20px]">
        Archive 233
      </Link>
      <div className="flex items-center gap-[22px]">
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink"
          >
            Dashboard
          </Link>
        )}
        {!isAdmin && (
          <>
            <Link
              href="/cart"
              aria-label="Cart"
              className="flex h-11 items-center gap-1.5 text-ink hover:opacity-[0.55]"
            >
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1" y="5" width="14" height="12" />
                <path d="M5 5V3.5A3 3 0 0 1 11 3.5V5" />
              </svg>
              <span className="font-mono text-[11px]">{count}</span>
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="flex h-11 w-11 items-center justify-center text-ink hover:opacity-[0.55]"
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="9" cy="6" r="3.2" />
                <path d="M2.5 16c0-3.2 2.9-5.2 6.5-5.2s6.5 2 6.5 5.2" />
              </svg>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
