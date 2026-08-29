"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { authFetch } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { AdminProductSummary, PageResponse, ProductStatus } from "@/lib/types";

const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function AdminProductsInner() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const qParam = searchParams.get("q") ?? "";
  const [q, setQ] = useState(qParam);
  const [products, setProducts] = useState<AdminProductSummary[] | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    if (user?.role !== "ADMIN") return;
    setError(false);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (qParam) params.set("q", qParam);
    authFetch<PageResponse<AdminProductSummary>>(`/api/admin/products?${params.toString()}`, user.token)
      .then((res) => setProducts(res.items))
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (ready && (!user || user.role !== "ADMIN")) {
      router.push("/login?redirect=/admin/products");
      return;
    }
    setProducts(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, statusFilter, qParam]);

  function pushParams(next: { status?: string; q?: string }) {
    const params = new URLSearchParams();
    const status = next.status !== undefined ? next.status : statusFilter;
    const query = next.q !== undefined ? next.q : qParam;
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const qs = params.toString();
    router.push(qs ? `/admin/products?${qs}` : "/admin/products");
  }

  return (
    <AdminShell>
      <div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[56px] max-[640px]:text-[38px]">Products</h1>
          <Link
            href="/admin/products/new"
            className="h-11 bg-ink px-6 font-mono text-[11px] uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
          >
            <span className="flex h-full items-center">+ New product</span>
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {["", ...STATUSES].map((s) => (
              <button
                key={s || "all"}
                onClick={() => pushParams({ status: s })}
                className={`h-9 border px-3.5 font-mono text-[11px] uppercase tracking-[0.08em] ${
                  statusFilter === s ? "border-ink bg-ink text-white" : "border-rule text-grey hover:text-ink"
                }`}
              >
                {s ? s.replace(/_/g, " ") : "All"}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              pushParams({ q });
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or brand"
              className="field-input h-9 w-56"
            />
          </form>
        </div>

        {!products && !error && (
          <div className="border-t border-rule py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-b border-rule py-4">
                <div className="h-2.5 w-full max-w-[600px] animate-pulse bg-skeleton" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="border-t border-rule py-20 text-center">
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-signal">Request failed</div>
            <div className="mb-2.5 font-serif text-[28px]">Products did not load</div>
            <div className="mb-6 text-sm text-grey">The shop is reachable but the listing request failed.</div>
            <button
              onClick={load}
              className="h-12 bg-ink px-6 font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
            >
              Try again
            </button>
          </div>
        )}

        {products && products.length === 0 && (
          <div className="border-t border-rule py-16 text-center text-sm text-grey">No products match.</div>
        )}

        {products && products.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[56px_1fr_130px_90px_110px_80px_130px_120px] items-center gap-4 border-b border-rule pb-3.5">
                {["", "Title", "Category", "Size", "Price", "Stock", "Availability", "Status"].map((h, i) => (
                  <div key={h || "photo"} className={`font-mono text-[11px] uppercase tracking-[0.1em] text-grey ${i >= 4 ? "text-right" : ""}`}>
                    {h}
                  </div>
                ))}
              </div>
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="grid grid-cols-[56px_1fr_130px_90px_110px_80px_130px_120px] items-center gap-4 border-b border-rule py-3 hover:bg-hover-light"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-[3px] border border-rule bg-white">
                    {p.primaryThumbUrl && <img src={p.primaryThumbUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 truncate text-sm">{p.title}</div>
                  <div className="truncate text-sm text-grey">{p.categoryName}</div>
                  <div className="font-mono text-[13px] text-grey">{p.sizeLabel}</div>
                  <div className="text-right font-mono text-[13px]">{formatMoney(p.pricePesewas)}</div>
                  <div className="text-right font-mono text-[13px] text-grey">{p.stockQuantity}</div>
                  <div className="text-right font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
                    {p.availability.replace(/_/g, " ")}
                  </div>
                  <div
                    className={`text-right font-mono text-[11px] uppercase tracking-[0.1em] ${
                      p.status === "ARCHIVED" ? "text-signal" : "text-ink"
                    }`}
                  >
                    {p.status}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
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
