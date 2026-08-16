"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { authFetch, ApiRequestError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { OrderDetail } from "@/lib/types";

function OrderDetailInner() {
  const { ready, user } = useAuth();
  const { refresh } = useCart();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "1";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (ready && !user) {
      router.push(`/login?redirect=/orders/${params.id}`);
      return;
    }
    if (user) {
      authFetch<OrderDetail>(`/api/orders/${params.id}`, user.token)
        .then(setOrder)
        .catch((err) => setError(err instanceof ApiRequestError ? err.error.message : "Could not load this order."));
      if (justPlaced) refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, params.id]);

  async function cancel() {
    if (!user || !order) return;
    setCancelling(true);
    try {
      const updated = await authFetch<OrderDetail>(`/api/orders/${order.id}/cancel`, user.token, { method: "POST" });
      setOrder(updated);
    } finally {
      setCancelling(false);
    }
  }

  if (error) {
    return (
      <main>
        <Header />
        <div className="px-14 py-24 text-center max-[640px]:px-5">
          <div className="mb-2.5 font-serif text-[28px]">Order not found</div>
          <div className="text-sm text-grey">{error}</div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main>
        <Header />
        <div className="px-14 py-24 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Loading…</div>
      </main>
    );
  }

  const rows: [string, string][] = [
    ["Order number", order.orderNumber],
    ["Delivering to", order.deliveryName],
    ["Phone", order.deliveryPhone],
    ["Address", `${order.deliveryAddress} · ${order.deliveryZoneName}`],
    ["Payment", order.paymentMethod === "CASH_ON_DELIVERY" ? "Cash on delivery" : "Mobile Money / Card"],
    ["Total paid", formatMoney(order.totalPesewas)],
  ];

  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

  return (
    <main>
      <Header />
      <div className="max-w-[640px] px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7">
        {justPlaced ? (
          <>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Order confirmed</div>
            <h1 className="mt-3.5 font-serif text-[56px] max-[640px]:text-[38px]">Thank you</h1>
            <div className="mt-4 max-w-[46ch] text-[15px] text-grey">
              We have your order and the pieces are held for you. Delivery is arranged by phone within a working day.
            </div>
          </>
        ) : (
          <>
            <Link href="/orders" className="mb-6 inline-block font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink">
              ← My orders
            </Link>
            <h1 className="font-serif text-[56px] max-[640px]:text-[38px]">{order.orderNumber}</h1>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{order.status.replace(/_/g, " ")}</div>
          </>
        )}

        <div className="mt-11">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6 border-t border-rule py-[15px]">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{label}</span>
              <span className="text-right text-sm">{value}</span>
            </div>
          ))}
          <div className="border-t border-rule" />
        </div>

        <div className="mt-11">
          <div className="pb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Items</div>
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-5 border-t border-rule py-5">
              <div
                className="aspect-[3/4] w-16 flex-shrink-0 rounded-[4px] bg-white bg-cover bg-center"
                style={
                  item.imageUrl
                    ? { backgroundImage: `url(${item.imageUrl})` }
                    : { backgroundImage: "repeating-linear-gradient(135deg, #F4F2ED 0 7px, #FFFFFF 7px 14px)" }
                }
              />
              <div className="flex-1">
                <div className="text-[15px]">{item.productTitle}</div>
                <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{item.productSize}</div>
              </div>
              <div className="font-mono text-[13px] text-grey">Qty {item.quantity}</div>
              <div className="w-[120px] text-right font-mono text-sm">{formatMoney(item.pricePesewas)}</div>
            </div>
          ))}
          <div className="border-t border-rule" />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          {justPlaced ? (
            <>
              <Link
                href="/orders"
                className="h-[50px] bg-ink px-7 font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark flex items-center"
              >
                View my orders
              </Link>
              <Link href="/products" className="border-b border-ink pb-[3px] font-mono text-[11px] uppercase tracking-[0.1em] hover:text-grey hover:border-grey">
                Keep browsing
              </Link>
            </>
          ) : (
            canCancel && (
              <button
                onClick={cancel}
                disabled={cancelling}
                className="h-12 border border-ink px-6 font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-ink hover:text-white disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel order"}
              </button>
            )
          )}
        </div>
      </div>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetailInner />
    </Suspense>
  );
}
