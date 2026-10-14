"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminPageHeader, FilterRow, FilterToggle, ListFooter, ListSkeleton } from "@/components/admin/AdminPageHeader";
import { StatusChip } from "@/components/admin/StatusChip";
import { ProductThumb } from "@/components/ProductImage";
import { ErrorState } from "@/components/States";
import { availabilityChip, productStatusChip } from "@/lib/adminStatus";
import { formatMoney } from "@/lib/money";
import { useAdmin } from "@/lib/useAdmin";
import { useCounts, usePagedList } from "@/lib/usePagedList";
import type { AdminProductSummary, ProductStatus } from "@/lib/types";

const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function stockClass(stock: number) {
  return stock === 0 ? "text-signal" : stock === 1 ? "text-warning" : "text-ink";
}

function AdminProductsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const qParam = searchParams.get("q") ?? "";
  const qs = new URLSearchParams();
  if (statusFilter) qs.set("status", statusFilter);
  if (qParam) qs.set("q", qParam);
  const admin = useAdmin(`/admin/products${qs.toString() ? `?${qs}` : ""}`);
  const [q, setQ] = useState(qParam);

  useEffect(() => setQ(qParam), [qParam]);

  const list = usePagedList<AdminProductSummary>(admin ? `/api/admin/products?${qs.toString()}` : null, !!admin);

  const qPart = qParam ? `&q=${encodeURIComponent(qParam)}` : "";
  const counts = useCounts(
    admin
      ? {
          all: `/api/admin/products?${qPart.slice(1)}`,
          ...Object.fromEntries(STATUSES.map((s) => [s, `/api/admin/products?status=${s}${qPart}`])),
        }
      : null,
    !!admin
  );

  function pushParams(next: { status?: string; q?: string }) {
    const params = new URLSearchParams();
    const status = next.status !== undefined ? next.status : statusFilter;
    const query = next.q !== undefined ? next.q : qParam;
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const s = params.toString();
    router.push(s ? `/admin/products?${s}` : "/admin/products");
  }

  const filtered = !!statusFilter || !!qParam;

  return (
    <AdminShell>
      <AdminPageHeader
        title="Products"
        actions={
          <Link href="/admin/products/new" className="btn-primary h-11">
            + New product
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <FilterRow label="Filter by status">
          {["", ...STATUSES].map((s) => (
            <FilterToggle key={s || "all"} active={statusFilter === s} count={counts[s || "all"]} onClick={() => pushParams({ status: s })}>
              {s ? productStatusChip(s as ProductStatus).label : "All"}
            </FilterToggle>
          ))}
        </FilterRow>
        <form
          role="search"
          className="flex w-full max-w-[340px] items-center gap-2 max-[640px]:max-w-none"
          onSubmit={(e) => {
            e.preventDefault();
            pushParams({ q: q.trim() });
          }}
        >
          <input
            type="search"
            aria-label="Search products by title or brand"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or brand"
            className="field-input h-10 flex-1"
          />
          <button type="submit" className="btn-outline h-10 px-4">
            Search
          </button>
        </form>
      </div>

      {list.error && <ErrorState title="Products didn't load" onRetry={list.reload} />}

      {!list.error && !list.items && <ListSkeleton />}

      {list.items && list.items.length === 0 && (
        <div className="border-t border-rule py-16 text-center">
          <div className="mb-2 font-serif text-h3">{filtered ? "No products match" : "No products yet"}</div>
          <p className="mb-6 text-sm text-grey">
            {filtered ? "Try a different status or search." : "Add your first piece to start the archive."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {filtered && (
              <Link href="/admin/products" className="btn-outline h-11">
                Clear filters
              </Link>
            )}
            <Link href="/admin/products/new" className="btn-primary h-11">
              + New product
            </Link>
          </div>
        </div>
      )}

      {list.items && list.items.length > 0 && (
        <>
          {/* Desktop: table */}
          <table className="admin-table max-[1099px]:hidden">
            <thead>
              <tr>
                <th scope="col" className="w-[60px]">
                  <span className="sr-only">Photo</span>
                </th>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Size</th>
                <th scope="col" className="text-right">
                  Price
                </th>
                <th scope="col" className="text-right">
                  Stock
                </th>
                <th scope="col">Availability</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <ProductThumb src={p.primaryThumbUrl} alt="" className="w-11" />
                  </td>
                  <td className="max-w-[320px]">
                    <Link href={`/admin/products/${p.id}/edit`} className="row-link block truncate font-serif text-title hover:text-grey">
                      {p.title}
                    </Link>
                    <div className="mt-0.5 truncate font-mono text-micro uppercase tracking-label text-grey">{p.brand}</div>
                  </td>
                  <td className="text-grey">{p.categoryName}</td>
                  <td className="font-mono text-meta text-grey">{p.sizeLabel}</td>
                  <td className="text-right font-mono text-meta">{formatMoney(p.pricePesewas)}</td>
                  <td className={`text-right font-mono text-meta ${stockClass(p.stockQuantity)}`}>{p.stockQuantity}</td>
                  <td>
                    <StatusChip chip={availabilityChip(p.availability)} />
                  </td>
                  <td>
                    <StatusChip chip={productStatusChip(p.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile & tablet: cards */}
          <ul className="border-t border-rule min-[1100px]:hidden">
            {list.items.map((p) => (
              <li key={p.id} className="border-b border-rule">
                <Link href={`/admin/products/${p.id}/edit`} className="flex gap-4 py-4 hover:bg-hover-light">
                  <ProductThumb src={p.primaryThumbUrl} alt="" className="w-16" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-micro uppercase tracking-label text-grey">
                      {p.brand} · {p.sizeLabel} · {p.categoryName}
                    </div>
                    <div className="mt-1 font-serif text-title">{p.title}</div>
                    <div className="mt-1 flex items-center gap-3 font-mono text-meta tabular-nums">
                      <span>{formatMoney(p.pricePesewas)}</span>
                      <span className={stockClass(p.stockQuantity)}>Stock {p.stockQuantity}</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <StatusChip chip={productStatusChip(p.status)} />
                      <StatusChip chip={availabilityChip(p.availability)} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <ListFooter
            shown={list.items.length}
            total={list.totalItems}
            noun={list.totalItems === 1 ? "product" : "products"}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
            moreError={list.moreError}
            onLoadMore={list.loadMore}
          />
        </>
      )}
    </AdminShell>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense>
      <AdminProductsInner />
    </Suspense>
  );
}
