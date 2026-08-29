"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mirrors BottomNav.tsx's pattern for the customer side — AdminShell's own
// left-column nav is desktop-only (min-[900px]:flex); below that breakpoint
// this fixed bottom bar replaces it entirely, matching how the rest of the
// app already handles the sidebar-vs-bottom-nav split.
const TABS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="9" width="4" height="7" />
        <rect x="7" y="5" width="4" height="11" />
        <rect x="12" y="1" width="4" height="15" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "Products",
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
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <svg width="16" height="17" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="1" y="5" width="14" height="12" />
        <path d="M5 5V3.5A3 3 0 0 1 11 3.5V5" />
      </svg>
    ),
  },
];

export function AdminBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 border-t border-rule bg-cream min-[900px]:hidden">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex h-[60px] flex-col items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
              active ? "text-ink" : "text-grey"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
