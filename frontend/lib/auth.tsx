"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";

/**
 * The signed-in user as the browser knows them. There is deliberately no
 * token here: the session lives in an HttpOnly cookie that page JavaScript
 * (including any injected script) can't read.
 */
export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

/** Where older versions kept the token in localStorage — removed on load. */
const LEGACY_STORAGE_KEY = "archive233_auth";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  /** Record a sign-in. The cookie was already set by the sign-in response. */
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<Omit<AuthUser, "id" | "role">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // storage unavailable — nothing to clean up
    }
    apiFetch<{ user?: AuthUser }>("/api/auth/session")
      .then((res) => setUser(res.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback((next: AuthUser) => setUser(next), []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((patch: Partial<Omit<AuthUser, "id" | "role">>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return <AuthContext.Provider value={{ user, ready, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
