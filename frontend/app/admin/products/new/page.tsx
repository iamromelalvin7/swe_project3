"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImageDropzone, type PendingImage } from "@/components/ImageDropzone";
import { ProductFormFields, emptyProductForm, toProductRequest, type ProductFormValues } from "@/components/ProductFormFields";
import { FormError } from "@/components/States";
import { useToast } from "@/components/Toast";
import { apiFetch, authFetch, ApiRequestError } from "@/lib/api";
import { useAdmin } from "@/lib/useAdmin";
import { uploadProductPhotos } from "@/lib/uploads";
import { useUnsavedChanges } from "@/lib/useUnsavedChanges";
import type { CatalogFilterOptions } from "@/lib/types";

type Submitting = "draft" | "publish" | "publishAnother" | null;

export default function NewProductPage() {
  const admin = useAdmin("/admin/products/new");
  const router = useRouter();
  const toast = useToast();
  const [options, setOptions] = useState<CatalogFilterOptions | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Submitting>(null);

  useEffect(() => {
    if (!admin) return;
    apiFetch<CatalogFilterOptions>("/api/catalog/filters")
      .then(setOptions)
      .catch(() => setFormError("Couldn't load categories and sizes. Reload the page to try again."));
  }, [admin]);

  const dirty = JSON.stringify(form) !== JSON.stringify(emptyProductForm) || images.length > 0;
  const leaveDialog = useUnsavedChanges(dirty && submitting === null);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(status: "DRAFT" | "PUBLISHED", andAnother: boolean) {
    if (!admin) return;
    setFormError(null);
    setErrors({});
    setSubmitting(status === "DRAFT" ? "draft" : andAnother ? "publishAnother" : "publish");
    try {
      const created = await authFetch<{ id: string }>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(toProductRequest(form, status, "1")),
      });

      if (images.length > 0) {
        try {
          await uploadProductPhotos(created.id, images.map((img) => img.blob));
        } catch {
          // The product exists; send the admin to its edit page to add the
          // missing photos rather than creating a duplicate product here.
          router.push(`/admin/products/${created.id}/edit?photos=failed`);
          return;
        }
      }

      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      const label = status === "DRAFT" ? "Saved as draft" : "Published";
      if (andAnother) {
        setForm(emptyProductForm);
        setImages([]);
        toast(`${label} · add the next piece`, { href: `/admin/products/${created.id}/edit`, label: "Edit it" });
        // The admin shell scrolls its <main>, not the window.
        document.querySelector(".admin-shell main")?.scrollTo({ top: 0 });
      } else {
        toast(label, status === "PUBLISHED" ? { href: `/products/${created.id}`, label: "View on store" } : undefined);
        router.push("/admin/products");
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.error.message);
        setErrors(err.error.fields ?? {});
      } else {
        setFormError("Couldn't save this product. Try again.");
      }
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <AdminShell>
      <Link href="/admin/products" className="link-quiet mb-5 inline-block">
        ← All products
      </Link>
      <AdminPageHeader
        eyebrow="Products"
        title="New product"
        meta={dirty ? <span className="font-mono text-micro uppercase tracking-label text-warning">Unsaved changes</span> : undefined}
      />

      <FormError message={formError} />

      <div className="grid grid-cols-[minmax(240px,35%)_1fr] items-start gap-12 max-[1099px]:grid-cols-1 max-[1099px]:gap-10">
        <section aria-labelledby="photos-heading">
          <h2 id="photos-heading" className="eyebrow mb-3">
            Photos · {images.length} of 6
          </h2>
          <ImageDropzone images={images} setImages={setImages} maxImages={6} imageError={imageError} setImageError={setImageError} />
          <p className="mt-3 text-sm text-grey">The first photo is the cover. Each one is framed to 3:4 before it&apos;s added.</p>
        </section>

        <section aria-label="Details">
          <ProductFormFields form={form} update={update} errors={errors} options={options} />

          <div className="mt-12 flex flex-wrap items-center justify-end gap-3 border-t border-rule pt-7">
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => submit("DRAFT", false)}
              className="h-12 px-3 font-mono text-label uppercase tracking-label text-grey hover:text-ink disabled:opacity-50"
            >
              {submitting === "draft" ? "Saving…" : "Save draft"}
            </button>
            <button type="button" disabled={submitting !== null} onClick={() => submit("PUBLISHED", true)} className="btn-outline">
              {submitting === "publishAnother" ? "Publishing…" : "Publish and add another"}
            </button>
            <button type="button" disabled={submitting !== null} onClick={() => submit("PUBLISHED", false)} className="btn-primary">
              {submitting === "publish" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </section>
      </div>
      {leaveDialog}
    </AdminShell>
  );
}
