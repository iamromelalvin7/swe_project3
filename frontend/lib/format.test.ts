import { describe, expect, it } from "vitest";
import { formatCondition, formatStatus } from "./format";
import { formatMoney } from "./money";

describe("formatCondition", () => {
  it("maps every condition enum to a readable label", () => {
    expect(formatCondition("NEW_WITH_TAGS")).toBe("New with tags");
    expect(formatCondition("EXCELLENT")).toBe("Excellent");
    expect(formatCondition("GOOD")).toBe("Good");
    expect(formatCondition("FAIR")).toBe("Fair");
  });

  it("falls back to sentence case for unknown values", () => {
    expect(formatCondition("LIKE_NEW")).toBe("Like new");
  });
});

describe("formatStatus", () => {
  it("turns an order status enum into sentence case", () => {
    expect(formatStatus("OUT_FOR_DELIVERY")).toBe("Out for delivery");
    expect(formatStatus("PENDING")).toBe("Pending");
  });
});

describe("formatMoney", () => {
  it("formats pesewas as cedis with two decimals", () => {
    expect(formatMoney(38000)).toBe("GH₵ 380.00");
    expect(formatMoney(150050)).toBe("GH₵ 1,500.50");
    expect(formatMoney(0)).toBe("GH₵ 0.00");
  });
});
