"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { apiFetch, authFetch, ApiRequestError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { CheckoutResponse, DeliveryZone, PaymentMethod } from "@/lib/types";

export default function CheckoutPage() {
  const { ready, user } = useAuth();
  const { lines } = useCart();
  const router = useRouter();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("PAYSTACK");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<DeliveryZone[]>("/api/delivery-zones").then(setZones);
  }, []);

  useEffect(() => {
    if (user) setName((n) => n || user.fullName);
  }, [user]);

  if (ready && !user) {
    router.push("/login?redirect=/checkout");
    return null;
  }

  const subtotal = lines.reduce((sum, l) => sum + l.pricePesewas * l.quantity, 0);
  const zone = zones.find((z) => z.id === zoneId);
  const fee = zone?.feePesewas ?? 0;
  const total = subtotal + fee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    setErrors({});
    setSubmitting(true);
    try {
      const response = await authFetch<CheckoutResponse>("/api/checkout", user.token, {
        method: "POST",
        body: JSON.stringify({
          deliveryName: name,
          deliveryPhone: phone,
          deliveryAddress: address,
          deliveryZoneId: zoneId,
          paymentMethod: payment,
        }),
      });
      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
      } else {
        router.push(`/orders/${response.order.id}?placed=1`);
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.error.message);
        setErrors(err.error.fields ?? {});
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <main>
        <Header />
        <div className="px-14 py-24 text-center max-[640px]:px-5">
          <div className="mb-2.5 font-serif text-[28px]">Your cart is empty</div>
          <Link href="/products" className="border-b border-ink pb-[3px] font-mono text-[11px] uppercase tracking-[0.1em]">
            Browse the catalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <div className="px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7">
        <Link href="/cart" className="mb-6 inline-block font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink">
          ← Return to cart
        </Link>
        <h1 className="mb-11 font-serif text-[56px] max-[640px]:text-[38px]">Checkout</h1>

        {formError && <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{formError}</div>}

        <form onSubmit={submit} className="grid grid-cols-[1fr_380px] items-start gap-16 max-[900px]:grid-cols-1">
          <div>
            <Field label="Full name" error={errors.deliveryName}>
              <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
            </Field>
            <Field label="Phone number" error={errors.deliveryPhone}>
              <input className="field-input font-mono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233" />
            </Field>
            <Field label="Delivery address" error={errors.deliveryAddress}>
              <textarea
                className="field-input resize-none"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, building, floor"
              />
            </Field>
            <div className="mb-11">
              <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Delivery zone</label>
              <select className="field-input" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                <option value="">Select a zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} · {formatMoney(z.feePesewas)}
                  </option>
                ))}
              </select>
              {errors.deliveryZoneId && <div className="mt-2 font-mono text-[11px] text-signal">{errors.deliveryZoneId}</div>}
            </div>

            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Payment method</div>
            {(
              [
                ["PAYSTACK", "Mobile Money / Card — via Paystack"],
                ["CASH_ON_DELIVERY", "Cash on delivery"],
              ] as [PaymentMethod, string][]
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setPayment(value)}
                className={`block w-full border-t border-rule py-5 px-5 text-left text-[15px] hover:bg-hover-light ${
                  payment === value ? "border-l-2 border-l-ink text-ink" : "border-l-2 border-l-transparent text-grey"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="border-t border-rule" />
          </div>

          <div className="sticky top-[60px]">
            <div className="pb-4.5 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Order summary</div>
            {lines.map((l) => (
              <div key={l.productId} className="flex items-center gap-4 border-t border-rule py-4">
                <div className="flex-1">
                  <div className="text-sm">{l.title}</div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
                    {l.brand} · {l.sizeLabel} × {l.quantity}
                  </div>
                </div>
                <div className="font-mono text-[13px]">{formatMoney(l.pricePesewas * l.quantity)}</div>
              </div>
            ))}
            <div className="flex justify-between border-t border-rule py-3.5 font-mono text-[13px]">
              <span className="text-grey">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-rule py-3.5 font-mono text-[13px]">
              <span className="text-grey">Delivery fee</span>
              <span>{zone ? formatMoney(fee) : "—"}</span>
            </div>
            <div className="flex justify-between border-t border-b border-rule py-4 font-mono text-base">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
            <button
              type="submit"
              disabled={submitting || !zoneId}
              className="mt-6 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark disabled:cursor-not-allowed disabled:bg-disabled"
            >
              {payment === "CASH_ON_DELIVERY" ? `Place order · ${formatMoney(total)}` : `Pay ${formatMoney(total)}`}
            </button>
            <div className="mt-3.5 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-grey">
              {payment === "CASH_ON_DELIVERY" ? "Pay the rider on delivery" : "Processed securely via Paystack"}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{label}</label>
      {children}
      {error && <div className="mt-2 font-mono text-[11px] text-signal">{error}</div>}
    </div>
  );
}
