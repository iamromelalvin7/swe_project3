"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { authFetch } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { OrderSummary, PageResponse } from "@/lib/types";

export default function OrdersPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    if (!user) return;
    setError(false);
    authFetch<PageResponse<OrderSummary>>("/api/orders", user.token)
      .then((res) => setOrders(res.items))
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (ready && !user) {
      router.push("/login?redirect=/orders");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  return (
    <main>
      <Header />
      <div className="px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7">
        <h1 className="mb-9 font-serif text-[56px] max-[640px]:text-[38px]">My orders</h1>

        {!orders && !error && (
          <div className="border-t border-rule py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-b border-rule py-6">
                <div className="h-2.5 w-[30%] animate-pulse bg-skeleton" />
                <div className="mt-3 h-2.5 w-[15%] animate-pulse bg-skeleton" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="border-t border-rule py-20 text-center">
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-signal">Request failed</div>
            <div className="mb-2.5 font-serif text-[28px]">Your orders did not load</div>
            <div className="mb-6 text-sm text-grey">The shop is reachable but the listing request failed.</div>
            <button
              onClick={load}
              className="h-12 bg-ink px-6 font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
            >
              Try again
            </button>
          </div>
        )}

        {orders && orders.length === 0 && (
          <div className="border-t border-rule py-20">
            <div className="mb-2.5 font-serif text-[26px]">No orders yet</div>
            <Link href="/products" className="border-b border-ink pb-[3px] font-mono text-[11px] uppercase tracking-[0.1em]">
              Browse the catalog
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div>
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="grid grid-cols-[120px_150px_1fr_130px_150px] items-baseline gap-5 border-t border-rule py-6 hover:bg-hover-light max-[640px]:grid-cols-2"
              >
                <div className="font-mono text-sm">{o.orderNumber}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
                  {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                <div className="text-sm">
                  {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                </div>
                <div className="text-right font-mono text-sm max-[640px]:text-left">{formatMoney(o.totalPesewas)}</div>
                <div className="text-right font-mono text-[11px] uppercase tracking-[0.1em] max-[640px]:text-left">
                  {o.status.replace(/_/g, " ")}
                </div>
              </Link>
            ))}
            <div className="border-t border-rule" />
          </div>
        )}
      </div>
    </main>
  );
}
