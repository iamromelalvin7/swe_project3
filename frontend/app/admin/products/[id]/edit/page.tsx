"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { apiFetch, authFetch, ApiRequestError } from "@/lib/api";
import { ImageCropEditor } from "@/components/ImageCropEditor";
import { ImageDropzone, type PendingImage } from "@/components/ImageDropzone";
import { ProductFormFields, type ProductFormValues } from "@/components/ProductFormFields";
import type { AdminProductDetail, CatalogFilterOptions, ProductImage } from "@/lib/types";

export default function EditProductPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [options, setOptions] = useState<CatalogFilterOptions | null>(null);
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState<ProductFormValues | null>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  const load = () => {
    if (user?.role !== "ADMIN") return;
    setLoadError(false);
    Promise.all([
      apiFetch<CatalogFilterOptions>("/api/catalog/filters"),
      authFetch<AdminProductDetail>(`/api/admin/products/${params.id}`, user.token),
    ])
      .then(([opts, p]) => {
        setOptions(opts);
        setProduct(p);
        setForm({
          title: p.title,
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
        });
      })
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    if (ready && (!user || user.role !== "ADMIN")) {
      router.push(`/login?redirect=/admin/products/${params.id}/edit`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, params.id]);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function save(status: "DRAFT" | "PUBLISHED") {
    if (!user || !form || !product) return;
    setFormError(null);
    setErrors({});
    setSaved(false);
    setSaving(true);
    try {
      const priceValue = Math.round(parseFloat(form.pricePesewas || "0") * 100);
      await authFetch(`/api/admin/products/${product.id}`, user.token, {
        method: "PUT",
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
          stockQuantity: parseInt(form.stockQuantity || "0", 10),
          status,
        }),
      });

      if (images.length > 0) {
        const body = new FormData();
        images.forEach((img, i) => body.append("files", img.blob, `photo-${i + 1}.webp`));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${product.id}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
          body,
        });
      }

      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setSaved(true);
      load();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.error.message);
        setErrors(err.error.fields ?? {});
      } else {
        setFormError("Could not save this product.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function moveImage(index: number, direction: -1 | 1) {
    if (!user || !product) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= product.images.length) return;

    const reordered = [...product.images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setReordering(true);
    setReorderError(null);
    try {
      const updated = await authFetch<AdminProductDetail>(`/api/admin/products/${product.id}/images/order`, user.token, {
        method: "PUT",
        body: JSON.stringify({ imageIds: reordered.map((img) => img.id) }),
      });
      setProduct(updated);
    } catch (err) {
      setReorderError(err instanceof ApiRequestError ? err.error.message : "Could not reorder photos.");
    } finally {
      setReordering(false);
    }
  }

  async function replaceImage(imageId: string, blob: Blob) {
    if (!user || !product) return;
    setEditingImageId(null);
    setReplacing(true);
    setReplaceError(null);
    try {
      const body = new FormData();
      body.append("file", blob, "photo.webp");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${product.id}/images/${imageId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user.token}` },
        body,
      });
      if (!res.ok) {
        throw new Error("Could not update this photo.");
      }
      const updatedImage: ProductImage = await res.json();
      setProduct((prev) =>
        prev ? { ...prev, images: prev.images.map((img) => (img.id === imageId ? updatedImage : img)) } : prev
      );
    } catch {
      setReplaceError("Could not update this photo.");
    } finally {
      setReplacing(false);
    }
  }

  async function archive() {
    if (!user || !product) return;
    if (!window.confirm(`Archive "${product.title}"? It will no longer be visible to customers.`)) return;
    setArchiving(true);
    setFormError(null);
    try {
      await authFetch(`/api/admin/products/${product.id}/archive`, user.token, { method: "PATCH" });
      router.push("/admin/products");
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.error.message : "Could not archive this product.");
    } finally {
      setArchiving(false);
    }
  }

  if (loadError) {
    return (
      <AdminShell>
        <div className="py-24 text-center">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-signal">Request failed</div>
          <div className="mb-2.5 font-serif text-[28px]">This product did not load</div>
          <div className="mb-6 text-sm text-grey">The shop is reachable but the product request failed.</div>
          <button
            onClick={load}
            className="h-12 bg-ink px-6 font-mono text-xs uppercase tracking-[0.12em] text-white hover:bg-hover-dark"
          >
            Try again
          </button>
        </div>
      </AdminShell>
    );
  }

  if (!form || !product) {
    return (
      <AdminShell>
        <div className="h-8 w-64 animate-pulse bg-skeleton" />
      </AdminShell>
    );
  }

  const existingCount = product.images.length;

  return (
    <AdminShell>
      <div>
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[56px] max-[640px]:text-[38px]">Edit product</h1>
          <div
            className={`font-mono text-[11px] uppercase tracking-[0.1em] ${
              product.status === "ARCHIVED" ? "text-signal" : "text-grey"
            }`}
          >
            {product.status}
          </div>
        </div>

        {formError && <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{formError}</div>}
        {saved && <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-grey">Saved.</div>}

        <div className="grid grid-cols-[35%_1fr] items-start gap-14 max-[900px]:grid-cols-1">
          <div>
            {existingCount > 0 && (
              <div className="mb-4">
                <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
                  Current photos ({existingCount})
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {product.images.map((img, i) => (
                    <div key={img.id} className="relative aspect-[3/4] overflow-hidden rounded-[4px] border border-rule bg-white">
                      <img src={img.thumbUrl} alt="" className="h-full w-full object-cover" />
                      <div
                        className={`absolute left-0 top-0 px-1.5 py-0.5 font-mono text-[10px] ${
                          img.position === 0 ? "bg-ink text-white" : "bg-transparent text-grey"
                        }`}
                      >
                        {img.position + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingImageId(img.id)}
                        aria-label="Edit photo"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-cream/90 hover:opacity-70"
                      >
                        <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M12.5 2.5a1.6 1.6 0 0 1 2.3 2.3L6 13.6l-3 .9.9-3z" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div className="absolute bottom-1 right-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          disabled={reordering || i === 0}
                          aria-label="Move earlier"
                          className="flex h-5 w-5 items-center justify-center bg-cream/90 text-[11px] hover:opacity-70 disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          disabled={reordering || i === product.images.length - 1}
                          aria-label="Move later"
                          className="flex h-5 w-5 items-center justify-center bg-cream/90 text-[11px] hover:opacity-70 disabled:opacity-30"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {reorderError && (
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{reorderError}</div>
                )}
                {replaceError && (
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{replaceError}</div>
                )}
                <div className="mt-2 text-xs text-grey">
                  Use the arrows to reorder — position 1 is primary. Edit re-crops a photo in place.
                </div>
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60">
                <div className="bg-cream px-6 py-4 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
                  Updating photo…
                </div>
              </div>
            )}

            {existingCount < 6 ? (
              <ImageDropzone
                images={images}
                setImages={setImages}
                maxImages={6 - existingCount}
                imageError={imageError}
                setImageError={setImageError}
                startPosition={existingCount}
              />
            ) : (
              <div className="border border-rule py-8 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
                Max 6 photos reached
              </div>
            )}
          </div>

          <div>
            <ProductFormFields form={form} update={update} errors={errors} options={options} />

            <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-rule pt-7">
              <button
                type="button"
                disabled={archiving || product.status === "ARCHIVED"}
                onClick={archive}
                className="font-mono text-[11px] uppercase tracking-[0.1em] text-signal hover:opacity-70 disabled:opacity-40"
              >
                {product.status === "ARCHIVED" ? "Archived" : "Archive"}
              </button>

              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save("DRAFT")}
                  className="h-12 font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink disabled:opacity-50"
                >
                  Save as draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save("PUBLISHED")}
                  className="h-12 bg-ink px-[30px] font-mono text-[11px] uppercase tracking-[0.1em] text-white hover:bg-hover-dark disabled:opacity-50"
                >
                  Save and publish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
