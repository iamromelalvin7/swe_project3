"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { apiFetch, authFetch, ApiRequestError } from "@/lib/api";
import type { CatalogFilterOptions, ProductCondition } from "@/lib/types";

const CONDITIONS: ProductCondition[] = ["NEW_WITH_TAGS", "EXCELLENT", "GOOD", "FAIR"];

const emptyForm = {
  title: "",
  categoryId: "",
  brand: "",
  sizeLabel: "",
  condition: "" as ProductCondition | "",
  pricePesewas: "",
  stockQuantity: "1",
  colour: "",
  era: "",
  sizingNotes: "",
  flaws: "",
};

export default function NewProductPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [options, setOptions] = useState<CatalogFilterOptions | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"draft" | "publish" | "publishAnother" | null>(null);
  const [justPublished, setJustPublished] = useState(false);

  useEffect(() => {
    if (ready && (!user || user.role !== "ADMIN")) {
      router.push("/login?redirect=/admin/products/new");
      return;
    }
    apiFetch<CatalogFilterOptions>("/api/catalog/filters").then(setOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 6));
  }

  const selectedSizeGroup = options?.categories.find((c) => c.id === form.categoryId)?.sizeGroup ?? null;
  const sizeOptions = selectedSizeGroup ? options?.sizeOptionsByGroup[selectedSizeGroup] ?? [] : [];

  async function submit(status: "DRAFT" | "PUBLISHED", andAnother: boolean) {
    if (!user) return;
    setFormError(null);
    setErrors({});
    setJustPublished(false);
    setSubmitting(status === "DRAFT" ? "draft" : andAnother ? "publishAnother" : "publish");
    try {
      const priceValue = Math.round(parseFloat(form.pricePesewas || "0") * 100);
      const created = await authFetch<{ id: string }>("/api/admin/products", user.token, {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: null,
          categoryId: form.categoryId || null,
          brand: form.brand,
          sizeLabel: form.sizeLabel,
          condition: form.condition || null,
          colour: form.colour || null,
          era: form.era || null,
          sizingNotes: form.sizingNotes || null,
          flaws: form.flaws || null,
          pricePesewas: priceValue,
          stockQuantity: parseInt(form.stockQuantity || "1", 10),
          status,
        }),
      });

      if (files.length > 0) {
        const body = new FormData();
        files.forEach((f) => body.append("files", f));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${created.id}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
          body,
        });
      }

      if (andAnother) {
        setForm(emptyForm);
        setFiles([]);
        setJustPublished(true);
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.error.message);
        setErrors(err.error.fields ?? {});
      } else {
        setFormError("Could not save this product.");
      }
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <AdminShell>
      <div>
        <h1 className="mb-10 font-serif text-[56px] max-[640px]:text-[38px]">New product</h1>

        {formError && <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{formError}</div>}
        {justPublished && (
          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-grey">
            Published. Add the next piece below.
          </div>
        )}

        <div className="grid grid-cols-[35%_1fr] items-start gap-14 max-[900px]:grid-cols-1">
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onFiles(e.dataTransfer.files);
              }}
              className={`flex aspect-square flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed transition-colors ${
                dragging ? "border-ink bg-hover-light" : "border-rule"
              }`}
            >
              <label className="flex cursor-pointer flex-col items-center gap-3 hover:text-grey">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M14.5 8.5 8.4 14.6a3 3 0 0 1-4.24-4.24l7.07-7.07a2 2 0 0 1 2.83 2.83L7.4 12.76a1 1 0 0 1-1.41-1.41L12.02 5.3" />
                </svg>
                <span className="text-[15px]">Drop photos</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Max 6</div>
            </div>
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-[4px] border border-rule bg-white">
                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                    <div
                      className={`absolute left-0 top-0 px-1.5 py-0.5 font-mono text-[10px] ${
                        i === 0 ? "bg-ink text-white" : "bg-transparent text-grey"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, k) => k !== i))}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-cream/90 text-[11px] hover:opacity-70"
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">1 is primary</div>
          </div>

          <div>
            <div className="grid grid-cols-6 gap-x-8 gap-y-7">
              <FormField label="Title" span="col-span-6" error={errors.title}>
                <input
                  className="field-input"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. 1990s Carhartt Detroit Jacket"
                />
              </FormField>
              <FormField label="Category" span="col-span-2" error={errors.categoryId}>
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
              <FormField label="Brand" span="col-span-2" error={errors.brand}>
                <input className="field-input" value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Carhartt" />
              </FormField>
              <FormField label="Size" span="col-span-2" error={errors.sizeLabel}>
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
              <FormField label="Condition" span="col-span-2" error={errors.condition}>
                <select className="field-input" value={form.condition} onChange={(e) => update("condition", e.target.value as ProductCondition)}>
                  <option value="">Select</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Price GHS" span="col-span-2" error={errors.pricePesewas}>
                <input
                  className="field-input font-mono"
                  value={form.pricePesewas}
                  onChange={(e) => update("pricePesewas", e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </FormField>
              <FormField label="Quantity" span="col-span-2" error={errors.stockQuantity} help="Leave at 1 for one-of-a-kind pieces">
                <input
                  className="field-input font-mono"
                  value={form.stockQuantity}
                  onChange={(e) => update("stockQuantity", e.target.value)}
                  placeholder="1"
                  inputMode="numeric"
                />
              </FormField>
              <FormField label="Colour" span="col-span-3">
                <input className="field-input" value={form.colour} onChange={(e) => update("colour", e.target.value)} placeholder="Hamilton Brown" />
              </FormField>
              <FormField label="Era" span="col-span-3">
                <input className="field-input" value={form.era} onChange={(e) => update("era", e.target.value)} placeholder="1990s" />
              </FormField>
              <FormField label="Fit notes" span="col-span-6">
                <input
                  className="field-input"
                  value={form.sizingNotes}
                  onChange={(e) => update("sizingNotes", e.target.value)}
                  placeholder="How does this piece measure and drape?"
                />
              </FormField>
              <FormField label="Flaws" span="col-span-6">
                <input
                  className="field-input"
                  value={form.flaws}
                  onChange={(e) => update("flaws", e.target.value)}
                  placeholder="Any notable wear, tear or discolouration"
                />
              </FormField>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-rule pt-7">
              <button
                type="button"
                disabled={submitting !== null}
                onClick={() => submit("DRAFT", false)}
                className="h-12 font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={submitting !== null}
                onClick={() => submit("PUBLISHED", true)}
                className="h-12 border border-ink px-[26px] font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-ink hover:text-white disabled:opacity-50"
              >
                Publish and add another
              </button>
              <button
                type="button"
                disabled={submitting !== null}
                onClick={() => submit("PUBLISHED", false)}
                className="h-12 bg-ink px-[30px] font-mono text-[11px] uppercase tracking-[0.1em] text-white hover:bg-hover-dark disabled:opacity-50"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
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
