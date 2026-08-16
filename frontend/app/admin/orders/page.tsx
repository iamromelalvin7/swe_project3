"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { authFetch } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { AdminOrderSummary, OrderStatus, PageResponse } from "@/lib/types";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

function AdminOrdersInner() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    if (user?.role !== "ADMIN") return;
    setError(false);
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    authFetch<PageResponse<AdminOrderSummary>>(`/api/admin/orders${qs}`, user.token)
      .then((res) => setOrders(res.items))
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (ready && (!user || user.role !== "ADMIN")) {
      router.push("/login?redirect=/admin/orders");
      return;
    }
    setOrders(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, statusFilter]);

  return (
    <AdminShell>
      <div>
        <h1 className="mb-8 font-serif text-[56px] max-[640px]:text-[38px]">Orders</h1>

        <div className="mb-8 flex flex-wrap gap-3">
          {["", ...STATUSES].map((s) => (
            <button
              key={s || "all"}
              onClick={() => router.push(s ? `/admin/orders?status=${s}` : "/admin/orders")}
              className={`h-9 border px-3.5 font-mono text-[11px] uppercase tracking-[0.08em] ${
                statusFilter === s ? "border-ink bg-ink text-white" : "border-rule text-grey hover:text-ink"
              }`}
            >
              {s ? s.replace(/_/g, " ") : "All"}
            </button>
          ))}
        </div>

        {!orders && !error && (
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
            <div className="mb-2.5 font-serif text-[28px]">Orders did not load</div>
            <div className="mb-6 text-sm text-grey">The shop is reachable but the listing request failed.</div>
            <button
              onClick={load}
              className="h-12 bg-ink px-6 font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
            >
              Try again
            </button>
          </div>
        )}

        {orders && orders.length === 0 && <div className="border-t border-rule py-16 text-center text-sm text-grey">No orders match.</div>}

        {orders && orders.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[110px_150px_130px_130px_70px_130px_100px_130px] gap-4 border-b border-rule pb-3.5">
                {["Order", "Customer", "Phone", "Zone", "Items", "Total", "Payment", "Status"].map((h, i) => (
                  <div key={h} className={`font-mono text-[11px] uppercase tracking-[0.1em] text-grey ${i >= 5 ? "text-right" : ""}`}>
                    {h}
                  </div>
                ))}
              </div>
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="grid grid-cols-[110px_150px_130px_130px_70px_130px_100px_130px] items-center gap-4 border-b border-rule py-[18px] hover:bg-hover-light"
                >
                  <div className="font-mono text-[13px]">{o.orderNumber}</div>
                  <div className="text-sm">{o.customerName}</div>
                  <div className="font-mono text-[13px] text-grey">{o.customerPhone}</div>
                  <div className="text-sm">{o.zoneName}</div>
                  <div className="font-mono text-[13px] text-grey">{o.itemCount}</div>
                  <div className="text-right font-mono text-[13px]">{formatMoney(o.totalPesewas)}</div>
                  <div className={`text-right font-mono text-[11px] uppercase tracking-[0.1em] ${o.paymentStatus === "PAID" ? "text-ink" : "text-signal"}`}>
                    {o.paymentStatus}
                  </div>
                  <div className="text-right font-mono text-[11px] uppercase tracking-[0.1em]">{o.status.replace(/_/g, " ")}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
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
