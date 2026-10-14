"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useCountdown } from "@/lib/countdown";
import { ApiRequestError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { AvailabilityStatus, CartLine } from "@/lib/types";

/**
 * Availability line + purchase action for the product page.
 *
 * `availableQuantity` (server-rendered) already subtracts every live hold —
 * including this shopper's own — so the shopper's cart is checked first:
 * someone holding the last piece sees "In your cart", never "Held by
 * another buyer".
 */
export function AddToCartButton({
  status,
  productId,
  availableQuantity,
}: {
  status: AvailabilityStatus;
  productId: string;
  availableQuantity: number;
}) {
  const { user, ready } = useAuth();
  const { lines, addItem } = useCart();
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedHere, setAddedHere] = useState(0);

  const inCart = lines.find((l) => l.productId === productId && new Date(l.expiresAt).getTime() > Date.now());
  const remaining = Math.max(0, availableQuantity - addedHere);

  async function add() {
    if (!user) {
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addItem(productId, (inCart?.quantity ?? 0) + 1);
      setAddedHere((n) => n + 1);
      toast("Added · held for 10:00", { href: "/cart", label: "View cart" });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.error.message : "Couldn't add this to your cart. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (inCart) {
    return <InCart line={inCart} canAddMore={remaining > 0} submitting={submitting} onAdd={add} error={error} />;
  }

  if (status !== "AVAILABLE" || remaining === 0) {
    const sold = status === "SOLD_OUT";
    return (
      <div className="mt-7">
        <div className="flex h-[52px] items-center justify-center border border-ink font-mono text-xs uppercase tracking-cta text-ink">
          {sold ? "Sold out" : "On hold"}
        </div>
        <p className="mt-3 text-center text-sm text-grey">
          {sold
            ? "This piece has found its owner."
            : "Another shopper is holding this piece. Holds last ten minutes, so check back shortly."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7">
      <p className="mb-3 flex items-center gap-2 font-mono text-label uppercase tracking-label text-ink">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-stock" />
        {remaining === 1 ? "1 available" : `${remaining} available`}
      </p>
      <button type="button" disabled={!ready || submitting} onClick={add} className="btn-primary h-[52px] w-full">
        {submitting ? "Reserving piece…" : "Add to cart"}
      </button>
      {error ? (
        <p role="alert" className="form-error mt-3 text-center">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-center text-sm text-grey">Adding to cart holds this piece for you for 10 minutes.</p>
      )}
    </div>
  );
}

function InCart({
  line,
  canAddMore,
  submitting,
  onAdd,
  error,
}: {
  line: CartLine;
  canAddMore: boolean;
  submitting: boolean;
  onAdd: () => void;
  error: string | null;
}) {
  const { formatted } = useCountdown(line.expiresAt);
  return (
    <div className="mt-7">
      <p className="mb-3 flex items-center gap-2 font-mono text-label uppercase tracking-label text-ink">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-stock" />
        In your cart · held for {formatted}
      </p>
      <Link href="/cart" className="btn-primary h-[52px] w-full">
        View cart <span aria-hidden="true">→</span>
      </Link>
      {canAddMore && (
        <button type="button" disabled={submitting} onClick={onAdd} className="link-quiet mt-4 block w-full text-center">
          {submitting ? "Reserving…" : `Add another (${line.quantity} in cart)`}
        </button>
      )}
      {error && (
        <p role="alert" className="form-error mt-3 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
