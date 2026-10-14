"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
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
    authFetch<OrderDetail>(`/api/checkout/verify?reference=${encodeURIComponent(reference)}`, { method: "POST" })
      .then((order) => router.push(`/orders/${order.id}?placed=1`))
      .catch((err) => setError(err instanceof ApiRequestError ? err.error.message : "We couldn't verify the payment."));
  }, [ready, user, reference, router]);

  return (
    <>
      <Header />
      <main className="page-container py-24 text-center">
        {error || !reference ? (
          <div role="alert">
            <div className="mb-2.5 font-serif text-h3">We couldn&apos;t confirm that payment</div>
            <p className="mb-7 text-sm text-grey">{error ?? "This page is missing its payment reference."}</p>
            <Link href="/account?tab=orders" className="link-underline">
              View your orders →
            </Link>
          </div>
        ) : (
          <p role="status" className="eyebrow">
            Confirming your payment…
          </p>
        )}
      </main>
    </>
  );
}

export default function CheckoutConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  );
}
