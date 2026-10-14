"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authFetch } from "./api";
import { useAuth } from "./auth";
import type { CartLine } from "./types";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  /** True once any line's hold has run out — re-evaluated the moment it does. */
  anyExpired: boolean;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<CartLine[]>;
  removeItem: (productId: string) => Promise<CartLine[]>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Bumped when the earliest live hold expires, so `count` / `anyExpired`
  // (and every consumer) re-render on time instead of on the next click.
  const [expiryTick, setExpiryTick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const nextExpiry = lines
      .map((l) => new Date(l.expiresAt).getTime())
      .filter((t) => t > now)
      .sort((a, b) => a - b)[0];
    if (nextExpiry === undefined) return;
    const id = setTimeout(() => setExpiryTick((t) => t + 1), nextExpiry - now + 50);
    return () => clearTimeout(id);
  }, [lines, expiryTick]);

  const refresh = useCallback(async () => {
    if (!user) {
      setLines([]);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const cart = await authFetch<CartLine[]>("/api/cart");
      setLines(cart);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.id]);

  const addItem = useCallback(
    async (productId: string, quantity: number) => {
      if (!user) throw new Error("Must be signed in to add to cart");
      const updated = await authFetch<CartLine[]>("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      setLines(updated);
      return updated;
    },
    [user]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!user) throw new Error("Must be signed in to modify cart");
      const updated = await authFetch<CartLine[]>(`/api/cart/items/${productId}`, {
        method: "DELETE",
      });
      setLines(updated);
      return updated;
    },
    [user]
  );

  const now = Date.now();
  const count = lines.filter((l) => new Date(l.expiresAt).getTime() > now).length;
  const anyExpired = lines.some((l) => new Date(l.expiresAt).getTime() <= now);

  return (
    <CartContext.Provider value={{ lines, count, anyExpired, loading, error, refresh, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
