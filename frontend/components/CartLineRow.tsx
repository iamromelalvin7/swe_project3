"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useCountdown } from "@/lib/countdown";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/lib/types";

export function CartLineRow({ line }: { line: CartLine }) {
  const { addItem, removeItem } = useCart();
  const { expired, formatted } = useCountdown(line.expiresAt);
  const [busy, setBusy] = useState(false);

  async function changeQty(next: number) {
    if (next < 1 || busy) return;
    setBusy(true);
    try {
      await addItem(line.productId, next);
    } finally {
      setBusy(false);
    }
  }

  async function renew() {
    setBusy(true);
    try {
      await addItem(line.productId, line.quantity);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await removeItem(line.productId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-[110px_1fr_130px] items-start gap-5 border-t border-rule py-7 max-[640px]:grid-cols-[84px_1fr] max-[640px]:gap-4">
      <div
        className="aspect-[3/4] w-[110px] rounded-[4px] bg-white bg-cover bg-center max-[640px]:w-[84px]"
        style={
          line.primaryThumbUrl
            ? { backgroundImage: `url(${line.primaryThumbUrl})` }
            : { backgroundImage: "repeating-linear-gradient(135deg, #F4F2ED 0 7px, #FFFFFF 7px 14px)" }
        }
      />
      <div>
        <div className="text-[15px]">{line.title}</div>
        <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
          {line.brand} · {line.sizeLabel}
        </div>
        <div className={`mt-3.5 font-mono text-[13px] uppercase tracking-[0.06em] ${expired ? "text-signal" : "text-ink"}`}>
          {expired ? "Hold expired" : `Reserved for you · ${formatted}`}
        </div>
        <div className="mt-4 flex items-center gap-5">
          <div className="flex items-center rounded-[2px] border border-rule">
            <button
              disabled={busy || line.quantity <= 1}
              onClick={() => changeQty(line.quantity - 1)}
              aria-label="Decrease"
              className="h-[38px] w-[38px] font-mono text-sm text-grey hover:bg-hover-light hover:text-ink disabled:opacity-40"
            >
              −
            </button>
            <span className="w-[34px] text-center font-mono text-[13px]">{line.quantity}</span>
            <button
              disabled={busy}
              onClick={() => changeQty(line.quantity + 1)}
              aria-label="Increase"
              className="h-[38px] w-[38px] font-mono text-sm text-grey hover:bg-hover-light hover:text-ink disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            disabled={busy}
            onClick={remove}
            className="border-b border-rule pb-0.5 text-[13px] text-grey hover:border-ink hover:text-ink"
          >
            Remove
          </button>
          {expired && (
            <button
              disabled={busy}
              onClick={renew}
              className="border-b border-ink pb-0.5 font-mono text-[11px] uppercase tracking-[0.1em] hover:text-grey hover:border-grey"
            >
              Renew hold
            </button>
          )}
        </div>
      </div>
      <div className="font-mono text-sm max-[640px]:col-span-2 max-[640px]:text-left">
        {formatMoney(line.pricePesewas * line.quantity)}
      </div>
    </div>
  );
}
