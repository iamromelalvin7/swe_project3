"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AuthUser = {
  token: string;
  id: string;
  fullName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

export const AUTH_STORAGE_KEY = "archive233_auth";
const STORAGE_KEY = AUTH_STORAGE_KEY;

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (auth: AuthUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<Omit<AuthUser, "token" | "id" | "role">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  const login = useCallback((auth: AuthUser) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setUser(auth);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<Omit<AuthUser, "token" | "id" | "role">>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
