import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/types";
import { ImagePlaceholder } from "./ProductImage";

function stockLine(product: ProductSummary): string {
  return product.availableQuantity === 1 ? "1 left" : "In stock";
}

export function ProductCard({ product, index }: { product: ProductSummary; index: number }) {
  const sold = product.status === "SOLD_OUT";
  const held = product.status === "RESERVED";

  return (
    <Link href={`/products/${product.id}`} className="group block text-left outline-offset-4">
      <div className="relative aspect-[3/4] overflow-hidden bg-plate">
        {product.primaryThumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryThumbUrl}
            alt={product.title}
            loading={index < 8 ? "eager" : "lazy"}
            fetchPriority={index < 4 ? "high" : "auto"}
            className={`h-full w-full object-cover transition-[opacity,transform] duration-200 ease-out group-hover:scale-[1.012] ${sold ? "opacity-75" : ""}`}
          />
        ) : (
          <ImagePlaceholder />
        )}
        {(sold || held) && (
          <span className="absolute left-0 top-3 bg-ink px-2.5 py-1.5 font-mono text-micro uppercase tracking-label text-cream">
            {sold ? "Sold out" : "On hold"}
          </span>
        )}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-1.5 font-mono text-micro uppercase tracking-label text-grey">
        <span>{product.brand}</span>
        <span aria-hidden="true">·</span>
        <span>{product.sizeLabel}</span>
        <span aria-hidden="true" className="max-[640px]:hidden">·</span>
        <span className="max-[640px]:hidden">{product.categoryName}</span>
      </p>
      <h3 className="mt-1.5 font-serif text-title text-ink">{product.title}</h3>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 max-[430px]:flex-col max-[430px]:items-start">
        <span className="font-mono text-meta text-ink">{formatMoney(product.pricePesewas)}</span>
        {!sold && !held && (
          <span className="flex items-center gap-1.5 font-mono text-micro uppercase tracking-label text-grey">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-stock" />
            {stockLine(product)}
          </span>
        )}
      </div>
    </Link>
  );
}
