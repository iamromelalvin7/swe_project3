"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal shell: dims the page, moves focus inside on open, keeps Tab inside,
 * closes on Escape, and hands focus back to whatever opened it.
 */
export function Dialog({
  labelledBy,
  onClose,
  children,
  className = "max-w-[400px]",
  variant = "modal",
}: {
  labelledBy: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** "sheet" slides up from the bottom edge, full width — for phone-sized controls. */
  variant?: "modal" | "sheet";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-ink/50 ${variant === "sheet" ? "items-end" : "items-center p-5"}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={
          variant === "sheet"
            ? `flex max-h-[88dvh] w-full flex-col border-t border-rule bg-cream pb-[env(safe-area-inset-bottom)] outline-none ${className}`
            : `w-full border border-rule bg-cream p-6 outline-none ${className}`
        }
      >
        {children}
      </div>
    </div>
  );
}

/** In-app replacement for window.confirm(). */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog labelledBy="confirm-dialog-title" onClose={onCancel}>
      <h2 id="confirm-dialog-title" className="font-serif text-h3">
        {title}
      </h2>
      <p className="mt-3 text-sm text-grey">{body}</p>
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-outline h-11" data-autofocus>
          Keep it
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`btn-primary h-11 ${danger ? "bg-signal hover:bg-signal/90" : ""}`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
