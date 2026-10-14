"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiRequestError } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useCountdown } from "@/lib/countdown";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/lib/types";
import { ProductThumb } from "./ProductImage";

export function CartLineRow({ line }: { line: CartLine }) {
  const { addItem, removeItem } = useCart();
  const { expired, formatted } = useCountdown(line.expiresAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, fallback: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.error.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  const productHref = `/products/${line.productId}`;

  return (
    <li className="grid grid-cols-[110px_1fr_auto] items-start gap-6 border-t border-rule py-7 max-[640px]:grid-cols-[84px_1fr] max-[640px]:gap-4">
      <Link href={productHref} tabIndex={-1} aria-hidden="true">
        <ProductThumb src={line.primaryThumbUrl} alt="" className="w-[110px] max-[640px]:w-[84px]" />
      </Link>

      <div className="min-w-0">
        <p className="font-mono text-micro uppercase tracking-label text-grey">
          {line.brand} · {line.sizeLabel}
        </p>
        <Link href={productHref} className="mt-1 block font-serif text-title hover:text-grey">
          {line.title}
        </Link>
        <p
          className={`mt-3 flex items-center gap-2 font-mono text-label uppercase tracking-label ${expired ? "text-signal" : "text-ink"}`}
        >
          {!expired && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-stock" />}
          {expired ? "Hold expired" : `Held for you · ${formatted}`}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center border border-rule" role="group" aria-label={`Quantity of ${line.title}`}>
            <button
              type="button"
              disabled={busy || line.quantity <= 1}
              onClick={() => run(() => addItem(line.productId, line.quantity - 1), "Couldn't change the quantity.")}
              aria-label="Decrease quantity"
              className="flex h-11 w-11 items-center justify-center font-mono text-sm text-ink hover:bg-hover-light disabled:text-disabled disabled:hover:bg-transparent"
            >
              −
            </button>
            <span aria-live="polite" className="w-9 text-center font-mono text-meta">
              {line.quantity}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => addItem(line.productId, line.quantity + 1), "There isn't another one available.")}
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center font-mono text-sm text-ink hover:bg-hover-light disabled:text-disabled"
            >
              +
            </button>
          </div>
          {expired && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => addItem(line.productId, line.quantity), "Couldn't renew the hold — the piece may have been taken.")}
              className="btn-primary h-11 px-5"
            >
              {busy ? "Renewing…" : "Renew hold"}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => removeItem(line.productId), "Couldn't remove this piece.")}
            className="text-sm text-grey underline underline-offset-4 hover:text-ink"
          >
            Remove
          </button>
        </div>
        {error && (
          <p role="alert" className="form-error mt-3">
            {error}
          </p>
        )}
      </div>

      <div className="text-right font-mono text-meta max-[640px]:col-start-2 max-[640px]:text-left">
        {formatMoney(line.pricePesewas * line.quantity)}
      </div>
    </li>
  );
}
