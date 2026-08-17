"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { authFetch, ApiRequestError } from "@/lib/api";
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
  const [form, setForm] = useState({ fullName: "", phone: "", defaultAddress: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    authFetch<UserProfile>("/api/users/me", user.token).then((p) => {
      setProfile(p);
      setForm({ fullName: p.fullName, phone: p.phone, defaultAddress: p.defaultAddress ?? "" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const loadOrders = () => {
    if (!user) return;
    setOrdersError(false);
    authFetch<PageResponse<OrderSummary>>("/api/orders", user.token)
      .then((res) => setOrders(res.items))
      .catch(() => setOrdersError(true));
  };

  useEffect(() => {
    if (tab === "orders" && ready && user) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ready, user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await authFetch<UserProfile>("/api/users/me", user.token, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      updateUser({ fullName: updated.fullName });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiRequestError ? err.error.message : "Could not save your details.");
    } finally {
      setSaving(false);
    }
  }

  if (ready && !user) {
    return (
      <main>
        <Header />
        <div className="max-w-[560px] px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7">
          <h1 className="mb-6 font-serif text-[56px] max-[640px]:text-[38px]">Account</h1>
          <div className="pt-8">
            <div className="mb-6 text-[15px] text-grey">You are signed out.</div>
            <Link
              href="/login?redirect=/account"
              className="inline-flex h-[50px] items-center bg-ink px-7 font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <div
        className={`px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7 ${
          tab === "orders" ? "max-w-[860px]" : "max-w-[560px]"
        }`}
      >
        <h1 className="mb-6 font-serif text-[56px] max-[640px]:text-[38px]">Account</h1>

        <div className="mb-9 flex gap-7 border-b border-rule">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => router.push(`/account?tab=${t.key}`)}
              className={`-mb-px border-b-2 pb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
                tab === t.key ? "border-ink text-ink" : "border-transparent text-grey hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div>
            {!orders && !ordersError && (
              <div className="border-t border-rule py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border-b border-rule py-6">
                    <div className="h-2.5 w-[30%] animate-pulse bg-skeleton" />
                    <div className="mt-3 h-2.5 w-[15%] animate-pulse bg-skeleton" />
                  </div>
                ))}
              </div>
            )}

            {ordersError && (
              <div className="border-t border-rule py-20 text-center">
                <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-signal">Request failed</div>
                <div className="mb-2.5 font-serif text-[28px]">Your orders did not load</div>
                <div className="mb-6 text-sm text-grey">The shop is reachable but the listing request failed.</div>
                <button
                  onClick={loadOrders}
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
        )}

        {tab === "details" && !profile && (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-7">
                <div className="mb-2.5 h-2.5 w-[20%] animate-pulse bg-skeleton" />
                <div className="h-4 w-full animate-pulse border-b border-rule bg-skeleton" />
              </div>
            ))}
          </div>
        )}

        {tab === "details" && profile && (
          <div>
            <div className="mb-10 text-sm text-grey">Edit these and your checkout fills in from them.</div>

            <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Name</label>
            <input
              className="field-input mb-7"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />

            <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Email</label>
            <input className="field-input mb-7 text-grey" value={profile.email} disabled />

            <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Phone</label>
            <input
              className="field-input mb-7 font-mono"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />

            <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Default address</label>
            <input
              className="field-input mb-7"
              value={form.defaultAddress}
              onChange={(e) => setForm((f) => ({ ...f, defaultAddress: e.target.value }))}
            />

            {saveError && <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{saveError}</div>}
            {saved && <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.08em] text-grey">Saved.</div>}

            <button
              onClick={save}
              disabled={saving}
              className="h-[50px] bg-ink px-7 font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>

            <div className="mt-14 border-t border-rule pt-7">
              <button
                onClick={() => {
                  logout();
                  router.push("/products");
                }}
                className="h-12 border border-ink px-6 font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-ink hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}
