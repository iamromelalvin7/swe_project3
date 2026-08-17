import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/types";

function stateLine(p: ProductSummary): string {
  if (p.status === "SOLD_OUT") return "";
  if (p.status === "RESERVED") return "Reserved";
  return p.availableQuantity === 1 ? "1 left" : `${p.availableQuantity} available`;
}

export function ProductCard({ product, index }: { product: ProductSummary; index: number }) {
  const unavailable = product.status !== "AVAILABLE";
  const sold = product.status === "SOLD_OUT";

  return (
    <Link href={`/products/${product.id}`} className="block text-left hover:opacity-[0.72]">
      <div className="relative overflow-hidden rounded-[4px]">
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-[4px] bg-white bg-[length:14px_14px] ${
            sold ? "grayscale" : ""
          }`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #F4F2ED 0 7px, #FFFFFF 7px 14px)",
          }}
        >
          {product.primaryThumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryThumbUrl}
              alt={product.title}
              className="h-full w-full object-cover"
              fetchPriority={index < 4 ? "high" : "auto"}
            />
          ) : (
            <span className="absolute top-2.5 left-2.5 font-mono text-[11px] text-grey">{index + 1}</span>
          )}
        </div>
        {sold && (
          <div className="absolute right-[-27%] top-[13%] w-full origin-center rotate-45 bg-sold py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
            Sold out
          </div>
        )}
      </div>
      <div className="mt-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
        {product.brand} · {product.sizeLabel} · {product.categoryName}
      </div>
      <div className={`mt-1.5 text-sm ${unavailable ? "text-grey" : "text-ink"}`}>{product.title}</div>
      <div className={`mt-2 font-mono text-[13px] ${unavailable ? "text-grey" : "text-ink"} ${sold ? "line-through" : ""}`}>
        {formatMoney(product.pricePesewas)}
      </div>
      <div className="mt-1.5 h-4 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{stateLine(product)}</div>
    </Link>
  );
}
