"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { Header } from "@/components/Header";

// Two-column admin frame. The admin Header hides the customer cart/search/
// account icons (an admin session only ever shows Dashboard/Products/Orders).
// On desktop "View store" and "Sign out" sit at the foot of the sidebar. Below
// 900px the sidebar is replaced by AdminBottomNav and those two move into the
// Header.
const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    // h-dvh, not h-screen: on iOS Safari 100vh includes the area behind the
    // address bar, which would hide the bottom of the scroll area.
    <div className="admin-shell flex h-dvh flex-col overflow-hidden">
      <Header />
      <div className="flex min-h-0 flex-1 min-[900px]:grid min-[900px]:grid-cols-[210px_1fr]">
        <nav aria-label="Admin" className="hidden flex-col justify-between border-r border-rule px-7 py-10 min-[900px]:flex">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-l-2 py-2.5 pl-3.5 font-mono text-label uppercase tracking-label ${
                    active ? "border-ink text-ink" : "border-transparent text-grey hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-col gap-1 border-t border-rule pt-5">
            <Link href="/products" className="py-2 pl-3.5 font-mono text-label uppercase tracking-label text-grey hover:text-ink">
              View store
            </Link>
            <button
              type="button"
              onClick={() => {
                // Wait for the server to clear the session cookie before leaving.
                void logout().finally(() => router.push("/products"));
              }}
              className="py-2 pl-3.5 text-left font-mono text-label uppercase tracking-label text-grey hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </nav>
        {/* The one part of the admin view that scrolls — the Header and the
            sidebar/bottom nav stay put however tall a tab's content gets.
            The padding lives on the inner div, not on <main>: browsers keep
            sticky elements inside the scroller's padding, so padding here
            would pin table headers 44px below the site header instead of
            directly under it. */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-5 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+32px)] pt-7 min-[900px]:px-14 min-[900px]:pb-24 min-[900px]:pt-11">
            {children}
          </div>
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
