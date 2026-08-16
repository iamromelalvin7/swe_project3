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

  useEffect(() => {
    if (ready && !user) {
      router.push("/login?redirect=/orders");
      return;
    }
    if (user) {
      authFetch<PageResponse<OrderSummary>>("/api/orders", user.token).then((res) => setOrders(res.items));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  return (
    <main>
      <Header />
      <div className="px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7">
        <h1 className="mb-9 font-serif text-[56px] max-[640px]:text-[38px]">My orders</h1>

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
