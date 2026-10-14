import Link from "next/link";
import { Header } from "@/components/Header";

export default function ProductNotFound() {
  return (
    <>
      <Header />
      <main className="page-container py-24 text-center">
        <div className="mb-2.5 font-serif text-h3">Piece not found</div>
        <p className="mb-6 text-sm text-grey">This piece isn&apos;t in the archive any more, or the link is wrong.</p>
        <Link href="/products#archive" className="link-underline">
          Back to the archive →
        </Link>
      </main>
    </>
  );
}
