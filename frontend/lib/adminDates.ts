export type DateRange = "today" | "7d" | "30d" | "all";

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export function parseRange(value: string | null): DateRange {
  return value === "today" || value === "7d" || value === "30d" ? value : "all";
}

/** ISO `from` bound for the admin orders API (`null` for all time). */
export function rangeStart(range: DateRange, now: Date = new Date()): string | null {
  if (range === "all") return null;
  const start = new Date(now);
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - (range === "7d" ? 7 : 30));
  }
  return start.toISOString();
}

/** "Mon 13 Oct 2026, 14:22" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "13 Oct" this year, "13 Oct 2025" otherwise. */
export function formatShortDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}
