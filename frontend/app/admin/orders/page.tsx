"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminPageHeader, FilterRow, FilterToggle, ListFooter, ListSkeleton } from "@/components/admin/AdminPageHeader";
import { OrderCards } from "@/components/admin/OrderCards";
import { StatusChip } from "@/components/admin/StatusChip";
import { ErrorState } from "@/components/States";
import { orderStatusChip, paymentChip } from "@/lib/adminStatus";
import { DATE_RANGES, formatShortDate, parseRange, rangeStart } from "@/lib/adminDates";
import { formatMoney } from "@/lib/money";
import { useAdmin } from "@/lib/useAdmin";
import { useCounts, usePagedList } from "@/lib/usePagedList";
import type { AdminOrderSummary, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

function AdminOrdersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const range = parseRange(searchParams.get("range"));
  const admin = useAdmin(`/admin/orders${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  const [search, setSearch] = useState("");

  // Computed once per range change so the request URL is stable between renders.
  const from = useMemo(() => rangeStart(range), [range]);
  const rangeQuery = from ? `from=${encodeURIComponent(from)}` : "";

  const listQuery = [statusFilter ? `status=${statusFilter}` : "", rangeQuery].filter(Boolean).join("&");
  const list = usePagedList<AdminOrderSummary>(admin ? `/api/admin/orders?${listQuery}` : null, !!admin);

  const counts = useCounts(
    admin
      ? {
          all: `/api/admin/orders?${rangeQuery}`,
          ...Object.fromEntries(STATUSES.map((s) => [s, `/api/admin/orders?status=${s}${rangeQuery ? `&${rangeQuery}` : ""}`])),
        }
      : null,
    !!admin
  );

  function pushParams(next: { status?: string; range?: string }) {
    const params = new URLSearchParams();
    const status = next.status !== undefined ? next.status : statusFilter;
    const r = next.range !== undefined ? next.range : range;
    if (status) params.set("status", status);
    if (r !== "all") params.set("range", r);
    const s = params.toString();
    router.push(s ? `/admin/orders?${s}` : "/admin/orders");
  }

  const term = search.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!list.items) return null;
    if (!term) return list.items;
    const digits = term.replace(/\D/g, "");
    return list.items.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        (digits.length >= 3 && o.customerPhone.replace(/\D/g, "").includes(digits))
    );
  }, [list.items, term]);

  const filtered = !!statusFilter || range !== "all";

  return (
    <AdminShell>
      <AdminPageHeader title="Orders" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <FilterRow label="Filter by status">
          {["", ...STATUSES].map((s) => (
            <FilterToggle key={s || "all"} active={statusFilter === s} count={counts[s || "all"]} onClick={() => pushParams({ status: s })}>
              {s ? orderStatusChip(s as OrderStatus).label : "All"}
            </FilterToggle>
          ))}
        </FilterRow>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <FilterRow label="Date placed">
          {DATE_RANGES.map((r) => (
            <FilterToggle key={r.value} active={range === r.value} onClick={() => pushParams({ range: r.value })}>
              {r.label}
            </FilterToggle>
          ))}
        </FilterRow>
        <div className="w-full max-w-[340px] max-[640px]:max-w-none">
          <input
            type="search"
            aria-label="Search loaded orders by order number, customer or phone"
            aria-describedby="order-search-scope"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order no., customer or phone"
            className="field-input h-10"
          />
          <p id="order-search-scope" className="mt-1.5 text-xs text-grey">
            Searches the {list.items?.length ?? 0} orders loaded below.
          </p>
        </div>
      </div>

      {list.error && <ErrorState title="Orders didn't load" onRetry={list.reload} />}

      {!list.error && !visible && <ListSkeleton />}

      {visible && visible.length === 0 && (
        <div className="border-t border-rule py-16 text-center">
          <div className="mb-2 font-serif text-h3">{term ? "No loaded orders match" : filtered ? "No orders match" : "No orders yet"}</div>
          <p className="mb-6 text-sm text-grey">
            {term
              ? list.hasMore
                ? "Load more orders below, or check the spelling."
                : "Check the spelling, or try the phone number."
              : filtered
                ? "Try a different status or date range."
                : "Orders appear here as soon as a customer checks out."}
          </p>
          {(filtered || term) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                router.push("/admin/orders");
              }}
              className="btn-outline h-11"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {visible && visible.length > 0 && (
        <>
          <table className="admin-table max-[1099px]:hidden">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Placed</th>
                <th scope="col">Customer</th>
                <th scope="col">Zone</th>
                <th scope="col" className="text-right">
                  Items
                </th>
                <th scope="col" className="text-right">
                  Total
                </th>
                <th scope="col">Payment</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="row-link font-mono text-meta hover:text-grey">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="font-mono text-meta text-grey">{formatShortDate(o.createdAt)}</td>
                  <td>
                    <div>{o.customerName}</div>
                    <div className="font-mono text-micro text-grey">{o.customerPhone}</div>
                  </td>
                  <td className="text-grey">{o.zoneName}</td>
                  <td className="text-right font-mono text-meta text-grey">{o.itemCount}</td>
                  <td className="text-right font-mono text-meta">{formatMoney(o.totalPesewas)}</td>
                  <td>
                    <StatusChip chip={paymentChip(o.paymentStatus)} />
                  </td>
                  <td>
                    <StatusChip chip={orderStatusChip(o.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <OrderCards orders={visible} />

          <ListFooter
            shown={list.items?.length ?? 0}
            total={list.totalItems}
            noun={list.totalItems === 1 ? "order" : "orders"}
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

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersInner />
    </Suspense>
  );
}
