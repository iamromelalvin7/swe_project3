"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CATALOG_PAGE_SIZE, orderForDisplay } from "@/lib/catalog";
import type { PageResponse, ProductSummary } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ initial, hideSold }: { initial: PageResponse<ProductSummary>; hideSold: boolean }) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  async function loadMore() {
    setLoadingMore(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("hideSold");
      params.delete("search");
      params.set("page", String(page + 1));
      params.set("pageSize", String(CATALOG_PAGE_SIZE));
      const next = await apiFetch<PageResponse<ProductSummary>>(`/api/products?${params.toString()}`);
      setItems((prev) => [...prev, ...next.items]);
      setPage(next.page);
      setTotalPages(next.totalPages);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const ordered = orderForDisplay(items, searchParams.get("sort"));
  const visible = hideSold ? ordered.filter((p) => p.status === "AVAILABLE") : ordered;

  if (visible.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="mb-2.5 font-serif text-h3">{hideSold && items.length > 0 ? "Everything here has sold." : "No pieces on this rack."}</div>
        <p className="mb-6 text-sm text-grey">Try another size or clear a filter to see what is available.</p>
        <Link href="/products#archive" className="link-underline">
          Show all pieces →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-4 gap-x-8 gap-y-12 max-[1100px]:gap-x-6 max-[900px]:grid-cols-2 max-[900px]:gap-x-5 max-[900px]:gap-y-9 max-[430px]:gap-x-4 max-[430px]:gap-y-8">
        {visible.map((p, i) => (
          <li key={p.id}>
            <ProductCard product={p} index={i} />
          </li>
        ))}
      </ul>
      {page + 1 < totalPages && (
        <div className="mt-16 text-center">
          <button type="button" onClick={loadMore} disabled={loadingMore} className="link-underline disabled:opacity-50">
            {loadingMore ? "Loading…" : "Load more"}
          </button>
          {loadError && <p className="form-error mt-4">Couldn&apos;t load more pieces. Try again.</p>}
        </div>
      )}
    </div>
  );
}
