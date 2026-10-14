"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartLineRow } from "@/components/CartLineRow";
import { ErrorState } from "@/components/States";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const { ready, user } = useAuth();
  const { lines, loading, error, refresh, anyExpired } = useCart();
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

  return (
    <>
      <Header />
      <main className="page-container pb-24 pt-10 max-[640px]:pb-14 max-[640px]:pt-6">
        <h1 className="mb-9 font-serif text-h1 max-[640px]:mb-6 max-[640px]:text-h2">Cart</h1>

        {(!ready || (loading && lines.length === 0)) && (
          <div aria-busy="true" className="border-t border-rule">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-5 border-b border-rule py-7">
                <div className="skeleton aspect-[3/4] w-[110px] flex-shrink-0 max-[640px]:w-[84px]" />
                <div className="flex-1">
                  <div className="skeleton h-2.5 w-[30%]" />
                  <div className="skeleton mt-3 h-3.5 w-[45%]" />
                  <div className="skeleton mt-3 h-2.5 w-[25%]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <ErrorState title="Your cart didn't load" onRetry={refresh} />}

        {ready && !loading && !error && lines.length === 0 && (
          <div className="border-t border-rule py-20">
            <div className="mb-2.5 font-serif text-h3">Your cart is empty</div>
            <p className="mb-6 text-sm text-grey">Add a piece and it&apos;s held for you for ten minutes.</p>
            <Link href="/products#archive" className="link-underline">
              Browse the archive →
            </Link>
          </div>
        )}

        {!error && lines.length > 0 && (
          <div className="grid grid-cols-[1fr_340px] items-start gap-14 max-[900px]:grid-cols-1 max-[900px]:gap-10">
            <ul className="border-b border-rule">
              {lines.map((line) => (
                <CartLineRow key={line.productId} line={line} />
              ))}
            </ul>

            <aside aria-labelledby="summary-heading" className="sticky top-6 max-[900px]:static">
              <h2 id="summary-heading" className="eyebrow pb-4">
                Summary
              </h2>
              <div className="flex justify-between border-t border-rule py-3.5 font-mono text-meta">
                <span className="text-grey">Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between border-y border-rule py-3.5 font-mono text-meta">
                <span className="text-grey">Delivery</span>
                <span className="text-grey">Calculated at checkout</span>
              </div>
              <button
                type="button"
                disabled={anyExpired}
                onClick={() => router.push("/checkout")}
                className="btn-primary mt-6 h-[52px] w-full"
              >
                Checkout · {formatMoney(subtotal)}
              </button>
              {anyExpired && (
                <p role="alert" className="form-error mt-3">
                  A hold has expired. Renew it or remove the piece to check out.
                </p>
              )}
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
