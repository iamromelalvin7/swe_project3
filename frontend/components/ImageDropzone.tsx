"use client";

import { useState } from "react";
import { ImageCropEditor } from "@/components/ImageCropEditor";

export type PendingImage = { blob: Blob; previewUrl: string };

/**
 * The photo picker shared by the new-product and edit-product forms. Every
 * selected file is queued through {@link ImageCropEditor} — the admin
 * frames (pans/zooms) each one to the product grid's 3:4 display before it's
 * added to `images` as WebP. `maxImages` lets the edit page cap this at 6
 * minus however many photos the product already has, since there's no way
 * to remove an already-uploaded photo (no delete-image endpoint exists).
 */
export function ImageDropzone({
  images,
  setImages,
  maxImages,
  imageError,
  setImageError,
  startPosition = 0,
}: {
  images: PendingImage[];
  setImages: React.Dispatch<React.SetStateAction<PendingImage[]>>;
  maxImages: number;
  imageError: string | null;
  setImageError: (message: string | null) => void;
  /** Position these new photos start at — nonzero on the edit page, where they're appended after existing photos. */
  startPosition?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const full = images.length >= maxImages;

  function onFiles(list: FileList | null) {
    if (!list) return;
    setImageError(null);
    const remaining = Math.max(0, maxImages - images.length);
    setQueue((prev) => [...prev, ...Array.from(list).slice(0, remaining - prev.length)]);
  }

  function onCropConfirm(blob: Blob) {
    setImages((prev) => (prev.length >= maxImages ? prev : [...prev, { blob, previewUrl: URL.createObjectURL(blob) }]));
    setQueue((prev) => prev.slice(1));
  }

  function onCropCancel() {
    setQueue((prev) => prev.slice(1));
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div>
      {queue[0] && (
        <ImageCropEditor source={{ kind: "file", file: queue[0] }} onCancel={onCropCancel} onConfirm={onCropConfirm} />
      )}

      <label
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
        className={`flex aspect-square flex-col items-center justify-center gap-3 border border-dashed text-center transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-ink ${
          full ? "cursor-not-allowed border-rule text-grey" : "cursor-pointer hover:border-ink"
        } ${dragging ? "border-ink bg-hover-light" : "border-field"}`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <path d="M14.5 8.5 8.4 14.6a3 3 0 0 1-4.24-4.24l7.07-7.07a2 2 0 0 1 2.83 2.83L7.4 12.76a1 1 0 0 1-1.41-1.41L12.02 5.3" />
        </svg>
        <span className="text-body">{full ? "Photo limit reached" : "Drop photos or choose files"}</span>
        <span className="font-mono text-micro uppercase tracking-label text-grey">Up to {maxImages}</span>
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} disabled={full} />
      </label>

      {imageError && (
        <p role="alert" className="form-error mt-4">
          {imageError}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <li key={img.previewUrl} className="relative aspect-[3/4] overflow-hidden border border-rule bg-plate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={startPosition + i === 0 ? "New cover photo" : `New photo ${startPosition + i + 1}`}
                className="h-full w-full object-cover"
              />
              {startPosition + i === 0 && (
                <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 font-mono text-micro uppercase tracking-label text-cream">Cover</span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center bg-cream/90 text-sm hover:bg-cream"
                aria-label={`Remove new photo ${startPosition + i + 1}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
