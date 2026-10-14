"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/Dialog";

/**
 * Guards a form with unsaved edits. Closing or reloading the tab triggers the
 * browser's own "leave site?" prompt; clicking an in-app link opens an in-app
 * confirmation instead. Returns the dialog to render (or null).
 */
export function useUnsavedChanges(dirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const dialog = pendingHref ? (
    <ConfirmDialog
      title="Leave without saving?"
      body="Your changes to this product, including any new photos, will be lost."
      confirmLabel="Leave"
      danger
      onConfirm={() => {
        const href = pendingHref;
        setPendingHref(null);
        router.push(href);
      }}
      onCancel={() => setPendingHref(null)}
    />
  ) : null;

  return dialog;
}
