"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { authFetch, ApiRequestError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { OrderDetail, OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function AdminOrderDetailPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (user?.role !== "ADMIN") return;
    setLoadError(false);
    authFetch<OrderDetail>(`/api/admin/orders/${params.id}`, user.token)
      .then(setOrder)
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    if (ready && (!user || user.role !== "ADMIN")) {
      router.push("/login?redirect=/admin/orders");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, params.id]);

  if (loadError) {
    return (
      <AdminShell>
        <div className="py-24 text-center">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-signal">Request failed</div>
          <div className="mb-2.5 font-serif text-[28px]">This order did not load</div>
          <div className="mb-6 text-sm text-grey">The shop is reachable but the order request failed.</div>
          <button
            onClick={load}
            className="h-12 bg-ink px-6 font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
          >
            Try again
          </button>
        </div>
      </AdminShell>
    );
  }

  async function advance(status: OrderStatus) {
    if (!user || !order) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await authFetch<OrderDetail>(`/api/admin/orders/${order.id}/status`, user.token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrder(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.error.message : "Could not update this order.");
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return (
      <AdminShell>
        <div className="py-24 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Loading…</div>
      </AdminShell>
    );
  }

  const stepIndex = STEPS.indexOf(order.status);
  const nextStep = stepIndex >= 0 && stepIndex < STEPS.length - 1 ? STEPS[stepIndex + 1] : null;
  const canCancel = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  return (
    <AdminShell>
      <div>
        <div className="mb-10 flex items-center gap-4.5 border-b border-rule pb-5">
          <Link href="/admin/orders" className="font-mono text-[11px] text-grey hover:text-ink">
            ←
          </Link>
          <div className="font-mono text-[28px]">{order.orderNumber}</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{order.status.replace(/_/g, " ")}</div>
        </div>

        {error && <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{error}</div>}

        <div className="grid grid-cols-[1fr_320px] items-start gap-14 max-[900px]:grid-cols-1">
          <div>
            <div className="pb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Delivery</div>
            {(
              [
                ["Name", order.deliveryName],
                ["Phone", order.deliveryPhone],
                ["Address", order.deliveryAddress],
                ["Zone", order.deliveryZoneName],
                ["Placed", new Date(order.createdAt).toLocaleString("en-GB")],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 border-t border-rule py-[15px]">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{label}</span>
                <span className="text-right text-sm">{value}</span>
              </div>
            ))}
            <div className="border-t border-rule" />

            <div className="mt-12 flex items-baseline justify-between pb-3.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Items</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{order.items.length} items</span>
            </div>
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

          <div>
            <div className="flex justify-between border-t border-rule py-3.5 font-mono text-[13px]">
              <span className="text-grey">Subtotal</span>
              <span>{formatMoney(order.subtotalPesewas)}</span>
            </div>
            <div className="flex justify-between border-t border-rule py-3.5 font-mono text-[13px]">
              <span className="text-grey">Delivery fee</span>
              <span>{formatMoney(order.deliveryFeePesewas)}</span>
            </div>
            <div className="flex justify-between border-t border-b border-rule py-3.5 font-mono text-base">
              <span>Total</span>
              <span>{formatMoney(order.totalPesewas)}</span>
            </div>
            <div className="flex justify-between border-b border-rule py-3.5 font-mono text-[11px] uppercase tracking-[0.1em]">
              <span className="text-grey">Payment</span>
              <span>{order.paymentMethod === "CASH_ON_DELIVERY" ? "Cash on delivery" : "Mobile Money · Paystack"}</span>
            </div>

            <div className="mb-3.5 mt-11 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Status</div>
            <div className="flex flex-wrap gap-x-3 gap-y-2.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`border-b pb-0.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
                    i <= stepIndex ? "border-ink text-ink" : "border-transparent text-grey"
                  }`}
                >
                  {s.replace(/_/g, " ")}
                  {i < STEPS.length - 1 ? "  →" : ""}
                </span>
              ))}
            </div>

            {nextStep && (
              <button
                disabled={busy}
                onClick={() => advance(nextStep)}
                className="mt-9 h-[52px] w-full bg-ink font-mono text-[11px] uppercase tracking-[0.12em] text-white hover:bg-hover-dark disabled:opacity-50"
              >
                Mark as {nextStep.replace(/_/g, " ").toLowerCase()}
              </button>
            )}
            {canCancel && (
              <button
                disabled={busy}
                onClick={() => advance("CANCELLED")}
                className="mt-3 h-12 w-full border border-ink font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-ink hover:text-white disabled:opacity-50"
              >
                Cancel order
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
