"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { Header } from "@/components/Header";

// Two-column admin layout from the design export (admCols/admSidePad/admNavDir/admPad,
// lines ~1011-1014 of Archive 233.dc.html). The design's own sidebar wordmark is
// skipped since the site-wide Header above it already shows "Archive 233". The admin
// Header intentionally hides the customer-facing cart/search/account icons (per the
// project owner: an admin session should only ever show Dashboard/Products/Orders).
//
// Below 900px the left-column nav is replaced by AdminBottomNav (a fixed tab bar,
// matching the customer-facing BottomNav's pattern) rather than squeezing it into a
// horizontal strip — "Sign out" moved to the Header, next to the store/dashboard
// toggle, since it no longer has a sidebar to live at the bottom of on mobile.
const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex min-h-0 flex-1 min-[900px]:grid min-[900px]:grid-cols-[210px_1fr]">
        <div className="hidden flex-col border-r border-rule px-7 py-10 min-[900px]:flex">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-2.5 pl-3.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
                    active ? "border-l-2 border-ink text-ink" : "border-l-2 border-transparent text-grey hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        {/* This is the one part of the admin view that scrolls — the Header
            above and the sidebar/bottom nav stay put regardless of how tall
            a given tab's content (e.g. the dashboard overview) gets. */}
        <div className="min-w-0 overflow-y-auto px-5 pb-24 pt-7 min-[900px]:px-14 min-[900px]:pb-[120px] min-[900px]:pt-11">
          {children}
        </div>
      </div>
      <AdminBottomNav />
    </main>
  );
}
