"use client";

import { Header } from "@/components/Header";
import { ErrorState } from "@/components/States";

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <Header />
      <main className="page-container">
        <ErrorState
          title="We couldn't load the archive"
          message="Check your connection and try again."
          onRetry={reset}
          className="py-24"
        />
      </main>
    </>
  );
}
