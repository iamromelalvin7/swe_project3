"use client";

import { Field } from "@/components/Field";
import { formatCondition } from "@/lib/format";
import type { AdminProductDetail, CatalogFilterOptions, ProductCondition } from "@/lib/types";

const CONDITIONS: ProductCondition[] = ["NEW_WITH_TAGS", "EXCELLENT", "GOOD", "FAIR"];

export type ProductFormValues = {
  title: string;
  description: string;
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
  description: "",
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

/** Form values for an existing product (edit page). */
export function toFormValues(p: AdminProductDetail): ProductFormValues {
  return {
    title: p.title,
    description: p.description ?? "",
    categoryId: p.categoryId,
    brand: p.brand,
    sizeLabel: p.sizeLabel,
    condition: p.condition,
    pricePesewas: (p.pricePesewas / 100).toFixed(2),
    stockQuantity: String(p.stockQuantity),
    colour: p.colour ?? "",
    era: p.era ?? "",
    sizingNotes: p.sizingNotes ?? "",
    flaws: p.flaws ?? "",
  };
}

/**
 * The create/update request body. Blank optional fields are sent as null.
 * `emptyStock` is what a cleared quantity field means: 1 when creating
 * (a one-of-one piece), 0 when editing (as before).
 */
export function toProductRequest(form: ProductFormValues, status: "DRAFT" | "PUBLISHED", emptyStock: "0" | "1") {
  const orNull = (v: string) => (v.trim() ? v.trim() : null);
  return {
    title: form.title.trim(),
    description: orNull(form.description),
    categoryId: form.categoryId || null,
    brand: form.brand.trim(),
    sizeLabel: form.sizeLabel,
    condition: form.condition || null,
    colour: orNull(form.colour),
    era: orNull(form.era),
    sizingNotes: orNull(form.sizingNotes),
    flaws: orNull(form.flaws),
    pricePesewas: Math.round(parseFloat(form.pricePesewas || "0") * 100),
    stockQuantity: parseInt(form.stockQuantity || emptyStock, 10),
    status,
  };
}

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
      <Field label="Title" className="min-[640px]:col-span-6" error={errors.title}>
        <input
          className={`field-input ${errors.title ? "field-input-error" : ""}`}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. 1990s Carhartt Detroit Jacket"
        />
      </Field>
      <Field
        label="Description"
        className="min-[640px]:col-span-6"
        error={errors.description}
        help="Shown on the product page. A sentence or two on the piece, its story and how it wears."
      >
        <textarea
          className={`field-input resize-y ${errors.description ? "field-input-error" : ""}`}
          rows={3}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Washed-in duck canvas, blanket lining, brass zip. Boxy through the body."
        />
      </Field>
      <Field label="Category" className="min-[640px]:col-span-2" error={errors.categoryId}>
        <select
          className={`field-input ${errors.categoryId ? "field-input-error" : ""}`}
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
      </Field>
      <Field label="Brand" className="min-[640px]:col-span-2" error={errors.brand}>
        <input
          className={`field-input ${errors.brand ? "field-input-error" : ""}`}
          value={form.brand}
          onChange={(e) => update("brand", e.target.value)}
          placeholder="Carhartt"
        />
      </Field>
      <Field label="Size" className="min-[640px]:col-span-2" error={errors.sizeLabel}>
        <select
          className={`field-input ${errors.sizeLabel ? "field-input-error" : ""}`}
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
      </Field>
      <Field label="Condition" className="min-[640px]:col-span-2" error={errors.condition}>
        <select
          className={`field-input ${errors.condition ? "field-input-error" : ""}`}
          value={form.condition}
          onChange={(e) => update("condition", e.target.value as ProductCondition)}
        >
          <option value="">Select</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {formatCondition(c)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Price (GH₵)" className="min-[640px]:col-span-2" error={errors.pricePesewas}>
        <input
          className={`field-input font-mono ${errors.pricePesewas ? "field-input-error" : ""}`}
          value={form.pricePesewas}
          onChange={(e) => update("pricePesewas", e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
        />
      </Field>
      <Field label="Quantity" className="min-[640px]:col-span-2" error={errors.stockQuantity} help="Leave at 1 for one-of-a-kind pieces">
        <input
          className={`field-input font-mono ${errors.stockQuantity ? "field-input-error" : ""}`}
          value={form.stockQuantity}
          onChange={(e) => update("stockQuantity", e.target.value)}
          placeholder="1"
          inputMode="numeric"
        />
      </Field>
      <Field label="Colour" className="min-[640px]:col-span-3">
        <input className="field-input" value={form.colour} onChange={(e) => update("colour", e.target.value)} placeholder="Hamilton Brown" />
      </Field>
      <Field label="Era" className="min-[640px]:col-span-3">
        <input className="field-input" value={form.era} onChange={(e) => update("era", e.target.value)} placeholder="1990s" />
      </Field>
      <Field label="Fit notes" className="min-[640px]:col-span-6">
        <input
          className="field-input"
          value={form.sizingNotes}
          onChange={(e) => update("sizingNotes", e.target.value)}
          placeholder="How does this piece measure and drape?"
        />
      </Field>
      <Field label="Flaws" className="min-[640px]:col-span-6">
        <input
          className="field-input"
          value={form.flaws}
          onChange={(e) => update("flaws", e.target.value)}
          placeholder="Any notable wear, tear or discolouration"
        />
      </Field>
    </div>
  );
}
