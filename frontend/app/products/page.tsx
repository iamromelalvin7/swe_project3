import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import { RememberCatalogUrl } from "@/components/BackLink";
import { apiFetch } from "@/lib/api";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog";
import heroImage from "@/assets/hero-flatlay.jpg";
import type { CatalogFilterOptions, PageResponse, ProductSummary } from "@/lib/types";

const PARAMS = ["category", "brand", "size", "condition", "minPrice", "maxPrice", "q", "sort", "page"];

export default async function ProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const key of PARAMS) {
    const value = searchParams[key];
    if (typeof value === "string" && value.length > 0) params.set(key, value);
  }
  params.set("pageSize", String(CATALOG_PAGE_SIZE));
  const hideSold = searchParams.hideSold === "1";

  const [filters, listing] = await Promise.all([
    apiFetch<CatalogFilterOptions>("/api/catalog/filters", { cache: "no-store" }),
    apiFetch<PageResponse<ProductSummary>>(`/api/products?${params.toString()}`, { cache: "no-store" }),
  ]);

  const availableCount = listing.items.filter((p) => p.status === "AVAILABLE").length;

  return (
    <>
      <Header />
      <main>
        <Suspense>
          <RememberCatalogUrl />
        </Suspense>

        <section className="page-container grid grid-cols-[0.94fr_1.06fr] items-center gap-12 py-8 max-[900px]:grid-cols-1 max-[900px]:gap-7 max-[640px]:py-6">
          <div>
            <p className="font-mono text-label uppercase tracking-strip text-ink max-[640px]:tracking-label">Vintage / secondhand / one-of-one</p>
            <h1 className="mt-4 max-w-[660px] font-serif text-display tracking-display [text-wrap:balance]">
              Pieces with a past.
            </h1>
            <p className="mt-5 max-w-[470px] font-mono text-sm leading-[1.7] text-grey">
              Carefully curated vintage and secondhand garments for the modern man. Authentic pieces, unique stories.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 max-[640px]:mt-6">
              <Link href="#archive" className="btn-primary h-12 px-6">
                Explore the archive <span aria-hidden="true">→</span>
              </Link>
              <Link href="#how-it-works" className="link-underline">
                How it works
              </Link>
            </div>
          </div>

          <div className="relative aspect-[1935/813] overflow-hidden bg-plate max-[640px]:aspect-[1.6/1]">
            <Image
              src={heroImage}
              alt="A flat lay of curated menswear: an olive bomber jacket, a cream polo with a green collar, black-and-white low-top sneakers and a black polo, beside a folded newspaper."
              fill
              priority
              placeholder="blur"
              sizes="(max-width: 900px) 100vw, 53vw"
              className="object-cover object-[45%_50%]"
            />
          </div>
        </section>

        <section id="archive" aria-labelledby="archive-heading" className="page-container scroll-mt-4">
          <h2 id="archive-heading" className="flex h-[46px] items-center border-t border-rule font-mono text-label uppercase tracking-cta text-ink">
            The archive
            <span aria-hidden="true" className="mx-3 text-grey">
              /
            </span>
            <span className="text-grey">
              {hideSold
                ? `${availableCount} available`
                : `${listing.totalItems} ${listing.totalItems === 1 ? "piece" : "pieces"}`}
            </span>
          </h2>
          <FilterBar options={filters} />
          <div className="pb-20 pt-5 max-[640px]:pb-14">
            <ProductGrid key={`${params.toString()}-${hideSold}`} initial={listing} hideSold={hideSold} />
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-8 border-t border-rule">
          <div className="page-container py-14 max-[640px]:py-10">
            <h2 id="how-heading" className="eyebrow">
              How it works
            </h2>
            <ol className="mt-6 grid grid-cols-3 gap-10 max-[640px]:grid-cols-1 max-[640px]:gap-6">
              {[
                "Every piece is individually selected and photographed.",
                "Add a piece to your cart to reserve it for ten minutes.",
                "Pay by Mobile Money or choose cash on delivery.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="pt-1.5 font-mono text-label text-grey">0{i + 1}</span>
                  <p className="font-serif text-lead">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
