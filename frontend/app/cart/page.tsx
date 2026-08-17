"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { CartLineRow } from "@/components/CartLineRow";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const { ready, user } = useAuth();
  const { lines, loading, error, refresh } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.push("/login?redirect=/cart");
    }
  }, [ready, user, router]);

  if (ready && !user) {
    return null;
  }

  const subtotal = lines.reduce((sum, l) => sum + l.pricePesewas * l.quantity, 0);
  const anyExpired = lines.some((l) => new Date(l.expiresAt).getTime() <= Date.now());

  return (
    <main>
      <Header />
      <div className="px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7">
        <h1 className="mb-9 font-serif text-[56px] max-[640px]:text-[38px]">Cart</h1>

        {loading && lines.length === 0 && (
          <div className="border-t border-rule py-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-5 border-b border-rule py-5">
                <div className="aspect-[3/4] w-20 flex-shrink-0 animate-pulse rounded-[4px] bg-skeleton" />
                <div className="flex-1">
                  <div className="h-2.5 w-[40%] animate-pulse bg-skeleton" />
                  <div className="mt-3 h-2.5 w-[25%] animate-pulse bg-skeleton" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="border-t border-rule py-20 text-center">
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-signal">Request failed</div>
            <div className="mb-2.5 font-serif text-[28px]">Your cart did not load</div>
            <div className="mb-6 text-sm text-grey">The shop is reachable but the cart request failed.</div>
            <button
              onClick={refresh}
              className="h-12 bg-ink px-6 font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && lines.length === 0 && (
          <div className="border-t border-rule py-20">
            <div className="mb-2.5 font-serif text-[26px]">Your cart is empty</div>
            <div className="mb-6 text-sm text-grey">Holds last ten minutes from the moment you add a piece.</div>
            <Link
              href="/products"
              className="border-b border-ink pb-[3px] font-mono text-[11px] uppercase tracking-[0.1em] hover:text-grey hover:border-grey"
            >
              Browse the catalog
            </Link>
          </div>
        )}

        {!error && lines.length > 0 && (
          <div className="grid grid-cols-[1fr_320px] items-start gap-14 max-[900px]:grid-cols-1">
            <div>
              {lines.map((line) => (
                <CartLineRow key={line.productId} line={line} />
              ))}
              <div className="border-t border-rule" />
            </div>

            <div className="sticky top-[60px]">
              <div className="pb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Summary</div>
              <div className="flex justify-between border-t border-rule py-3.5 font-mono text-[13px]">
                <span className="text-grey">Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-rule py-3.5 font-mono text-[13px]">
                <span className="text-grey">Delivery</span>
                <span className="text-grey">At checkout</span>
              </div>
              <div className="flex justify-between border-t border-b border-rule py-4 font-mono text-base">
                <span>Total</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <button
                disabled={anyExpired}
                onClick={() => router.push("/checkout")}
                className="mt-6 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:cursor-not-allowed disabled:bg-disabled"
              >
                Checkout
              </button>
              {anyExpired && (
                <div className="mt-3 text-xs text-signal">A hold has expired. Renew it before checking out.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
