import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ORDER_POLL_MS, isFinalOrderStatus, orderMayChange, usePolling } from "./usePolling";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let visibility: DocumentVisibilityState = "visible";
let root: Root;

function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

function mount(poll: () => void, enabled: boolean) {
  function Poller({ on }: { on: boolean }) {
    usePolling(poll, ORDER_POLL_MS, on);
    return null;
  }
  act(() => root.render(createElement(Poller, { on: enabled })));
  return (on: boolean) => act(() => root.render(createElement(Poller, { on })));
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  root = createRoot(document.createElement("div"));
});

afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe("usePolling", () => {
  it("polls every 20 seconds while the tab is visible", () => {
    const poll = vi.fn();
    mount(poll, true);

    advance(ORDER_POLL_MS - 1);
    expect(poll).not.toHaveBeenCalled();
    advance(1);
    expect(poll).toHaveBeenCalledTimes(1);
    advance(ORDER_POLL_MS * 2);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("stops while the tab is hidden and checks straight away on return", () => {
    const poll = vi.fn();
    mount(poll, true);

    setVisibility("hidden");
    advance(ORDER_POLL_MS * 5);
    expect(poll).not.toHaveBeenCalled();

    setVisibility("visible");
    expect(poll).toHaveBeenCalledTimes(1);
    advance(ORDER_POLL_MS);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("does nothing when disabled, and stops once disabled", () => {
    const poll = vi.fn();
    const rerender = mount(poll, false);
    advance(ORDER_POLL_MS * 3);
    expect(poll).not.toHaveBeenCalled();

    rerender(true);
    advance(ORDER_POLL_MS);
    expect(poll).toHaveBeenCalledTimes(1);

    rerender(false);
    advance(ORDER_POLL_MS * 3);
    setVisibility("visible");
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("stops when the page unmounts", () => {
    const poll = vi.fn();
    mount(poll, true);
    act(() => root.unmount());
    root = createRoot(document.createElement("div"));
    advance(ORDER_POLL_MS * 3);
    expect(poll).not.toHaveBeenCalled();
  });
});

describe("isFinalOrderStatus", () => {
  it("treats only delivered and cancelled as final", () => {
    expect(isFinalOrderStatus("DELIVERED")).toBe(true);
    expect(isFinalOrderStatus("CANCELLED")).toBe(true);
    for (const status of ["PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"] as const) {
      expect(isFinalOrderStatus(status)).toBe(false);
    }
  });
});

describe("orderMayChange", () => {
  it("keeps watching open orders", () => {
    expect(orderMayChange({ status: "OUT_FOR_DELIVERY", paymentMethod: "PAYSTACK", paymentStatus: "PAID" })).toBe(true);
  });

  it("keeps watching a delivered cash order until the cash is recorded", () => {
    expect(orderMayChange({ status: "DELIVERED", paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING" })).toBe(true);
    expect(orderMayChange({ status: "DELIVERED", paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PAID" })).toBe(false);
  });

  it("stops for delivered card orders and anything cancelled", () => {
    expect(orderMayChange({ status: "DELIVERED", paymentMethod: "PAYSTACK", paymentStatus: "PAID" })).toBe(false);
    expect(orderMayChange({ status: "CANCELLED", paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING" })).toBe(false);
  });
});
