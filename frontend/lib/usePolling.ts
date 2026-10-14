"use client";

import { useEffect, useRef } from "react";
import type { OrderDetail, OrderStatus } from "./types";

/** How often a shopper's open order pages re-check their status. */
export const ORDER_POLL_MS = 20_000;

/** Delivered and cancelled orders never change status again. */
export function isFinalOrderStatus(status: OrderStatus): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}

/**
 * Whether an open order can still change: its status can move on, or it's a
 * delivered cash-on-delivery order whose payment hasn't been recorded yet.
 */
export function orderMayChange(order: Pick<OrderDetail, "status" | "paymentMethod" | "paymentStatus">): boolean {
  if (!isFinalOrderStatus(order.status)) return true;
  return order.status === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY" && order.paymentStatus !== "PAID";
}

/**
 * Calls `poll` every `intervalMs` while `enabled` and the tab is visible.
 * A hidden tab stops polling; coming back polls straight away, so a shopper
 * returning to the page sees the current state without waiting a full
 * interval. `poll` should update quietly: no loading state, and a failed
 * check keeps what's on screen (the next tick tries again).
 */
export function usePolling(poll: () => void, intervalMs: number, enabled: boolean) {
  const latest = useRef(poll);
  latest.current = poll;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer === null) timer = setInterval(() => latest.current(), intervalMs);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        latest.current();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
