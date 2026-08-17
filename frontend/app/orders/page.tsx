"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Consolidated into the unified /account screen (Details / My orders tabs),
// matching the design's isAccount screen. Kept as a redirect rather than a
// hard 404 so any existing links to /orders keep working.
export default function OrdersRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account?tab=orders");
  }, [router]);
  return null;
}
