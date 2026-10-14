import type { ProductSummary } from "./types";

/** Big enough that today's whole archive arrives in one page (API max is 50). */
export const CATALOG_PAGE_SIZE = 48;

/**
 * Display order for the grid. With the default ordering (no explicit sort),
 * available pieces come first and sold or held pieces follow, each group
 * keeping the API's newest-first order. An explicit sort (newest, price) is
 * respected exactly as the shopper chose it.
 */
export function orderForDisplay(items: ProductSummary[], sort: string | null): ProductSummary[] {
  if (sort) return items;
  const available = items.filter((p) => p.status === "AVAILABLE");
  const rest = items.filter((p) => p.status !== "AVAILABLE");
  return [...available, ...rest];
}

export const PRICE_BANDS: Record<string, { label: string; min?: number; max?: number }> = {
  under_300: { label: "Under GH₵ 300", max: 29999 },
  "300_500": { label: "GH₵ 300 to 500", min: 30000, max: 50000 },
  over_500: { label: "Over GH₵ 500", min: 50001 },
};

/** Which price band (if any) the current min/max query params describe. */
export function priceBandFor(min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  return (
    Object.entries(PRICE_BANDS).find(
      ([, band]) => String(band.min ?? "") === (min ?? "") && String(band.max ?? "") === (max ?? "")
    )?.[0] ?? null
  );
}
