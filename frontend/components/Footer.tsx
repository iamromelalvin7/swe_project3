import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-rule">
      <div className="page-container grid grid-cols-[1.4fr_1fr_1fr] gap-10 py-12 max-[640px]:grid-cols-2 max-[640px]:gap-8 max-[640px]:py-10">
        <div className="max-[640px]:col-span-2">
          <Link href="/products" className="font-serif text-h3 leading-none tracking-display text-ink hover:text-grey">
            Archive 233
          </Link>
          <p className="mt-3 max-w-[34ch] text-sm text-grey">
            Curated secondhand and vintage menswear, selected and photographed one piece at a time in Accra.
          </p>
        </div>
        <nav aria-label="Shop">
          <div className="eyebrow mb-3">Shop</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products#archive" className="hover:text-grey">The archive</Link></li>
            <li><Link href="/products?sort=newest#archive" className="hover:text-grey">New arrivals</Link></li>
            <li><Link href="/products#how-it-works" className="hover:text-grey">How it works</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <div className="eyebrow mb-3">Account</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/account" className="hover:text-grey">Your account</Link></li>
            <li><Link href="/account?tab=orders" className="hover:text-grey">Orders</Link></li>
            <li><Link href="/cart" className="hover:text-grey">Cart</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-rule">
        <div className="page-container flex h-12 items-center justify-between font-mono text-micro uppercase tracking-label text-grey">
          <span>© {new Date().getFullYear()} Archive 233</span>
          <span>Accra, Ghana</span>
        </div>
      </div>
    </footer>
  );
}
