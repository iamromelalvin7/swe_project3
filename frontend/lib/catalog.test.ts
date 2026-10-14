import { describe, expect, it } from "vitest";
import { orderForDisplay, priceBandFor } from "./catalog";
import type { ProductSummary } from "./types";

function product(id: string, status: ProductSummary["status"]): ProductSummary {
  return {
    id,
    title: id,
    brand: "Brand",
    sizeLabel: "M",
    pricePesewas: 10000,
    categoryName: "Shirts",
    primaryImageUrl: null,
    primaryThumbUrl: null,
    availableQuantity: status === "AVAILABLE" ? 1 : 0,
    status,
  };
}

describe("orderForDisplay", () => {
  const items = [product("a", "SOLD_OUT"), product("b", "AVAILABLE"), product("c", "RESERVED"), product("d", "AVAILABLE")];

  it("puts available pieces first by default, keeping relative order", () => {
    expect(orderForDisplay(items, null).map((p) => p.id)).toEqual(["b", "d", "a", "c"]);
  });

  it("respects an explicit sort untouched", () => {
    expect(orderForDisplay(items, "price_asc").map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("priceBandFor", () => {
  it("matches each band from its query params", () => {
    expect(priceBandFor(null, "29999")).toBe("under_300");
    expect(priceBandFor("30000", "50000")).toBe("300_500");
    expect(priceBandFor("50001", null)).toBe("over_500");
  });

  it("returns null for no params or an unknown range", () => {
    expect(priceBandFor(null, null)).toBeNull();
    expect(priceBandFor("1", "2")).toBeNull();
  });
});
