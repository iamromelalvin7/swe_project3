import { describe, expect, it } from "vitest";
import { availabilityChip, nextOrderStep, orderStatusChip, paymentChip, productStatusChip } from "./adminStatus";
import { telLink, toInternationalDigits, whatsappLink } from "./phone";
import { redirectAfterLogin } from "./redirect";

describe("status chips", () => {
  it("never shows an unpaid order as an alarm", () => {
    expect(paymentChip("PENDING")).toEqual({ label: "Unpaid", tone: "neutral" });
    expect(paymentChip("PAID").tone).toBe("positive");
    expect(paymentChip("FAILED").tone).toBe("negative");
  });

  it("labels every product, availability and order status", () => {
    expect(productStatusChip("DRAFT")).toEqual({ label: "Draft", tone: "attention" });
    expect(availabilityChip("RESERVED")).toEqual({ label: "On hold", tone: "attention" });
    expect(orderStatusChip("OUT_FOR_DELIVERY").label).toBe("Out for delivery");
    expect(orderStatusChip("CANCELLED").tone).toBe("neutral");
  });

  it("walks the fulfilment steps forward and stops at the end", () => {
    expect(nextOrderStep("PENDING")).toBe("CONFIRMED");
    expect(nextOrderStep("OUT_FOR_DELIVERY")).toBe("DELIVERED");
    expect(nextOrderStep("DELIVERED")).toBeNull();
    expect(nextOrderStep("CANCELLED")).toBeNull();
  });
});

describe("phone links", () => {
  it("normalises Ghana numbers to international digits", () => {
    expect(toInternationalDigits("024 123 4567")).toBe("233241234567");
    expect(toInternationalDigits("+233 24 123 4567")).toBe("233241234567");
    expect(toInternationalDigits("241234567")).toBe("233241234567");
    expect(toInternationalDigits("123")).toBeNull();
  });

  it("builds WhatsApp and tel links", () => {
    expect(whatsappLink("024 123 4567")).toBe("https://wa.me/233241234567");
    expect(telLink("024 123 4567")).toBe("tel:+233241234567");
    expect(whatsappLink("n/a")).toBeNull();
  });
});

describe("redirectAfterLogin", () => {
  it("sends admins back to admin pages, or to the dashboard", () => {
    expect(redirectAfterLogin("/admin/orders", "ADMIN")).toBe("/admin/orders");
    expect(redirectAfterLogin(null, "ADMIN")).toBe("/admin/dashboard");
    expect(redirectAfterLogin("/checkout", "ADMIN")).toBe("/admin/dashboard");
    expect(redirectAfterLogin("//evil.example/admin", "ADMIN")).toBe("/admin/dashboard");
  });

  it("keeps customers on the purchase allow-list and out of admin", () => {
    expect(redirectAfterLogin("/checkout", "CUSTOMER")).toBe("/checkout");
    expect(redirectAfterLogin("/admin/orders", "CUSTOMER")).toBe("/products");
  });
});
