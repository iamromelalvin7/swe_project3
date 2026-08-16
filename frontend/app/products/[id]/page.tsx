import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartButton } from "@/components/AddToCartButton";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { ProductDetail } from "@/lib/types";

async function getProduct(id: string): Promise<ProductDetail> {
  try {
    return await apiFetch<ProductDetail>(`/api/products/${id}`, { cache: "no-store" });
  } catch (err) {
    if (err instanceof ApiRequestError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  const availabilityLine =
    product.status === "AVAILABLE"
      ? `${product.availableQuantity} available`
      : product.status === "RESERVED"
        ? "Reserved"
        : "Sold out";

  const specs: [string, string | null][] = [
    ["Brand", product.brand],
    ["Category", product.categoryName],
    ["Size", product.sizeLabel],
    ["Condition", product.condition.replace(/_/g, " ")],
    ["Colour", product.colour],
    ["Era", product.era],
    ["Fit notes", product.sizingNotes],
    ["Flaws", product.flaws],
  ];

  return (
    <main>
      <Header />
      <div className="px-14 pt-11 pb-[120px] max-[640px]:px-5 max-[640px]:pt-7">
        <Link href="/products" className="mb-7 inline-block font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink">
          ← Back to catalog
        </Link>
        <div className="grid grid-cols-[60%_1fr] items-start gap-12 max-[900px]:grid-cols-1">
          <ProductGallery images={product.images} title={product.title} />

          <div className="sticky top-[60px]">
            <h1 className="font-serif text-4xl leading-[1.1] max-[640px]:text-[30px]">{product.title}</h1>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
              {product.brand} · {product.sizeLabel} · {product.condition.replace(/_/g, " ")}
            </div>
            <div
              className={`mt-7 font-mono text-2xl ${product.status === "SOLD_OUT" ? "text-grey line-through" : "text-ink"}`}
            >
              {formatMoney(product.pricePesewas)}
            </div>
            <div
              className={`mt-2 font-mono text-[11px] uppercase tracking-[0.1em] ${
                product.status === "AVAILABLE" ? "text-ink" : "text-signal"
              }`}
            >
              {availabilityLine}
            </div>

            <AddToCartButton status={product.status} productId={product.id} />

            {product.description && <p className="mt-7 text-sm text-grey">{product.description}</p>}

            <div className="mt-9">
              {specs
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-6 border-t border-rule py-3.5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{label}</span>
                    <span className="text-right text-sm">{value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
