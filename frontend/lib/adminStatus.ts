import type { AvailabilityStatus, OrderStatus, PaymentStatus, ProductStatus } from "./types";

/** Visual weight of a status chip. Meaning is always in the label too, never colour alone. */
export type Tone = "neutral" | "positive" | "attention" | "negative";

export type ChipSpec = { label: string; tone: Tone };

export function productStatusChip(status: ProductStatus): ChipSpec {
  switch (status) {
    case "PUBLISHED":
      return { label: "Published", tone: "positive" };
    case "DRAFT":
      return { label: "Draft", tone: "attention" };
    case "ARCHIVED":
      return { label: "Archived", tone: "neutral" };
  }
}

export function availabilityChip(availability: AvailabilityStatus): ChipSpec {
  switch (availability) {
    case "AVAILABLE":
      return { label: "Available", tone: "positive" };
    case "RESERVED":
      return { label: "On hold", tone: "attention" };
    case "SOLD_OUT":
      return { label: "Sold out", tone: "negative" };
  }
}

export function orderStatusChip(status: OrderStatus): ChipSpec {
  switch (status) {
    case "PENDING":
      return { label: "Pending", tone: "attention" };
    case "CONFIRMED":
      return { label: "Confirmed", tone: "attention" };
    case "PACKED":
      return { label: "Packed", tone: "attention" };
    case "OUT_FOR_DELIVERY":
      return { label: "Out for delivery", tone: "attention" };
    case "DELIVERED":
      return { label: "Delivered", tone: "positive" };
    case "CANCELLED":
      return { label: "Cancelled", tone: "neutral" };
  }
}

/**
 * List rows carry the payment status but not the method, so an unpaid order
 * reads as a neutral "Unpaid" — for cash on delivery that is the normal state
 * until the rider collects, so it must not look like an alarm.
 */
export function paymentChip(status: PaymentStatus): ChipSpec {
  switch (status) {
    case "PAID":
      return { label: "Paid", tone: "positive" };
    case "PENDING":
      return { label: "Unpaid", tone: "neutral" };
    case "FAILED":
      return { label: "Payment failed", tone: "negative" };
  }
}

/** The fulfilment steps in order; CANCELLED can branch off any of the first four. */
export const ORDER_STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

/** The next forward step an admin can move an order to, if any. */
export function nextOrderStep(status: OrderStatus): OrderStatus | null {
  const i = ORDER_STEPS.indexOf(status);
  return i >= 0 && i < ORDER_STEPS.length - 1 ? ORDER_STEPS[i + 1] : null;
}
