import type { ChipSpec, Tone } from "@/lib/adminStatus";

const TONES: Record<Tone, { box: string; dot: string }> = {
  neutral: { box: "border-rule text-grey", dot: "bg-disabled" },
  positive: { box: "border-rule text-ink", dot: "bg-stock" },
  attention: { box: "border-warning/40 text-warning", dot: "bg-warning" },
  negative: { box: "border-signal/40 text-signal", dot: "bg-signal" },
};

/** Outlined status label with a tone dot — the label always carries the meaning. */
export function StatusChip({ chip }: { chip: ChipSpec }) {
  const tone = TONES[chip.tone];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 font-mono text-micro uppercase tracking-label ${tone.box}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {chip.label}
    </span>
  );
}
