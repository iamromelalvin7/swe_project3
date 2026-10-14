"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const CATALOG_KEY = "archive233:catalog-url";

/** Remembers the catalog URL (filters, sort, search) each time it changes. */
export function RememberCatalogUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    try {
      const qs = searchParams.toString();
      sessionStorage.setItem(CATALOG_KEY, qs ? `${pathname}?${qs}` : pathname);
    } catch {
      // storage unavailable (private mode) — BackLink falls back to /products
    }
  }, [pathname, searchParams]);
  return null;
}

/** "Back to catalog" that returns to the filtered view the shopper came from. */
export function BackToCatalog({ className = "" }: { className?: string }) {
  const [href, setHref] = useState("/products");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CATALOG_KEY);
      if (saved) setHref(`${saved}#archive`);
    } catch {
      // keep the default
    }
  }, []);
  return (
    <Link href={href} className={`link-quiet inline-block ${className}`}>
      ← Back to catalog
    </Link>
  );
}
