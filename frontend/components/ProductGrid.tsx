"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { PageResponse, ProductSummary } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ initial }: { initial: PageResponse<ProductSummary> }) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [totalItems, setTotalItems] = useState(initial.totalItems);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page + 1));
      const next = await apiFetch<PageResponse<ProductSummary>>(`/api/products?${params.toString()}`);
      setItems((prev) => [...prev, ...next.items]);
      setPage(next.page);
      setTotalPages(next.totalPages);
      setTotalItems(next.totalItems);
    } finally {
      setLoadingMore(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="mb-2.5 font-serif text-[28px]">Nothing matches</div>
        <div className="mb-6 text-sm text-grey">No pieces fit that combination of filters right now.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-11 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
        {totalItems} {totalItems === 1 ? "piece" : "pieces"}
      </div>
      <div className="grid grid-cols-4 gap-x-8 gap-y-13 max-[900px]:grid-cols-2 max-[900px]:gap-y-9">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
      {page + 1 < totalPages && (
        <div className="mt-16 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="border-b border-ink pb-[3px] font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:text-grey hover:border-grey disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
