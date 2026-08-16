"use client";

import { Header } from "@/components/Header";

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <Header />
      <div className="border-b border-rule px-14 py-24 text-center max-[640px]:px-5">
        <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-signal">
          Request failed
        </div>
        <div className="mb-2.5 font-serif text-[28px]">The catalog did not load</div>
        <div className="mb-6 text-sm text-grey">The shop is reachable but the listing request failed.</div>
        <button
          onClick={reset}
          className="h-12 px-6 bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
