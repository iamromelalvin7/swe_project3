"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusChip } from "@/components/admin/StatusChip";
import { ConfirmDialog } from "@/components/Dialog";
import { ImageCropEditor } from "@/components/ImageCropEditor";
import { ImageDropzone, type PendingImage } from "@/components/ImageDropzone";
import { ProductFormFields, toFormValues, toProductRequest, type ProductFormValues } from "@/components/ProductFormFields";
import { ErrorState, FormError } from "@/components/States";
import { useToast } from "@/components/Toast";
import { apiFetch, authFetch, ApiRequestError } from "@/lib/api";
import { productStatusChip } from "@/lib/adminStatus";
import { useAdmin } from "@/lib/useAdmin";
import { useUnsavedChanges } from "@/lib/useUnsavedChanges";
import { PhotoUploadError, replaceProductPhoto, uploadProductPhotos } from "@/lib/uploads";
import type { AdminProductDetail, CatalogFilterOptions } from "@/lib/types";

const MAX_PHOTOS = 6;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const admin = useAdmin(`/admin/products/${params.id}/edit`);
  const toast = useToast();

  const [options, setOptions] = useState<CatalogFilterOptions | null>(null);
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState<ProductFormValues | null>(null);
  const [savedForm, setSavedForm] = useState<ProductFormValues | null>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"DRAFT" | "PUBLISHED" | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  const load = useCallback(() => {
    if (!admin) return;
    setLoadError(false);
    Promise.all([
      apiFetch<CatalogFilterOptions>("/api/catalog/filters"),
      authFetch<AdminProductDetail>(`/api/admin/products/${params.id}`),
    ])
      .then(([opts, p]) => {
        setOptions(opts);
        setProduct(p);
        const values = toFormValues(p);
        setForm(values);
        setSavedForm(values);
      })
      .catch(() => setLoadError(true));
  }, [admin, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Arriving from "New product" after its photo upload failed.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("photos") === "failed") {
      setFormError("The product was created, but its photos didn't upload. Add them again below.");
    }
  }, []);

  const dirty = !!form && !!savedForm && (JSON.stringify(form) !== JSON.stringify(savedForm) || images.length > 0);
  const leaveDialog = useUnsavedChanges(dirty && !saving && !archiving);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function save(status: "DRAFT" | "PUBLISHED") {
    if (!admin || !form || !product) return;
    setFormError(null);
    setErrors({});
    setSaving(status);
    try {
      await authFetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify(toProductRequest(form, status, "0")),
      });
      // The details are saved from here on, whatever happens to the photos.
      setSavedForm(form);

      if (images.length > 0) {
        try {
          await uploadProductPhotos(product.id, images.map((img) => img.blob), product.images.length + 1);
        } catch (err) {
          // Drop the photos that did go up (so a retry can't duplicate them)
          // and keep the rest queued so the admin can retry without re-cropping.
          const uploaded = err instanceof PhotoUploadError ? err.uploaded : 0;
          images.slice(0, uploaded).forEach((img) => URL.revokeObjectURL(img.previewUrl));
          setImages((prev) => prev.slice(uploaded));
          setFormError(
            uploaded > 0
              ? `Details saved and ${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded, but the rest didn't. Save again to retry.`
              : "Details saved, but the new photos didn't upload. Save again to retry."
          );
          load();
          return;
        }
        images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        setImages([]);
      }

      toast(status === "PUBLISHED" ? "Saved and published" : "Saved as draft", status === "PUBLISHED" ? { href: `/products/${product.id}`, label: "View on store" } : undefined);
      load();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.error.message);
        setErrors(err.error.fields ?? {});
      } else {
        setFormError("Couldn't save this product. Try again.");
      }
    } finally {
      setSaving(null);
    }
  }

  async function moveImage(index: number, direction: -1 | 1) {
    if (!admin || !product) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= product.images.length) return;
    const reordered = [...product.images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setReordering(true);
    setPhotoError(null);
    try {
      const updated = await authFetch<AdminProductDetail>(`/api/admin/products/${product.id}/images/order`, {
        method: "PUT",
        body: JSON.stringify({ imageIds: reordered.map((img) => img.id) }),
      });
      setProduct(updated);
    } catch (err) {
      setPhotoError(err instanceof ApiRequestError ? err.error.message : "Couldn't reorder the photos.");
    } finally {
      setReordering(false);
    }
  }

  async function replaceImage(imageId: string, blob: Blob) {
    if (!admin || !product) return;
    setEditingImageId(null);
    setReplacing(true);
    setPhotoError(null);
    try {
      const updatedImage = await replaceProductPhoto(product.id, imageId, blob);
      setProduct((prev) => (prev ? { ...prev, images: prev.images.map((img) => (img.id === imageId ? updatedImage : img)) } : prev));
      toast("Photo updated");
    } catch {
      setPhotoError("Couldn't update that photo. Try again.");
    } finally {
      setReplacing(false);
    }
  }

  async function archive() {
    if (!admin || !product) return;
    setArchiving(true);
    setFormError(null);
    try {
      await authFetch(`/api/admin/products/${product.id}/archive`, { method: "PATCH" });
      toast(`Archived "${product.title}"`);
      router.push("/admin/products");
    } catch (err) {
      setConfirmingArchive(false);
      setFormError(err instanceof ApiRequestError ? err.error.message : "Couldn't archive this product.");
    } finally {
      setArchiving(false);
    }
  }

  const back = (
    <Link href="/admin/products" className="link-quiet mb-5 inline-block">
      ← All products
    </Link>
  );

  if (loadError) {
    return (
      <AdminShell>
        {back}
        <ErrorState title="This product didn't load" onRetry={load} className="border-t border-rule py-20" />
      </AdminShell>
    );
  }

  if (!form || !product) {
    return (
      <AdminShell>
        {back}
        <div aria-busy="true" aria-label="Loading">
          <div className="skeleton h-2.5 w-24" />
          <div className="skeleton mt-3 h-10 w-72" />
          <div className="mt-10 grid grid-cols-[minmax(240px,35%)_1fr] gap-12 max-[1099px]:grid-cols-1">
            <div className="skeleton aspect-square" />
            <div className="space-y-7">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-10" />
              ))}
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  const existingCount = product.images.length;

  return (
    <AdminShell>
      {back}
      <AdminPageHeader
        eyebrow="Edit product"
        title={product.title}
        meta={
          <>
            <StatusChip chip={productStatusChip(product.status)} />
            {product.status === "PUBLISHED" && (
              <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" className="link-quiet ml-1">
                View on store <span aria-hidden="true">↗</span>
              </Link>
            )}
            {dirty && <span className="font-mono text-micro uppercase tracking-label text-warning">Unsaved changes</span>}
          </>
        }
      />

      <FormError message={formError} />

      <div className="grid grid-cols-[minmax(240px,35%)_1fr] items-start gap-12 max-[1099px]:grid-cols-1 max-[1099px]:gap-10">
        <section aria-labelledby="photos-heading">
          <h2 id="photos-heading" className="eyebrow mb-3">
            Photos · {existingCount + images.length} of {MAX_PHOTOS}
          </h2>

          {existingCount > 0 && (
            <div className="mb-4">
              <ul className="grid grid-cols-3 gap-3">
                {product.images.map((img, i) => (
                  <li key={img.id} className="relative aspect-[3/4] overflow-hidden border border-rule bg-plate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumbUrl} alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`} width={120} height={160} className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 font-mono text-micro uppercase tracking-label text-cream">Cover</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingImageId(img.id)}
                      aria-label={`Re-crop ${i === 0 ? "cover photo" : `photo ${i + 1}`}`}
                      className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center bg-cream/90 hover:bg-cream"
                    >
                      <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M12.5 2.5a1.6 1.6 0 0 1 2.3 2.3L6 13.6l-3 .9.9-3z" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={reordering || i === 0}
                        aria-label={`Move photo ${i + 1} earlier`}
                        className="flex h-9 w-9 items-center justify-center bg-cream/90 text-sm hover:bg-cream disabled:invisible"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={reordering || i === existingCount - 1}
                        aria-label={`Move photo ${i + 1} later`}
                        className="flex h-9 w-9 items-center justify-center bg-cream/90 text-sm hover:bg-cream disabled:invisible"
                      >
                        →
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {photoError && (
                <p role="alert" className="form-error mt-2">
                  {photoError}
                </p>
              )}
              <p className="mt-2 text-sm text-grey">The first photo is the cover. Use the arrows to reorder; the pencil re-crops.</p>
            </div>
          )}

          {editingImageId && (
            <ImageCropEditor
              source={{ kind: "url", url: product.images.find((img) => img.id === editingImageId)!.url }}
              onCancel={() => setEditingImageId(null)}
              onConfirm={(blob) => replaceImage(editingImageId, blob)}
            />
          )}
          {replacing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
              <div role="status" className="bg-cream px-6 py-4 font-mono text-label uppercase tracking-label text-grey">
                Updating photo…
              </div>
            </div>
          )}

          {existingCount < MAX_PHOTOS ? (
            <ImageDropzone
              images={images}
              setImages={setImages}
              maxImages={MAX_PHOTOS - existingCount}
              imageError={imageError}
              setImageError={setImageError}
              startPosition={existingCount}
            />
          ) : (
            <p className="border border-rule py-6 text-center text-sm text-grey">All {MAX_PHOTOS} photo slots are used.</p>
          )}
        </section>

        <section aria-label="Details">
          <ProductFormFields form={form} update={update} errors={errors} options={options} />

          <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-rule pt-7">
            <button
              type="button"
              disabled={archiving || product.status === "ARCHIVED"}
              onClick={() => setConfirmingArchive(true)}
              className="h-11 font-mono text-label uppercase tracking-label text-signal hover:opacity-70 disabled:text-grey disabled:opacity-60"
            >
              {product.status === "ARCHIVED" ? "Archived" : "Archive product"}
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={!!saving} onClick={() => save("DRAFT")} className="btn-outline">
                {saving === "DRAFT" ? "Saving…" : "Save as draft"}
              </button>
              <button type="button" disabled={!!saving} onClick={() => save("PUBLISHED")} className="btn-primary">
                {saving === "PUBLISHED" ? "Saving…" : product.status === "PUBLISHED" ? "Save" : "Save and publish"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {confirmingArchive && (
        <ConfirmDialog
          title="Archive this product?"
          body={`"${product.title}" will no longer be visible to customers. You can still find it under Archived.`}
          confirmLabel="Archive"
          danger
          busy={archiving}
          onConfirm={archive}
          onCancel={() => setConfirmingArchive(false)}
        />
      )}
      {leaveDialog}
    </AdminShell>
  );
}
