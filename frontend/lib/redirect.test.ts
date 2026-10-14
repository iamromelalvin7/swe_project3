import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("returns shoppers to cart, checkout and product pages", () => {
    expect(safeRedirect("/cart")).toBe("/cart");
    expect(safeRedirect("/checkout")).toBe("/checkout");
    expect(safeRedirect("/products/b6b8cc4d-917f-4719-8acf-c8205371d3fb")).toBe(
      "/products/b6b8cc4d-917f-4719-8acf-c8205371d3fb"
    );
  });

  it("sends every other destination to the storefront", () => {
    expect(safeRedirect(null)).toBe("/products");
    expect(safeRedirect("/account")).toBe("/products");
    expect(safeRedirect("/admin/dashboard")).toBe("/products");
  });

  it("never follows off-site URLs", () => {
    expect(safeRedirect("https://evil.example")).toBe("/products");
    expect(safeRedirect("//evil.example/cart")).toBe("/products");
  });
});
