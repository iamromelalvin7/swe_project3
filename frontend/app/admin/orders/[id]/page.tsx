"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusChip } from "@/components/admin/StatusChip";
import { ConfirmDialog } from "@/components/Dialog";
import { ProductThumb } from "@/components/ProductImage";
import { ErrorState, FormError } from "@/components/States";
import { useToast } from "@/components/Toast";
import { authFetch, ApiRequestError } from "@/lib/api";
import { formatDateTime } from "@/lib/adminDates";
import { ORDER_STEPS, nextOrderStep, orderStatusChip } from "@/lib/adminStatus";
import { formatMoney } from "@/lib/money";
import { telLink, whatsappLink } from "@/lib/phone";
import { useAdmin } from "@/lib/useAdmin";
import type { OrderDetail, OrderStatus } from "@/lib/types";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const admin = useAdmin(`/admin/orders/${params.id}`);
  const toast = useToast();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const load = useCallback(() => {
    if (!admin) return;
    setLoadError(false);
    authFetch<OrderDetail>(`/api/admin/orders/${params.id}`)
      .then(setOrder)
      .catch(() => setLoadError(true));
  }, [admin, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function advance(status: OrderStatus) {
    if (!admin || !order) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await authFetch<OrderDetail>(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrder(updated);
      toast(`Marked ${orderStatusChip(updated.status).label.toLowerCase()}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.error.message : "Couldn't update this order. Try again.");
    } finally {
      setBusy(false);
      setConfirmingCancel(false);
    }
  }

  async function copyAddress() {
    if (!order) return;
    const text = `${order.deliveryName}\n${order.deliveryPhone}\n${order.deliveryAddress}\n${order.deliveryZoneName}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Address copied");
    } catch {
      toast("Couldn't copy — select the address instead");
    }
  }

  if (loadError) {
    return (
      <AdminShell>
        <BackLink />
        <ErrorState title="This order didn't load" onRetry={load} className="border-t border-rule py-20" />
      </AdminShell>
    );
  }

  if (!order) {
    return (
      <AdminShell>
        <BackLink />
        <div aria-busy="true" aria-label="Loading">
          <div className="skeleton h-2.5 w-16" />
          <div className="skeleton mt-3 h-10 w-56" />
          <div className="mt-10 grid grid-cols-[1fr_340px] gap-12 max-[1099px]:grid-cols-1">
            <div className="skeleton h-64" />
            <div className="skeleton h-64" />
          </div>
        </div>
      </AdminShell>
    );
  }

  const next = nextOrderStep(order.status);
  const cancelled = order.status === "CANCELLED";
  const canCancel = !cancelled && order.status !== "DELIVERED";
  const stepIndex = ORDER_STEPS.indexOf(order.status);
  const tel = telLink(order.deliveryPhone);
  const whatsapp = whatsappLink(order.deliveryPhone);
  const cashOnDelivery = order.paymentMethod === "CASH_ON_DELIVERY";
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <AdminShell>
      <BackLink />
      <AdminPageHeader
        eyebrow="Order"
        title={<span className="font-mono tracking-normal">{order.orderNumber}</span>}
        meta={
          <>
            <StatusChip chip={orderStatusChip(order.status)} />
            <span className="font-mono text-micro uppercase tracking-label text-grey">Placed {formatDateTime(order.createdAt)}</span>
          </>
        }
      />

      <FormError message={error} />

      <div className="grid grid-cols-[1fr_340px] items-start gap-12 max-[1099px]:grid-cols-1 max-[1099px]:gap-10">
        <div className="min-w-0">
          <section aria-labelledby="customer-heading">
            <h2 id="customer-heading" className="eyebrow mb-3">
              Deliver to
            </h2>
            <div className="border border-rule p-5">
              <div className="font-serif text-lead">{order.deliveryName}</div>
              <div className="mt-1 font-mono text-meta tabular-nums">{order.deliveryPhone}</div>
              <address className="mt-4 whitespace-pre-line text-sm not-italic">
                {order.deliveryAddress}
                <span className="mt-1 block font-mono text-micro uppercase tracking-label text-grey">{order.deliveryZoneName}</span>
              </address>
              <div className="mt-5 flex flex-wrap gap-2">
                {tel && (
                  <a href={tel} className="btn-primary h-10 px-4">
                    Call
                  </a>
                )}
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline h-10 px-4">
                    WhatsApp <span aria-hidden="true">↗</span>
                  </a>
                )}
                <button type="button" onClick={copyAddress} className="btn-outline h-10 px-4">
                  Copy address
                </button>
              </div>
            </div>
          </section>

          <section aria-labelledby="items-heading" className="mt-10">
            <h2 id="items-heading" className="eyebrow mb-3">
              Pieces · {itemCount}
            </h2>
            <ul className="border-b border-rule">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-4 border-t border-rule py-4">
                  <ProductThumb src={item.imageUrl} alt="" className="w-14" />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-title">{item.productTitle}</div>
                    <div className="mt-0.5 font-mono text-micro uppercase tracking-label text-grey">
                      Size {item.productSize}
                      {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                    </div>
                  </div>
                  <div className="text-right font-mono text-meta tabular-nums">{formatMoney(item.pricePesewas * item.quantity)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-2 font-mono text-meta tabular-nums">
              <div className="flex justify-between py-2">
                <dt className="text-grey">Subtotal</dt>
                <dd>{formatMoney(order.subtotalPesewas)}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-grey">Delivery · {order.deliveryZoneName}</dt>
                <dd>{formatMoney(order.deliveryFeePesewas)}</dd>
              </div>
              <div className="flex justify-between border-t border-rule py-3 text-base">
                <dt>{cashOnDelivery ? "Collect on delivery" : "Total"}</dt>
                <dd>{formatMoney(order.totalPesewas)}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-grey">Payment</dt>
                <dd>{cashOnDelivery ? "Cash on delivery" : order.paymentMethod === "PAYSTACK" ? "Mobile Money / card · Paystack" : "—"}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside aria-labelledby="progress-heading" className="min-[1100px]:sticky min-[1100px]:top-6">
          <h2 id="progress-heading" className="eyebrow mb-3">
            Progress
          </h2>
          <ol className="border border-rule p-5">
            {ORDER_STEPS.map((step, i) => {
              const done = !cancelled && i <= stepIndex;
              const current = !cancelled && i === stepIndex;
              return (
                <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < ORDER_STEPS.length - 1 && (
                    <span aria-hidden="true" className={`absolute left-[5px] top-4 h-full w-px ${done && i < stepIndex ? "bg-ink" : "bg-rule"}`} />
                  )}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 mt-1 h-[11px] w-[11px] flex-shrink-0 rounded-full border ${
                      done ? "border-ink bg-ink" : "border-field bg-cream"
                    } ${current ? "ring-2 ring-ink/20 ring-offset-2 ring-offset-cream" : ""}`}
                  />
                  <span className={`text-sm ${done ? "text-ink" : "text-grey"} ${current ? "font-medium" : ""}`}>
                    {orderStatusChip(step).label}
                    {current && <span className="sr-only"> (current)</span>}
                  </span>
                </li>
              );
            })}
            {cancelled && (
              <li className="mt-4 flex gap-3 border-t border-rule pt-4">
                <span aria-hidden="true" className="mt-1 h-[11px] w-[11px] flex-shrink-0 rounded-full bg-signal" />
                <span className="text-sm text-signal">Cancelled — the pieces went back on sale.</span>
              </li>
            )}
          </ol>

          {next && (
            <button type="button" disabled={busy} onClick={() => advance(next)} className="btn-primary mt-4 h-[52px] w-full">
              {busy && !confirmingCancel ? "Updating…" : `Mark as ${orderStatusChip(next).label.toLowerCase()}`}
            </button>
          )}
          {canCancel && (
            <button type="button" disabled={busy} onClick={() => setConfirmingCancel(true)} className="btn-outline mt-3 w-full">
              Cancel order
            </button>
          )}
        </aside>
      </div>

      {confirmingCancel && (
        <ConfirmDialog
          title="Cancel this order?"
          body="Its pieces go back on sale and the customer sees the order as cancelled. This can't be undone."
          confirmLabel="Cancel order"
          danger
          busy={busy}
          onConfirm={() => advance("CANCELLED")}
          onCancel={() => setConfirmingCancel(false)}
        />
      )}
    </AdminShell>
  );
}

function BackLink() {
  return (
    <Link href="/admin/orders" className="link-quiet mb-5 inline-block">
      ← All orders
    </Link>
  );
}
