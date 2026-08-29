"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { apiFetch, authFetch, ApiRequestError } from "@/lib/api";
import { ImageDropzone, type PendingImage } from "@/components/ImageDropzone";
import { ProductFormFields, emptyProductForm } from "@/components/ProductFormFields";
import type { CatalogFilterOptions } from "@/lib/types";

export default function NewProductPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [options, setOptions] = useState<CatalogFilterOptions | null>(null);
  const [form, setForm] = useState(emptyProductForm);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
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

      if (images.length > 0) {
        const body = new FormData();
        images.forEach((img, i) => body.append("files", img.blob, `photo-${i + 1}.webp`));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${created.id}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
          body,
        });
      }

      if (andAnother) {
        setForm(emptyProductForm);
        images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        setImages([]);
        setJustPublished(true);
      } else {
        router.push("/admin/products");
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
            <ImageDropzone
              images={images}
              setImages={setImages}
              maxImages={6}
              imageError={imageError}
              setImageError={setImageError}
            />
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">1 is primary</div>
          </div>

          <div>
            <ProductFormFields form={form} update={update} errors={errors} options={options} />

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
