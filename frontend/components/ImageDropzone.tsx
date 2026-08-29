"use client";

import { useState } from "react";
import { ImageCropEditor } from "@/components/ImageCropEditor";

export type PendingImage = { blob: Blob; previewUrl: string };

/**
 * The photo picker shared by the new-product and edit-product forms. Every
 * selected file is queued through {@link ImageCropEditor} — the admin
 * frames (pans/zooms) each one to the product grid's 3:4 display before it's
 * added to `images` as WebP (FR-G5's client-side conversion, now with a
 * chosen crop instead of a blind contain-fit). `maxImages` lets the edit
 * page cap this at 6 minus however many photos the product already has,
 * since there's no way to remove an already-uploaded photo (no delete-image
 * endpoint exists).
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
      {queue[0] && <ImageCropEditor file={queue[0]} onCancel={onCropCancel} onConfirm={onCropConfirm} />}

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
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            disabled={images.length >= maxImages}
          />
        </label>
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Max {maxImages}</div>
      </div>

      {imageError && <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{imageError}</div>}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-[4px] border border-rule bg-white">
              <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
              <div
                className={`absolute left-0 top-0 px-1.5 py-0.5 font-mono text-[10px] ${
                  startPosition + i === 0 ? "bg-ink text-white" : "bg-transparent text-grey"
                }`}
              >
                {startPosition + i + 1}
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-cream/90 text-[11px] hover:opacity-70"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
