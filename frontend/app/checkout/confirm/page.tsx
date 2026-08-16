"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { authFetch, ApiRequestError } from "@/lib/api";
import type { OrderDetail } from "@/lib/types";

function ConfirmInner() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user || !reference) return;
    authFetch<OrderDetail>(`/api/checkout/verify?reference=${encodeURIComponent(reference)}`, user.token)
      .then((order) => router.push(`/orders/${order.id}?placed=1`))
      .catch((err) => setError(err instanceof ApiRequestError ? err.error.message : "Could not verify payment."));
  }, [ready, user, reference, router]);

  return (
    <main>
      <Header />
      <div className="px-14 py-24 text-center max-[640px]:px-5">
        {error ? (
          <>
            <div className="mb-2.5 font-serif text-[28px]">We couldn&apos;t confirm that payment</div>
            <div className="text-sm text-grey">{error}</div>
          </>
        ) : (
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Confirming your payment…</div>
        )}
      </div>
    </main>
  );
}

export default function CheckoutConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  );
}
