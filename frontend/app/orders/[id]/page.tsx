"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConfirmDialog } from "@/components/Dialog";
import { ProductThumb } from "@/components/ProductImage";
import { ErrorState, FormError } from "@/components/States";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { authFetch, ApiRequestError } from "@/lib/api";
import { formatStatus } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { OrderDetail } from "@/lib/types";
import { ORDER_POLL_MS, orderMayChange, usePolling } from "@/lib/usePolling";

const ORDERS_HREF = "/account?tab=orders";

function OrderDetailInner() {
  const { ready, user } = useAuth();
  const { refresh } = useCart();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "1";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const cancelSeq = useRef(0);

  const load = () => {
    if (!user) return;
    setLoadError(null);
    authFetch<OrderDetail>(`/api/orders/${params.id}`)
      .then(setOrder)
      .catch((err) => setLoadError(err instanceof ApiRequestError ? err.error.message : "Check your connection and try again."));
  };

  useEffect(() => {
    if (ready && !user) {
      router.push(`/login?redirect=/orders/${params.id}`);
      return;
    }
    if (user) {
      load();
      if (justPlaced) refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, params.id]);

  // Status changes made by the shop show up without a refresh. Paused during a
  // cancel, and a poll that started before the cancel is dropped, so a slow
  // response can't put the old status back.
  usePolling(
    () => {
      const seq = cancelSeq.current;
      authFetch<OrderDetail>(`/api/orders/${params.id}`)
        .then((latest) => seq === cancelSeq.current && setOrder(latest))
        .catch(() => {});
    },
    ORDER_POLL_MS,
    !!user && !!order && orderMayChange(order) && !confirmingCancel && !cancelling
  );

  async function cancel() {
    if (!user || !order) return;
    cancelSeq.current += 1;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await authFetch<OrderDetail>(`/api/orders/${order.id}/cancel`, { method: "POST" });
      setOrder(updated);
      setConfirmingCancel(false);
    } catch (err) {
      setCancelError(err instanceof ApiRequestError ? err.error.message : "Couldn't cancel this order. Try again.");
      setConfirmingCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  if (loadError) {
    return (
      <>
        <Header />
        <main className="page-container">
          <ErrorState title="This order didn't load" message={loadError} onRetry={load} className="py-24" />
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <main aria-busy="true" className="page-container pb-24 pt-10 max-[640px]:pt-6">
          <div className="max-w-[640px]">
            <div className="skeleton h-2.5 w-24" />
            <div className="skeleton mt-4 h-12 w-64" />
            <div className="mt-11 border-t border-rule">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between border-b border-rule py-4">
                  <div className="skeleton h-2.5 w-24" />
                  <div className="skeleton h-2.5 w-36" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const cashOnDelivery = order.paymentMethod === "CASH_ON_DELIVERY";
  const paid = order.paymentStatus === "PAID";
  const rows: [string, string][] = [
    ["Order number", order.orderNumber],
    ["Status", formatStatus(order.status)],
    ["Delivering to", order.deliveryName],
    ["Phone", order.deliveryPhone],
    ["Address", `${order.deliveryAddress} · ${order.deliveryZoneName}`],
    ["Payment", `${cashOnDelivery ? "Cash on delivery" : "Mobile Money / card"}${paid ? " · Paid" : ""}`],
    ["Subtotal", formatMoney(order.subtotalPesewas)],
    ["Delivery", formatMoney(order.deliveryFeePesewas)],
    [cashOnDelivery && !paid ? "Total due on delivery" : "Total", formatMoney(order.totalPesewas)],
  ];

  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

  return (
    <>
      <Header />
      <main className="page-container pb-24 pt-10 max-[640px]:pb-14 max-[640px]:pt-6">
        <div className="max-w-[640px]">
          {justPlaced ? (
            <>
              <p className="eyebrow">Order confirmed</p>
              <h1 className="mt-3 font-serif text-h1 max-[640px]:text-h2">Thank you</h1>
              <p className="mt-4 max-w-[46ch] text-body text-grey">
                We have your order and the pieces are set aside for you. We&apos;ll call within a working day to arrange delivery.
              </p>
            </>
          ) : (
            <>
              <Link href={ORDERS_HREF} className="link-quiet mb-6 inline-block">
                ← My orders
              </Link>
              <h1 className="font-serif text-h1 max-[640px]:text-h2">{order.orderNumber}</h1>
              <p className="mt-3 font-mono text-label uppercase tracking-label text-grey">{formatStatus(order.status)}</p>
            </>
          )}

          <div className="mt-8">
            <FormError message={cancelError} />
          </div>

          <dl className="mt-3 border-b border-rule">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 border-t border-rule py-[15px]">
                <dt className="eyebrow">{label}</dt>
                <dd className="text-right text-sm">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="eyebrow mt-11 pb-3.5">Pieces</h2>
          <ul className="border-b border-rule">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-5 border-t border-rule py-5">
                <ProductThumb src={item.imageUrl} alt="" />
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-title">{item.productTitle}</div>
                  <div className="mt-1 font-mono text-micro uppercase tracking-label text-grey">
                    Size {item.productSize}
                    {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                  </div>
                </div>
                <div className="text-right font-mono text-meta">{formatMoney(item.pricePesewas * item.quantity)}</div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            {justPlaced ? (
              <>
                <Link href={ORDERS_HREF} className="btn-primary h-[50px] px-7">
                  View my orders
                </Link>
                <Link href="/products#archive" className="link-underline">
                  Keep browsing
                </Link>
              </>
            ) : (
              canCancel && (
                <button type="button" onClick={() => setConfirmingCancel(true)} className="btn-outline">
                  Cancel order
                </button>
              )
            )}
          </div>
        </div>

        {confirmingCancel && (
          <ConfirmDialog
            title="Cancel this order?"
            body="The pieces go back into the archive and someone else can buy them. This can't be undone."
            confirmLabel="Cancel order"
            danger
            busy={cancelling}
            onConfirm={cancel}
            onCancel={() => setConfirmingCancel(false)}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetailInner />
    </Suspense>
  );
}
