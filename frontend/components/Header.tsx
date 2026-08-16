"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export function Header() {
  const { user, ready, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-rule px-14 max-[640px]:h-[60px] max-[640px]:px-5">
      <Link href="/products" className="font-serif text-[26px] text-ink hover:text-grey max-[640px]:text-[20px]">
        Archive 233
      </Link>
      <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
        {user && (
          <Link href="/cart" className="flex items-center gap-1.5 hover:text-ink">
            Cart
            <span className="text-ink">{count}</span>
          </Link>
        )}
        {user && (
          <Link href="/orders" className="hover:text-ink">
            My orders
          </Link>
        )}
        {!ready ? null : user ? (
          <>
            <span className="text-ink">{user.fullName}</span>
            <button
              className="hover:text-ink"
              onClick={() => {
                logout();
                router.push("/products");
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
