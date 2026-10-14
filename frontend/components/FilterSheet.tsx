"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialog";

export type FilterGroup = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

/** Current choice per group (null = All), plus the "hide sold" toggle. */
export type FilterDraft = { values: Record<string, string | null>; hideSold: boolean };

/**
 * Phone-sized filters: every group laid out as tappable chips in a bottom
 * sheet, applied together with one button. Changes stay local until
 * "Show results", so a shopper can set several filters in one go.
 */
export function FilterSheet({
  groups,
  initial,
  onApply,
  onClose,
}: {
  groups: FilterGroup[];
  initial: FilterDraft;
  onApply: (draft: FilterDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<FilterDraft>(initial);

  function choose(key: string, value: string | null) {
    setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));
  }

  const activeCount = Object.values(draft.values).filter(Boolean).length + (draft.hideSold ? 1 : 0);

  return (
    <Dialog labelledBy="filter-sheet-title" onClose={onClose} variant="sheet" className="">
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <h2 id="filter-sheet-title" className="font-mono text-label uppercase tracking-label">
          Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close filters" className="-mr-2 flex h-10 w-10 items-center justify-center" data-autofocus>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M1.5 1.5l13 13M14.5 1.5l-13 13" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
        {groups.map((g) => (
          <fieldset key={g.key} className="border-b border-rule py-4 last:border-b-0">
            <legend className="eyebrow float-left mb-3 w-full">{g.label}</legend>
            <div className="clear-left flex flex-wrap gap-2">
              {[{ value: null as string | null, label: "All" }, ...g.options].map((o) => {
                const selected = (draft.values[g.key] ?? null) === o.value;
                return (
                  <button
                    key={o.value ?? "__all"}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(g.key, o.value)}
                    className={`h-10 border px-3.5 font-mono text-micro uppercase tracking-label transition-colors ${
                      selected ? "border-ink bg-ink text-cream" : "border-rule text-ink hover:border-ink"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
          <span>
            <span className="eyebrow block">Hide sold pieces</span>
            <span className="mt-1 block text-sm text-grey">Only show what you can buy right now.</span>
          </span>
          <input
            type="checkbox"
            checked={draft.hideSold}
            onChange={(e) => setDraft((d) => ({ ...d, hideSold: e.target.checked }))}
            className="h-5 w-5 flex-shrink-0 accent-ink"
          />
        </label>
      </div>

      <div className="flex gap-3 border-t border-rule px-5 py-4">
        <button
          type="button"
          onClick={() => setDraft({ values: Object.fromEntries(groups.map((g) => [g.key, null])), hideSold: false })}
          className="btn-outline h-12 flex-1"
        >
          Clear all
        </button>
        <button type="button" onClick={() => onApply(draft)} className="btn-primary h-12 flex-[2]">
          Show results
        </button>
      </div>
    </Dialog>
  );
}
