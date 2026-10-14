import type { OrderStatus, ProductCondition } from "./types";

const CONDITION_LABELS: Record<ProductCondition, string> = {
  NEW_WITH_TAGS: "New with tags",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
};

/** Human label for a condition enum — never show the raw `NEW_WITH_TAGS`. */
export function formatCondition(condition: string): string {
  return CONDITION_LABELS[condition as ProductCondition] ?? sentenceCase(condition);
}

/** `OUT_FOR_DELIVERY` → `Out for delivery`. */
export function formatStatus(status: OrderStatus | string): string {
  return sentenceCase(status);
}

function sentenceCase(value: string): string {
  const words = value.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
