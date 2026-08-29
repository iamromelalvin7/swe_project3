"use client";

import type { CatalogFilterOptions, ProductCondition } from "@/lib/types";

const CONDITIONS: ProductCondition[] = ["NEW_WITH_TAGS", "EXCELLENT", "GOOD", "FAIR"];

export type ProductFormValues = {
  title: string;
  categoryId: string;
  brand: string;
  sizeLabel: string;
  condition: ProductCondition | "";
  pricePesewas: string;
  stockQuantity: string;
  colour: string;
  era: string;
  sizingNotes: string;
  flaws: string;
};

export const emptyProductForm: ProductFormValues = {
  title: "",
  categoryId: "",
  brand: "",
  sizeLabel: "",
  condition: "",
  pricePesewas: "",
  stockQuantity: "1",
  colour: "",
  era: "",
  sizingNotes: "",
  flaws: "",
};

/** The metadata fields shared by the new-product and edit-product forms. */
export function ProductFormFields({
  form,
  update,
  errors,
  options,
}: {
  form: ProductFormValues;
  update: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void;
  errors: Record<string, string>;
  options: CatalogFilterOptions | null;
}) {
  const selectedSizeGroup = options?.categories.find((c) => c.id === form.categoryId)?.sizeGroup ?? null;
  const sizeOptions = selectedSizeGroup ? options?.sizeOptionsByGroup[selectedSizeGroup] ?? [] : [];

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-7 min-[640px]:grid-cols-6">
      <FormField label="Title" span="min-[640px]:col-span-6" error={errors.title}>
        <input
          className="field-input"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. 1990s Carhartt Detroit Jacket"
        />
      </FormField>
      <FormField label="Category" span="min-[640px]:col-span-2" error={errors.categoryId}>
        <select
          className="field-input"
          value={form.categoryId}
          onChange={(e) => {
            update("categoryId", e.target.value);
            update("sizeLabel", "");
          }}
        >
          <option value="">Select</option>
          {options?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Brand" span="min-[640px]:col-span-2" error={errors.brand}>
        <input className="field-input" value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Carhartt" />
      </FormField>
      <FormField label="Size" span="min-[640px]:col-span-2" error={errors.sizeLabel}>
        <select
          className="field-input"
          value={form.sizeLabel}
          onChange={(e) => update("sizeLabel", e.target.value)}
          disabled={!form.categoryId}
        >
          <option value="">{form.categoryId ? "Select" : "Pick a category first"}</option>
          {sizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Condition" span="min-[640px]:col-span-2" error={errors.condition}>
        <select className="field-input" value={form.condition} onChange={(e) => update("condition", e.target.value as ProductCondition)}>
          <option value="">Select</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Price GHS" span="min-[640px]:col-span-2" error={errors.pricePesewas}>
        <input
          className="field-input font-mono"
          value={form.pricePesewas}
          onChange={(e) => update("pricePesewas", e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
        />
      </FormField>
      <FormField label="Quantity" span="min-[640px]:col-span-2" error={errors.stockQuantity} help="Leave at 1 for one-of-a-kind pieces">
        <input
          className="field-input font-mono"
          value={form.stockQuantity}
          onChange={(e) => update("stockQuantity", e.target.value)}
          placeholder="1"
          inputMode="numeric"
        />
      </FormField>
      <FormField label="Colour" span="min-[640px]:col-span-3">
        <input className="field-input" value={form.colour} onChange={(e) => update("colour", e.target.value)} placeholder="Hamilton Brown" />
      </FormField>
      <FormField label="Era" span="min-[640px]:col-span-3">
        <input className="field-input" value={form.era} onChange={(e) => update("era", e.target.value)} placeholder="1990s" />
      </FormField>
      <FormField label="Fit notes" span="min-[640px]:col-span-6">
        <input
          className="field-input"
          value={form.sizingNotes}
          onChange={(e) => update("sizingNotes", e.target.value)}
          placeholder="How does this piece measure and drape?"
        />
      </FormField>
      <FormField label="Flaws" span="min-[640px]:col-span-6">
        <input
          className="field-input"
          value={form.flaws}
          onChange={(e) => update("flaws", e.target.value)}
          placeholder="Any notable wear, tear or discolouration"
        />
      </FormField>
    </div>
  );
}

function FormField({
  label,
  span,
  help,
  error,
  children,
}: {
  label: string;
  span: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={span}>
      <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{label}</label>
      {children}
      {help && !error && <div className="mt-2 text-xs text-grey">{help}</div>}
      {error && <div className="mt-2 font-mono text-[11px] text-signal">{error}</div>}
    </div>
  );
}
