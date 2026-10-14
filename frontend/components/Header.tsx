"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const LINKS = [
  { href: "/products", label: "Shop", key: "shop" },
  { href: "/products?sort=newest#archive", label: "New arrivals", key: "new" },
  { href: "/products#archive", label: "Archive", key: "archive" },
  { href: "/products#how-it-works", label: "About", key: "about" },
] as const;

function useActiveKey(): string | null {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  if (pathname !== "/products" && !pathname.startsWith("/products/")) return null;
  return searchParams.get("sort") === "newest" ? "new" : "shop";
}

function NavLinks({ activeKey }: { activeKey: string | null }) {
  return (
    <>
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          aria-current={activeKey === l.key ? "page" : undefined}
          className={`nav-link ${activeKey === l.key ? "nav-link-active" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}

function ActiveNavLinks() {
  return <NavLinks activeKey={useActiveKey()} />;
}

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isAdmin = user?.role === "ADMIN";
  const inAdminSection = pathname.startsWith("/admin");
  const adminSection = pathname.startsWith("/admin/products")
    ? "Products"
    : pathname.startsWith("/admin/orders")
      ? "Orders"
      : pathname.startsWith("/admin/dashboard")
        ? "Overview"
        : null;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header className="border-b border-rule">
        <div
          className={`page-container grid h-[82px] items-center max-[850px]:grid-cols-[1fr_auto] max-[640px]:h-[62px] ${
            isAdmin ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto_1fr]"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={inAdminSection ? "/admin/dashboard" : "/products"}
              className="w-fit flex-shrink-0 font-serif text-wordmark leading-none tracking-display text-ink hover:text-grey max-[640px]:text-h3 max-[640px]:leading-none"
            >
              Archive 233
            </Link>
            {inAdminSection && (
              <span className="truncate border border-ink px-2 py-1 font-mono text-micro uppercase tracking-label text-ink">
                Admin
                {adminSection && <span className="hidden min-[640px]:inline min-[900px]:hidden"> · {adminSection}</span>}
              </span>
            )}
          </div>

          {!isAdmin && (
            <nav aria-label="Main" className="flex items-center gap-10 max-[850px]:hidden">
              <Suspense fallback={<NavLinks activeKey={null} />}>
                <ActiveNavLinks />
              </Suspense>
            </nav>
          )}

          <div className="flex items-center justify-self-end gap-4 max-[640px]:gap-1">
            {isAdmin ? (
              <>
                {/* Inside admin on desktop these live at the foot of the sidebar. */}
                <Link href={inAdminSection ? "/products" : "/admin/dashboard"} className={`nav-link ${inAdminSection ? "min-[900px]:hidden" : ""}`}>
                  {inAdminSection ? "Store" : "Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    // Wait for the server to clear the session cookie before leaving.
                    void logout().finally(() => router.push("/products"));
                  }}
                  className={`nav-link ml-4 ${inAdminSection ? "min-[900px]:hidden" : ""}`}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="icon-link min-[851px]:hidden"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3.5 8h17M3.5 16h17" />}
                  </svg>
                </button>
                <Link href="/products?search=1#archive" aria-label="Search the shop" className="icon-link">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="10.8" cy="10.8" r="7.3" />
                    <path d="m16.2 16.2 5 5" />
                  </svg>
                </Link>
                <Link href={user ? "/account" : "/login"} aria-label={user ? "Your account" : "Sign in"} className="icon-link max-[640px]:hidden">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M4.5 21c.4-4.1 3.2-6.4 7.5-6.4s7.1 2.3 7.5 6.4" />
                  </svg>
                </Link>
                <Link href="/cart" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`} className="icon-link relative">
                  <svg width="22" height="23" viewBox="0 0 24 25" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M4 8h16l1 15H3L4 8Z" />
                    <path d="M8 9V6a4 4 0 0 1 8 0v3" />
                  </svg>
                  {count > 0 && (
                    <span aria-hidden="true" className="absolute right-0 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 font-mono text-micro leading-none text-cream">
                      {count}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {!isAdmin && menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="border-b border-rule min-[851px]:hidden">
          <div className="page-container flex flex-col py-2">
            {LINKS.map((l) => (
              <Link key={l.key} href={l.href} onClick={() => setMenuOpen(false)} className="py-3 font-mono text-label uppercase tracking-label text-ink hover:text-grey">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {!isAdmin && (
        <div className="border-b border-rule">
          <p className="page-container flex h-9 items-center justify-center font-mono text-micro uppercase tracking-strip text-ink max-[640px]:h-8 max-[640px]:tracking-label">
            Curated secondhand menswear
            <span aria-hidden="true" className="mx-4 text-grey max-[640px]:mx-2.5">
              ·
            </span>
            Accra, Ghana
          </p>
        </div>
      )}
    </>
  );
}
