"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Field } from "@/components/Field";
import { FormError } from "@/components/States";
import { ProductThumb } from "@/components/ProductImage";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { apiFetch, authFetch, ApiRequestError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { CheckoutResponse, DeliveryZone, PaymentMethod, UserProfile } from "@/lib/types";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; detail: string }[] = [
  { value: "PAYSTACK", label: "Mobile Money or card", detail: "Pay now, securely through Paystack." },
  { value: "CASH_ON_DELIVERY", label: "Cash on delivery", detail: "Pay the rider when your order arrives." },
];

export default function CheckoutPage() {
  const { ready, user } = useAuth();
  const { lines, anyExpired, loading } = useCart();
  const router = useRouter();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesError, setZonesError] = useState(false);
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("PAYSTACK");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadZones = () => {
    setZonesError(false);
    apiFetch<DeliveryZone[]>("/api/delivery-zones")
      .then(setZones)
      .catch(() => setZonesError(true));
  };

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    if (user) setName((n) => n || user.fullName);
  }, [user]);

  // Prefill from the saved profile. A failure here is harmless — the
  // shopper just types their details — so it's swallowed on purpose.
  useEffect(() => {
    if (!user) return;
    authFetch<UserProfile>("/api/users/me")
      .then((p) => {
        setPhone((v) => v || p.phone || "");
        setAddress((v) => v || p.defaultAddress || "");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (ready && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [ready, user, router]);

  // Move focus to a submit error so it's seen even when the button is far
  // below it (and announced by screen readers).
  useEffect(() => {
    if (formError) document.getElementById("checkout-error")?.focus();
  }, [formError]);

  if (ready && !user) {
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
      const response = await authFetch<CheckoutResponse>("/api/checkout", {
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
        setFormError("Something went wrong placing your order. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (ready && !loading && lines.length === 0) {
    return (
      <>
        <Header />
        <main className="page-container py-24 text-center">
          <div className="mb-2.5 font-serif text-h3">Your cart is empty</div>
          <p className="mb-6 text-sm text-grey">Add a piece to your cart before checking out.</p>
          <Link href="/products#archive" className="link-underline">
            Browse the archive →
          </Link>
        </main>
      </>
    );
  }

  const blockedReason = anyExpired
    ? "A hold in your cart has expired. Renew it in your cart first."
    : !zoneId
      ? "Choose a delivery zone to continue."
      : null;

  return (
    <>
      <Header />
      <main className="page-container pb-24 pt-10 max-[640px]:pb-14 max-[640px]:pt-6">
        <Link href="/cart" className="link-quiet mb-6 inline-block">
          ← Back to cart
        </Link>
        <h1 className="mb-10 font-serif text-h1 max-[640px]:mb-7 max-[640px]:text-h2">Checkout</h1>

        <FormError id="checkout-error" message={formError} />

        <form onSubmit={submit} noValidate className="grid grid-cols-[1fr_380px] items-start gap-16 max-[900px]:grid-cols-1 max-[900px]:gap-10">
          <div className="max-w-[620px]">
            <h2 className="eyebrow mb-6">Delivery details</h2>
            <Field label="Full name" error={errors.deliveryName}>
              <input
                className={`field-input ${errors.deliveryName ? "field-input-error" : ""}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your full name"
              />
            </Field>
            <Field label="Phone number" error={errors.deliveryPhone} help="The rider calls this number to arrange delivery.">
              <input
                className={`field-input font-mono ${errors.deliveryPhone ? "field-input-error" : ""}`}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233"
              />
            </Field>
            <Field label="Delivery address" error={errors.deliveryAddress}>
              <textarea
                className={`field-input resize-none ${errors.deliveryAddress ? "field-input-error" : ""}`}
                rows={3}
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, building, floor, nearest landmark"
              />
            </Field>
            <Field
              label="Delivery zone"
              error={errors.deliveryZoneId ?? (zonesError ? "Couldn't load delivery zones." : undefined)}
              className="mb-10"
            >
              <select
                className={`field-input ${errors.deliveryZoneId ? "field-input-error" : ""}`}
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              >
                <option value="">Select a zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} · {formatMoney(z.feePesewas)}
                  </option>
                ))}
              </select>
            </Field>
            {zonesError && (
              <button type="button" onClick={loadZones} className="link-underline -mt-6 mb-10 inline-block">
                Retry loading zones
              </button>
            )}

            <fieldset>
              <legend className="eyebrow mb-3">Payment method</legend>
              <div role="radiogroup" className="border-y border-rule">
                {PAYMENT_OPTIONS.map((o) => {
                  const checked = payment === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer items-start gap-4 border-t border-rule px-1 py-5 first:border-t-0 hover:bg-hover-light ${checked ? "text-ink" : "text-grey"}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={o.value}
                        checked={checked}
                        onChange={() => setPayment(o.value)}
                        className="mt-1 h-4 w-4 flex-shrink-0 accent-ink"
                      />
                      <span>
                        <span className="block text-body text-ink">{o.label}</span>
                        <span className="mt-0.5 block text-sm text-grey">{o.detail}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <aside aria-labelledby="order-summary-heading" className="sticky top-6 max-[900px]:static">
            <h2 id="order-summary-heading" className="eyebrow pb-4">
              Order summary
            </h2>
            <ul>
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-4 border-t border-rule py-4">
                  <ProductThumb src={l.primaryThumbUrl} alt="" className="w-12" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-serif text-title">{l.title}</div>
                    <div className="mt-0.5 font-mono text-micro uppercase tracking-label text-grey">
                      {l.brand} · {l.sizeLabel}
                      {l.quantity > 1 ? ` · ×${l.quantity}` : ""}
                    </div>
                  </div>
                  <div className="font-mono text-meta">{formatMoney(l.pricePesewas * l.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-rule py-3.5 font-mono text-meta">
              <span className="text-grey">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-rule py-3.5 font-mono text-meta">
              <span className="text-grey">Delivery</span>
              <span>{zone ? formatMoney(fee) : "Choose a zone"}</span>
            </div>
            <div className="flex justify-between border-y border-rule py-4 font-mono text-base">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
            <button type="submit" disabled={submitting || !!blockedReason} className="btn-primary mt-6 h-[52px] w-full">
              {submitting
                ? "Placing order…"
                : payment === "CASH_ON_DELIVERY"
                  ? `Place order · ${formatMoney(total)}`
                  : `Pay ${formatMoney(total)}`}
            </button>
            <p className={`mt-3 text-center text-sm ${blockedReason ? "text-ink" : "text-grey"}`}>
              {blockedReason ?? (payment === "CASH_ON_DELIVERY" ? "Pay the rider on delivery." : "Processed securely by Paystack.")}
            </p>
          </aside>
        </form>
      </main>
    </>
  );
}
