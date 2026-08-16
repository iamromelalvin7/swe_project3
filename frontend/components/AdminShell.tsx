"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";

// Two-column admin layout from the design export (admCols/admSidePad/admNavDir/admPad,
// lines ~1011-1014 of Archive 233.dc.html). The design's nav lists three items
// (Dashboard, Products, Orders) but only Dashboard and Orders exist — no admin
// product-management screen is in scope for any current phase, so "Products" is
// omitted here rather than linking to a page that doesn't exist. The design's own
// sidebar wordmark is skipped since the site-wide Header above it already shows
// "Archive 233" plus sign-out, which the design's static admin prototype has no
// equivalent for but which is a functional necessity, not a stylistic addition.
const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main>
      <Header />
      <div className="grid grid-cols-1 min-[900px]:grid-cols-[210px_1fr]" style={{ minHeight: "calc(100vh - 76px)" }}>
        <div className="border-b border-rule px-5 py-6 min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-7 min-[900px]:py-10">
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
        </div>
        <div className="min-w-0 px-5 pb-24 pt-7 min-[900px]:px-14 min-[900px]:pb-[120px] min-[900px]:pt-11">{children}</div>
      </div>
    </main>
  );
}
