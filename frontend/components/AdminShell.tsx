"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";

// Two-column admin layout from the design export (admCols/admSidePad/admNavDir/admPad,
// lines ~1011-1014 of Archive 233.dc.html). The design's own sidebar wordmark is
// skipped since the site-wide Header above it already shows "Archive 233". The admin
// Header intentionally hides the customer-facing cart/search/account icons (per the
// project owner: an admin session should only ever show Dashboard/Products/Orders),
// so "Sign out" — previously reachable only via the account icon — lives here instead.
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
    <main>
      <Header />
      <div className="grid grid-cols-1 min-[900px]:grid-cols-[210px_1fr]" style={{ minHeight: "calc(100vh - 76px)" }}>
        <div className="flex flex-col border-b border-rule px-5 py-6 min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-7 min-[900px]:py-10">
          <div className="flex flex-row gap-1 min-[900px]:flex-col">
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
          <button
            onClick={() => {
              logout();
              router.push("/products");
            }}
            className="mt-4 py-2.5 pl-3.5 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink min-[900px]:mt-auto min-[900px]:border-l-2 min-[900px]:border-transparent min-[900px]:pt-8"
          >
            Sign out
          </button>
        </div>
        <div className="min-w-0 px-5 pb-24 pt-7 min-[900px]:px-14 min-[900px]:pb-[120px] min-[900px]:pt-11">{children}</div>
      </div>
    </main>
  );
}
