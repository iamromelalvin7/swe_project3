import Link from "next/link";
import { Header } from "@/components/Header";

export default function ProductNotFound() {
  return (
    <main>
      <Header />
      <div className="px-14 py-24 text-center max-[640px]:px-5">
        <div className="mb-2.5 font-serif text-[28px]">Piece not found</div>
        <div className="mb-6 text-sm text-grey">This item isn&apos;t available or never existed.</div>
        <Link
          href="/products"
          className="border-b border-ink pb-[3px] font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:text-grey hover:border-grey"
        >
          Back to catalog
        </Link>
      </div>
    </main>
  );
}
