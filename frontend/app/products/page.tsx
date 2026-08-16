import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import { apiFetch } from "@/lib/api";
import type { CatalogFilterOptions, PageResponse, ProductSummary } from "@/lib/types";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = new URLSearchParams();
  for (const key of ["category", "brand", "size", "condition", "minPrice", "maxPrice", "q", "sort", "page"]) {
    const value = searchParams[key];
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }

  const [filters, listing] = await Promise.all([
    apiFetch<CatalogFilterOptions>("/api/catalog/filters", { cache: "no-store" }),
    apiFetch<PageResponse<ProductSummary>>(`/api/products?${params.toString()}`, { cache: "no-store" }),
  ]);

  return (
    <main>
      <Header />
      <FilterBar options={filters} />
      <div className="px-14 pt-11 pb-24 max-[640px]:px-5 max-[640px]:pt-7">
        <ProductGrid key={params.toString()} initial={listing} />
      </div>
    </main>
  );
}
