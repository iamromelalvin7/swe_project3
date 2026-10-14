"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Below 900px this fixed tab bar replaces AdminShell's left-column nav.
const TABS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
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
      <svg width="17" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <rect x="1" y="5" width="14" height="12" />
        <path d="M5 5V3.5A3 3 0 0 1 11 3.5V5" />
      </svg>
    ),
  },
];

export function AdminBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-rule bg-cream pb-[env(safe-area-inset-bottom)] min-[900px]:hidden"
    >
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-[var(--bottom-nav-height)] flex-col items-center justify-center gap-1.5 font-mono text-micro uppercase tracking-label -outline-offset-4 ${
              active ? "text-ink" : "text-grey"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            {active && <span aria-hidden="true" className="absolute inset-x-[30%] top-0 h-px bg-ink" />}
          </Link>
        );
      })}
    </nav>
  );
}
