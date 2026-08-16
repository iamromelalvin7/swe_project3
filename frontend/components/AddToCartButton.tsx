"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { AvailabilityStatus } from "@/lib/types";

const LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Add to cart",
  RESERVED: "Held by another buyer",
  SOLD_OUT: "Sold out",
};

/**
 * FR-C4 only: logged-out click redirects to login and returns here.
 * Cart creation itself is Phase 3 (POST /api/cart/items doesn't exist
 * yet) — a signed-in click is deliberately inert until then.
 */
export function AddToCartButton({ status, productId }: { status: AvailabilityStatus; productId: string }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const disabled = status !== "AVAILABLE";

  return (
    <div>
      <button
        disabled={disabled || !ready}
        onClick={() => {
          if (!user) {
            router.push(`/login?redirect=/products/${productId}`);
          }
        }}
        className="mt-7 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:cursor-not-allowed disabled:bg-disabled"
      >
        {LABELS[status]}
      </button>
      <div className="mt-3 text-center text-xs text-grey">
        {status === "AVAILABLE" ? "Adding to cart reserves this item for 10 minutes." : ""}
      </div>
    </div>
  );
}
