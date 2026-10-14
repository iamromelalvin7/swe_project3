"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dropdown } from "@/components/Dropdown";
import { FilterSheet, type FilterDraft } from "@/components/FilterSheet";
import { PRICE_BANDS, priceBandFor } from "@/lib/catalog";
import { formatCondition } from "@/lib/format";
import type { CatalogFilterOptions } from "@/lib/types";

const SORTS = [
  { value: null, label: "Available first" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const FILTER_KEYS = ["category", "size", "brand", "condition", "minPrice", "maxPrice"] as const;

export function FilterBar({ options }: { options: CatalogFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(!!searchParams.get("q") || searchParams.get("search") === "1");
  const [queryInput, setQueryInput] = useState(searchParams.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);

  // The header's search icon links to /products?search=1 — a same-route
  // navigation that doesn't remount this component, so react to it here.
  useEffect(() => {
    if (searchParams.get("search") === "1") setSearchOpen(true);
  }, [searchParams]);

  function apply(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    params.delete("search");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}#archive`, { scroll: false });
  }

  const priceKey = priceBandFor(searchParams.get("minPrice"), searchParams.get("maxPrice"));
  const hideSold = searchParams.get("hideSold") === "1";
  const sort = searchParams.get("sort");

  const filters = [
    { key: "category", label: "Category", options: options.categories.map((c) => ({ value: c.slug, label: c.name })) },
    { key: "size", label: "Size", options: options.sizes.map((s) => ({ value: s, label: s })) },
    { key: "brand", label: "Brand", options: options.brands.map((b) => ({ value: b, label: b })) },
    { key: "condition", label: "Condition", options: options.conditions.map((c) => ({ value: c, label: formatCondition(c) })) },
  ];

  const activeCount = ["category", "size", "brand", "condition"].filter((k) => searchParams.get(k)).length + (priceKey ? 1 : 0);
  const sortLabel = SORTS.find((s) => s.value === sort)?.label ?? "Available first";

  const sheetGroups = [
    ...filters,
    { key: "price", label: "Price", options: Object.entries(PRICE_BANDS).map(([key, band]) => ({ value: key, label: band.label })) },
  ];

  function applyDraft(draft: FilterDraft) {
    const { price, ...rest } = draft.values;
    const band = price ? PRICE_BANDS[price] : null;
    setSheetOpen(false);
    apply({
      ...rest,
      minPrice: band?.min ? String(band.min) : null,
      maxPrice: band?.max ? String(band.max) : null,
      hideSold: draft.hideSold ? "1" : null,
    });
  }

  return (
    <div>
      {searchOpen && (
        <form
          role="search"
          className="mb-4 flex items-center gap-4 border-b border-rule pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: queryInput.trim() || null });
          }}
        >
          <input
            autoFocus
            type="search"
            aria-label="Search the archive"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search title or brand"
            className="field-input flex-1 border-b-0"
          />
          <button type="submit" className="btn-primary h-10 px-4">
            Search
          </button>
          <button
            type="button"
            aria-label="Close search"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-ink hover:opacity-60"
            onClick={() => {
              setSearchOpen(false);
              setQueryInput("");
              apply({ q: null });
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <path d="M1.5 1.5l13 13M14.5 1.5l-13 13" />
            </svg>
          </button>
        </form>
      )}

      {/* Phones: one row — a Filters button (opens a bottom sheet) and Sort. */}
      <div className="flex items-center justify-between gap-2.5 min-[640px]:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          className={`pill ${activeCount + (hideSold ? 1 : 0) > 0 ? "border-ink" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M1 4h14M4 8h8M6.5 12h3" />
          </svg>
          Filters
          {activeCount + (hideSold ? 1 : 0) > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-cream">{activeCount + (hideSold ? 1 : 0)}</span>
          )}
        </button>
        <Dropdown label={`Sort: ${sortLabel}`} options={SORTS} selected={sort} align="right" onSelect={(value) => apply({ sort: value })} />
      </div>

      {sheetOpen && (
        <FilterSheet
          groups={sheetGroups}
          initial={{
            values: { ...Object.fromEntries(filters.map((f) => [f.key, searchParams.get(f.key)])), price: priceKey },
            hideSold,
          }}
          onApply={applyDraft}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {/* Tablet and up: every filter as its own pill. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5 max-[639px]:hidden">
        {filters.map((f) => {
          const current = searchParams.get(f.key);
          const selectedLabel = f.options.find((o) => o.value === current)?.label;
          return (
            <Dropdown
              key={f.key}
              label={selectedLabel ? `${f.label}: ${selectedLabel}` : f.label}
              options={[{ value: null, label: "All" }, ...f.options]}
              selected={current}
              onSelect={(value) => apply({ [f.key]: value })}
            />
          );
        })}

        <Dropdown
          label={priceKey ? `Price: ${PRICE_BANDS[priceKey].label}` : "Price"}
          options={[{ value: null, label: "All" }, ...Object.entries(PRICE_BANDS).map(([key, band]) => ({ value: key, label: band.label }))]}
          selected={priceKey}
          onSelect={(key) => {
            const band = key ? PRICE_BANDS[key] : null;
            apply({
              minPrice: band?.min ? String(band.min) : null,
              maxPrice: band?.max ? String(band.max) : null,
            });
          }}
        />

        <button
          type="button"
          aria-pressed={hideSold}
          onClick={() => apply({ hideSold: hideSold ? null : "1" })}
          className={`pill ${hideSold ? "border-ink bg-ink text-cream hover:bg-hover-dark" : ""}`}
        >
          Hide sold
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => apply(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))}
            className="h-9 px-2 font-mono text-micro uppercase tracking-label text-grey underline-offset-4 hover:text-ink hover:underline"
          >
            Clear filters ({activeCount})
          </button>
        )}

        <div className="ml-auto">
          <Dropdown
            label={`Sort: ${sortLabel}`}
            options={SORTS}
            selected={sort}
            align="right"
            onSelect={(value) => apply({ sort: value })}
          />
        </div>
      </div>
    </div>
  );
}
