"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CatalogFilterOptions } from "@/lib/types";

const PRICE_BANDS: Record<string, { label: string; min?: number; max?: number }> = {
  under_300: { label: "Under GH₵ 300", max: 29999 },
  "300_500": { label: "GH₵ 300 to 500", min: 30000, max: 50000 },
  over_500: { label: "Over GH₵ 500", min: 50001 },
};

const SORTS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ascending" },
  { value: "price_desc", label: "Price descending" },
];

export function FilterBar({ options }: { options: CatalogFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(!!searchParams.get("q") || searchParams.get("search") === "1");
  const [queryInput, setQueryInput] = useState(searchParams.get("q") ?? "");

  // The header's search icon links to /products?search=1 — a client-side
  // navigation within the same route that doesn't remount this component,
  // so the useState initializer above only fires once and misses the hint
  // on a second, later navigation. React to it explicitly instead.
  useEffect(() => {
    if (searchParams.get("search") === "1") {
      setSearchOpen(true);
    }
  }, [searchParams]);

  const priceKey = useMemo(() => {
    const min = searchParams.get("minPrice");
    const max = searchParams.get("maxPrice");
    if (!min && !max) return null;
    return (
      Object.entries(PRICE_BANDS).find(
        ([, band]) => String(band.min ?? "") === (min ?? "") && String(band.max ?? "") === (max ?? "")
      )?.[0] ?? null
    );
  }, [searchParams]);

  function apply(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    setOpenMenu(null);
    router.push(`${pathname}?${params.toString()}`);
  }

  const filters: { key: string; label: string; options: { value: string | null; label: string }[] }[] = [
    {
      key: "category",
      label: "Category",
      options: [{ value: null, label: "All" }, ...options.categories.map((c) => ({ value: c.slug, label: c.name }))],
    },
    {
      key: "size",
      label: "Size",
      options: [{ value: null, label: "All" }, ...options.sizes.map((s) => ({ value: s, label: s }))],
    },
    {
      key: "brand",
      label: "Brand",
      options: [{ value: null, label: "All" }, ...options.brands.map((b) => ({ value: b, label: b }))],
    },
    {
      key: "condition",
      label: "Condition",
      options: [{ value: null, label: "All" }, ...options.conditions.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))],
    },
  ];

  const activeCount = ["category", "size", "brand", "condition"].filter((k) => searchParams.get(k)).length + (priceKey ? 1 : 0);

  return (
    <div>
      {searchOpen && (
        <div className="flex items-center gap-5 border-b border-rule px-14 py-5 max-[640px]:px-5">
          <input
            autoFocus
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply({ q: queryInput || null });
            }}
            placeholder="Search title or brand"
            className="field-input flex-1 text-base"
          />
          <button
            aria-label="Close search"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center hover:opacity-[0.55]"
            onClick={() => {
              setSearchOpen(false);
              setQueryInput("");
              apply({ q: null });
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#12100E" strokeWidth="1.3">
              <line x1="1.5" y1="1.5" x2="14.5" y2="14.5" />
              <line x1="14.5" y1="1.5" x2="1.5" y2="14.5" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex min-h-[52px] flex-wrap items-center gap-x-8 border-b border-rule px-14 max-[640px]:px-5">
        {!searchOpen && (
          <button
            aria-label="Search"
            className="flex h-11 items-center justify-center text-ink hover:opacity-[0.55]"
            onClick={() => setSearchOpen(true)}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="8" cy="8" r="6" />
              <line x1="12.5" y1="12.5" x2="17" y2="17" />
            </svg>
          </button>
        )}
        {filters.map((f) => {
          const current = searchParams.get(f.key);
          const selectedLabel = f.options.find((o) => o.value === current)?.label ?? "All";
          return (
            <div key={f.key} className="relative flex-shrink-0">
              <button
                className="flex h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:text-grey"
                onClick={() => setOpenMenu(openMenu === f.key ? null : f.key)}
              >
                {selectedLabel === "All" ? f.label : `${f.label}: ${selectedLabel}`}
                <span className="border-x-[3.5px] border-t-4 border-x-transparent border-t-grey" />
              </button>
              {openMenu === f.key && (
                <div className="absolute left-0 top-11 z-20 min-w-[170px] rounded-[2px] border border-rule bg-cream py-1.5">
                  {f.options.map((o) => (
                    <button
                      key={o.label}
                      className="block w-full px-3.5 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink hover:bg-ink hover:text-white"
                      onClick={() => apply({ [f.key]: o.value })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="relative flex-shrink-0">
          <button
            className="flex h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:text-grey"
            onClick={() => setOpenMenu(openMenu === "price" ? null : "price")}
          >
            {priceKey ? `Price: ${PRICE_BANDS[priceKey].label}` : "Price"}
            <span className="border-x-[3.5px] border-t-4 border-x-transparent border-t-grey" />
          </button>
          {openMenu === "price" && (
            <div className="absolute left-0 top-11 z-20 min-w-[170px] rounded-[2px] border border-rule bg-cream py-1.5">
              <button
                className="block w-full px-3.5 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink hover:bg-ink hover:text-white"
                onClick={() => apply({ minPrice: null, maxPrice: null })}
              >
                All
              </button>
              {Object.entries(PRICE_BANDS).map(([key, band]) => (
                <button
                  key={key}
                  className="block w-full px-3.5 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink hover:bg-ink hover:text-white"
                  onClick={() =>
                    apply({
                      minPrice: band.min ? String(band.min) : null,
                      maxPrice: band.max ? String(band.max) : null,
                    })
                  }
                >
                  {band.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {activeCount > 0 && (
          <button
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink"
            onClick={() =>
              apply({ category: null, size: null, brand: null, condition: null, minPrice: null, maxPrice: null })
            }
          >
            Clear filters
          </button>
        )}

        <div className="relative flex-shrink-0">
          <button
            className="flex h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:text-grey"
            onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
          >
            Sort: {SORTS.find((s) => s.value === (searchParams.get("sort") ?? "newest"))?.label}
            <span className="border-x-[3.5px] border-t-4 border-x-transparent border-t-grey" />
          </button>
          {openMenu === "sort" && (
            <div className="absolute right-0 top-11 z-20 min-w-[190px] rounded-[2px] border border-rule bg-cream py-1.5">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  className="block w-full px-3.5 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink hover:bg-ink hover:text-white"
                  onClick={() => apply({ sort: s.value === "newest" ? null : s.value })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
