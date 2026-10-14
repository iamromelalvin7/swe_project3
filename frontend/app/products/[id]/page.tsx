import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BackToCatalog } from "@/components/BackLink";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formatCondition } from "@/lib/format";
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

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  try {
    const product = await apiFetch<ProductDetail>(`/api/products/${params.id}`, { cache: "no-store" });
    const description = `${product.brand} · Size ${product.sizeLabel} · ${formatCondition(product.condition)} · ${formatMoney(product.pricePesewas)}`;
    return {
      title: product.title,
      description,
      openGraph: {
        title: `${product.title} — Archive 233`,
        description,
        images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
      },
    };
  } catch {
    return { title: "Piece not found" };
  }
}

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const product = await getProduct(id);
  const sold = product.status === "SOLD_OUT";

  const specs: [string, string | null][] = [
    ["Brand", product.brand],
    ["Category", product.categoryName],
    ["Size", product.sizeLabel],
    ["Condition", formatCondition(product.condition)],
    ["Colour", product.colour],
    ["Era", product.era],
    ["Fit notes", product.sizingNotes],
    ["Flaws", product.flaws],
  ];

  return (
    <>
      <Header />
      <main className="page-container pb-24 pt-8 max-[640px]:pb-14 max-[640px]:pt-3">
        <BackToCatalog className="mb-7 max-[640px]:mb-3 max-[640px]:py-1" />
        <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)] items-start gap-14 max-[1100px]:gap-10 max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[640px]:gap-6">
          <ProductGallery images={product.images} title={product.title} />

          <div className="sticky top-6 max-[900px]:static">
            <p className="font-mono text-label uppercase tracking-label text-grey">
              {product.brand} · {product.sizeLabel} · {formatCondition(product.condition)}
            </p>
            <h1 className="mt-2 font-serif text-h2 max-[640px]:text-h3">{product.title}</h1>
            <p className={`mt-5 font-mono text-lead max-[640px]:mt-3 ${sold ? "text-grey" : "text-ink"}`}>{formatMoney(product.pricePesewas)}</p>

            <AddToCartButton status={product.status} productId={product.id} availableQuantity={product.availableQuantity} />

            {product.description && <p className="mt-8 text-body text-ink/85">{product.description}</p>}

            <dl className="mt-9 border-b border-rule">
              {specs
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-6 border-t border-rule py-3.5">
                    <dt className="eyebrow">{label}</dt>
                    <dd className="text-right text-sm">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
