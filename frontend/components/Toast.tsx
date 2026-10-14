"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastMessage = { id: number; text: string; action?: { href: string; label: string } };

const ToastContext = createContext<((text: string, action?: ToastMessage["action"]) => void) | null>(null);

/**
 * A single quiet confirmation line (e.g. "Added · held for 10:00"). Sits above
 * the bottom nav on mobile and top-right on desktop; announced politely to
 * screen readers; dismisses itself after five seconds.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((text: string, action?: ToastMessage["action"]) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), text, action });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-5 max-[849px]:bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+12px)] min-[850px]:right-[var(--page-gutter)] min-[850px]:left-auto min-[850px]:top-24 min-[850px]:px-0"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-[420px] items-center justify-between gap-5 bg-ink px-5 py-3.5 font-mono text-label uppercase tracking-label text-cream"
          >
            <span>{toast.text}</span>
            <span className="flex items-center gap-4">
              {toast.action && (
                <Link href={toast.action.href} className="underline underline-offset-4 hover:opacity-70" onClick={() => setToast(null)}>
                  {toast.action.label}
                </Link>
              )}
              <button type="button" aria-label="Dismiss" className="opacity-70 hover:opacity-100" onClick={() => setToast(null)}>
                ✕
              </button>
            </span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
