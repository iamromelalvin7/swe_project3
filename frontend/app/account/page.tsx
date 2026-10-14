"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Field } from "@/components/Field";
import { ErrorState, FormError } from "@/components/States";
import { useAuth } from "@/lib/auth";
import { authFetch, ApiRequestError } from "@/lib/api";
import { formatStatus } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { OrderSummary, PageResponse, UserProfile } from "@/lib/types";

const TABS: { key: "details" | "orders"; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "orders", label: "My orders" },
];

function AccountInner() {
  const { ready, user, logout, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "orders" ? "orders" : "details";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", defaultAddress: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);

  const loadProfile = () => {
    if (!user) return;
    setProfileError(false);
    authFetch<UserProfile>("/api/users/me")
      .then((p) => {
        setProfile(p);
        setForm({ fullName: p.fullName, phone: p.phone, defaultAddress: p.defaultAddress ?? "" });
      })
      .catch(() => setProfileError(true));
  };

  useEffect(() => {
    if (ready && user) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const loadOrders = () => {
    if (!user) return;
    setOrdersError(false);
    authFetch<PageResponse<OrderSummary>>("/api/orders")
      .then((res) => setOrders(res.items))
      .catch(() => setOrdersError(true));
  };

  useEffect(() => {
    if (tab === "orders" && ready && user) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ready, user]);

  // "Saved." is a moment, not a state — clear it on the next edit.
  function edit(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    setFieldErrors({});
    setSaved(false);
    try {
      const updated = await authFetch<UserProfile>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      updateUser({ fullName: updated.fullName });
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setSaveError(err.error.message);
        setFieldErrors(err.error.fields ?? {});
      } else {
        setSaveError("Couldn't save your details. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (ready && !user) {
    return (
      <>
        <Header />
        <main className="page-container pb-24 pt-10 max-[640px]:pt-6">
          <h1 className="font-serif text-h1 max-[640px]:text-h2">Account</h1>
          <div className="mt-10 border-t border-rule py-20 text-center">
            <p className="mb-6 text-body text-grey">Sign in to see your details and orders.</p>
            <Link href="/login?redirect=/account" className="btn-primary h-[50px] px-7">
              Sign in
            </Link>
            <p className="mt-6 text-sm text-grey">
              New here?{" "}
              <Link href="/register" className="text-ink underline underline-offset-4 hover:text-grey">
                Create an account
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-container pb-24 pt-10 max-[640px]:pb-14 max-[640px]:pt-6">
        <div className={tab === "orders" ? "max-w-[880px]" : "max-w-[560px]"}>
          <h1 className="mb-6 font-serif text-h1 max-[640px]:text-h2">Account</h1>

          <nav aria-label="Account sections" className="mb-9 flex gap-7 border-b border-rule">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/account?tab=${t.key}`}
                aria-current={tab === t.key ? "page" : undefined}
                className={`-mb-px border-b-2 pb-3.5 font-mono text-label uppercase tracking-label ${
                  tab === t.key ? "border-ink text-ink" : "border-transparent text-grey hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {tab === "orders" && (
            <div>
              {!orders && !ordersError && (
                <div aria-busy="true" className="border-t border-rule">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border-b border-rule py-6">
                      <div className="skeleton h-2.5 w-[30%]" />
                      <div className="skeleton mt-3 h-2.5 w-[15%]" />
                    </div>
                  ))}
                </div>
              )}

              {ordersError && <ErrorState title="Your orders didn't load" onRetry={loadOrders} />}

              {orders && orders.length === 0 && (
                <div className="border-t border-rule py-20">
                  <div className="mb-2.5 font-serif text-h3">No orders yet</div>
                  <p className="mb-6 text-sm text-grey">When you place an order it shows up here.</p>
                  <Link href="/products#archive" className="link-underline">
                    Browse the archive →
                  </Link>
                </div>
              )}

              {orders && orders.length > 0 && (
                <ul className="border-b border-rule">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/orders/${o.id}`}
                        className="grid grid-cols-[130px_120px_1fr_120px_150px] items-baseline gap-5 border-t border-rule px-1 py-6 hover:bg-hover-light max-[700px]:grid-cols-2 max-[700px]:gap-y-2"
                      >
                        <span className="font-mono text-sm">{o.orderNumber}</span>
                        <span className="font-mono text-label uppercase tracking-label text-grey max-[700px]:text-right">
                          {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-sm text-grey">
                          {o.itemCount} {o.itemCount === 1 ? "piece" : "pieces"}
                        </span>
                        <span className="text-right font-mono text-sm">{formatMoney(o.totalPesewas)}</span>
                        <span className="text-right font-mono text-label uppercase tracking-label max-[700px]:col-span-2 max-[700px]:text-left">
                          {formatStatus(o.status)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "details" && profileError && <ErrorState title="Your details didn't load" onRetry={loadProfile} />}

          {tab === "details" && !profile && !profileError && (
            <div aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-7">
                  <div className="skeleton mb-2.5 h-2.5 w-[20%]" />
                  <div className="skeleton h-9 w-full" />
                </div>
              ))}
            </div>
          )}

          {tab === "details" && profile && (
            <form onSubmit={save} noValidate>
              <p className="mb-9 text-sm text-grey">Your checkout fills in from these details.</p>

              <FormError message={saveError} />

              <Field label="Name" error={fieldErrors.fullName}>
                <input
                  className={`field-input ${fieldErrors.fullName ? "field-input-error" : ""}`}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => edit("fullName", e.target.value)}
                />
              </Field>
              <Field label="Email" help="Your email can't be changed here.">
                <input className="field-input" value={profile.email} disabled />
              </Field>
              <Field label="Phone" error={fieldErrors.phone}>
                <input
                  className={`field-input font-mono ${fieldErrors.phone ? "field-input-error" : ""}`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => edit("phone", e.target.value)}
                />
              </Field>
              <Field label="Default address" error={fieldErrors.defaultAddress}>
                <textarea
                  className={`field-input resize-none ${fieldErrors.defaultAddress ? "field-input-error" : ""}`}
                  rows={2}
                  autoComplete="street-address"
                  value={form.defaultAddress}
                  onChange={(e) => edit("defaultAddress", e.target.value)}
                />
              </Field>

              <div className="flex items-center gap-5">
                <button type="submit" disabled={saving} className="btn-primary h-[50px] px-7">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {saved && (
                  <p role="status" className="text-sm text-ink">
                    Saved.
                  </p>
                )}
              </div>

              <div className="mt-14 border-t border-rule pt-7">
                <button
                  type="button"
                  onClick={() => {
                    // Wait for the server to clear the session cookie before leaving.
                    void logout().finally(() => router.push("/products"));
                  }}
                  className="btn-outline"
                >
                  Sign out
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}
