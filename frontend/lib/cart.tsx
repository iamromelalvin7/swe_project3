"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authFetch } from "./api";
import { useAuth } from "./auth";
import type { CartLine } from "./types";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<CartLine[]>;
  removeItem: (productId: string) => Promise<CartLine[]>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLines([]);
      return;
    }
    setLoading(true);
    try {
      const cart = await authFetch<CartLine[]>("/api/cart", user.token);
      setLines(cart);
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
      const updated = await authFetch<CartLine[]>("/api/cart/items", user.token, {
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
      const updated = await authFetch<CartLine[]>(`/api/cart/items/${productId}`, user.token, {
        method: "DELETE",
      });
      setLines(updated);
      return updated;
    },
    [user]
  );

  const count = lines.filter((l) => new Date(l.expiresAt).getTime() > Date.now()).length;

  return (
    <CartContext.Provider value={{ lines, count, loading, refresh, addItem, removeItem }}>
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
