"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { ApiRequestError } from "@/lib/api";
import type { AvailabilityStatus } from "@/lib/types";

const LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Add to cart",
  RESERVED: "Held by another buyer",
  SOLD_OUT: "Sold out",
};

export function AddToCartButton({ status, productId }: { status: AvailabilityStatus; productId: string }) {
  const { user, ready } = useAuth();
  const { lines, addItem } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = status !== "AVAILABLE";
  const inCart = lines.find((l) => l.productId === productId);

  async function onClick() {
    if (!user) {
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addItem(productId, (inCart?.quantity ?? 0) + 1);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.error.message : "Could not add this to your cart.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        disabled={disabled || !ready || submitting}
        onClick={onClick}
        className="mt-7 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:cursor-not-allowed disabled:bg-disabled"
      >
        {disabled ? LABELS[status] : inCart ? "In cart · add another" : "Add to cart"}
      </button>
      {error && <div className="mt-3 text-center text-xs text-signal">{error}</div>}
      {!error && (
        <div className="mt-3 text-center text-xs text-grey">
          {inCart ? (
            <>
              Held for you ·{" "}
              <Link href="/cart" className="text-ink underline">
                View cart
              </Link>
            </>
          ) : status === "AVAILABLE" ? (
            "Adding to cart reserves this item for 10 minutes."
          ) : (
            ""
          )}
        </div>
      )}
    </div>
  );
}
