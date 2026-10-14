"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderCards } from "@/components/admin/OrderCards";
import { StatusChip } from "@/components/admin/StatusChip";
import { ErrorState } from "@/components/States";
import { authFetch } from "@/lib/api";
import { formatShortDate } from "@/lib/adminDates";
import { orderStatusChip, paymentChip } from "@/lib/adminStatus";
import { formatMoney } from "@/lib/money";
import { useAdmin } from "@/lib/useAdmin";
import { ADMIN_PAGE_SIZE } from "@/lib/usePagedList";
import type { AdminDashboard, AdminProductSummary, PageResponse } from "@/lib/types";

type Inventory = { onHold: number; soldOutPublished: number; drafts: number };

/** Walks every published product (plus the draft count) to find what needs the owner's attention. */
async function loadInventory(): Promise<Inventory> {
  let onHold = 0;
  let soldOutPublished = 0;
  for (let page = 0, totalPages = 1; page < totalPages && page < 20; page++) {
    const res = await authFetch<PageResponse<AdminProductSummary>>(
      `/api/admin/products?status=PUBLISHED&page=${page}&pageSize=${ADMIN_PAGE_SIZE}`
    );
    totalPages = res.totalPages;
    for (const p of res.items) {
      if (p.availability === "RESERVED") onHold++;
      if (p.availability === "SOLD_OUT") soldOutPublished++;
    }
  }
  const drafts = await authFetch<PageResponse<AdminProductSummary>>("/api/admin/products?status=DRAFT&pageSize=1");
  return { onHold, soldOutPublished, drafts: drafts.totalItems };
}

export default function AdminDashboardPage() {
  const admin = useAdmin("/admin/dashboard");
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!admin) return;
    setError(false);
    authFetch<AdminDashboard>("/api/admin/dashboard")
      .then(setData)
      .catch(() => setError(true));
    // The attention strip is a bonus — if it fails the dashboard still works.
    loadInventory()
      .then(setInventory)
      .catch(() => setInventory(null));
  }, [admin]);

  useEffect(() => {
    load();
  }, [load]);

  const header = (
    <AdminPageHeader
      title="Overview"
      actions={
        <>
          <Link href="/products" className="btn-outline h-11">
            View store
          </Link>
          <Link href="/admin/products/new" className="btn-primary h-11">
            + New product
          </Link>
        </>
      }
    />
  );

  if (error) {
    return (
      <AdminShell>
        {header}
        <ErrorState title="The dashboard didn't load" onRetry={load} className="border-t border-rule py-20" />
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell>
        {header}
        <div aria-busy="true" aria-label="Loading">
          <div className="grid grid-cols-2 gap-px border-y border-rule bg-rule min-[900px]:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-cream px-5 py-6">
                <div className="skeleton h-2.5 w-[60%]" />
                <div className="skeleton mt-4 h-7 w-[50%]" />
              </div>
            ))}
          </div>
          <div className="skeleton mt-8 h-24" />
        </div>
      </AdminShell>
    );
  }

  const metrics = [
    { label: "Revenue", value: formatMoney(data.totalRevenuePesewas), note: "Delivered orders" },
    { label: "Orders", value: String(data.orderCount), note: "All time" },
    { label: "Pieces sold", value: String(data.itemsSold), note: "Delivered" },
    { label: "Live stock", value: String(data.liveStockUnits), note: "Units on sale" },
  ];

  const attention = [
    {
      label: "Orders to fulfil",
      value: data.awaitingActionCount,
      href: "/admin/orders",
      hint: "Not yet delivered or cancelled",
    },
    {
      label: "On hold now",
      value: inventory?.onHold,
      href: "/admin/products?status=PUBLISHED",
      hint: "In a shopper's cart for up to 10 minutes",
    },
    {
      label: "Drafts",
      value: inventory?.drafts,
      href: "/admin/products?status=DRAFT",
      hint: "Not visible in the shop yet",
    },
    {
      label: "Sold out, still listed",
      value: inventory?.soldOutPublished,
      href: "/admin/products?status=PUBLISHED",
      hint: "Archive these to tidy the shop",
    },
  ];

  return (
    <AdminShell>
      {header}

      <section aria-label="Totals" className="grid grid-cols-2 gap-px border-y border-rule bg-rule tabular-nums min-[900px]:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0 bg-cream px-5 py-6 max-[640px]:px-4">
            <div className="eyebrow">{m.label}</div>
            <div className="mt-2.5 truncate font-mono text-h3 leading-none max-[640px]:text-xl">{m.value}</div>
            <div className="mt-2 text-xs text-grey">{m.note}</div>
          </div>
        ))}
      </section>

      <section aria-labelledby="attention-heading" className="mt-10">
        <h2 id="attention-heading" className="eyebrow mb-3">
          Needs attention
        </h2>
        <ul className="grid grid-cols-4 gap-3 max-[1099px]:grid-cols-2">
          {attention.map((a) => (
            <li key={a.label}>
              <Link
                href={a.href}
                className={`block h-full border p-4 transition-colors hover:border-ink ${a.value ? "border-ink/30" : "border-rule"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-micro uppercase tracking-label text-grey">{a.label}</span>
                  <span aria-hidden="true" className="text-grey">
                    →
                  </span>
                </div>
                <div className={`mt-2 font-mono text-h3 tabular-nums ${a.value ? "text-ink" : "text-grey"}`}>
                  {a.value === undefined ? <span className="skeleton inline-block h-6 w-8 align-middle" /> : a.value}
                </div>
                <div className="mt-1 text-xs text-grey">{a.hint}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="awaiting-heading" className="mt-12">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="awaiting-heading" className="font-serif text-h3">
            Orders to fulfil
          </h2>
          {data.awaitingActionCount > 0 && (
            <Link href="/admin/orders" className="link-quiet">
              All orders →
            </Link>
          )}
        </div>

        {data.awaitingAction.length === 0 ? (
          <div className="border-t border-rule py-14 text-center">
            <div className="font-serif text-lead">You&apos;re all caught up.</div>
            <p className="mt-2 text-sm text-grey">New orders appear here as soon as a customer checks out.</p>
          </div>
        ) : (
          <>
            <table className="admin-table max-[1099px]:hidden">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Placed</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Zone</th>
                  <th scope="col" className="text-right">
                    Total
                  </th>
                  <th scope="col">Payment</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.awaitingAction.map((o) => (
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
            <OrderCards orders={data.awaitingAction} />
            {data.awaitingActionCount > data.awaitingAction.length && (
              <p className="mt-4 font-mono text-micro uppercase tracking-label text-grey">
                Showing {data.awaitingAction.length} of {data.awaitingActionCount} ·{" "}
                <Link href="/admin/orders" className="text-ink underline underline-offset-4">
                  see all
                </Link>
              </p>
            )}
          </>
        )}
      </section>
    </AdminShell>
  );
}
