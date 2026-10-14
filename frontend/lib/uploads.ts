import { authFetch } from "./api";
import type { ProductImage } from "./types";

/** Thrown when some (or none) of a batch of photos uploaded before one failed. */
export class PhotoUploadError extends Error {
  constructor(public uploaded: number) {
    super("Photo upload failed");
  }
}

/**
 * Uploads new photos one request per photo, in order (the API appends each
 * after the existing ones, so order is preserved). One per request keeps
 * every request well under the hosting proxy's body-size limit; if one
 * fails, the error says how many already went up so a retry can skip them
 * instead of creating duplicates.
 */
export async function uploadProductPhotos(productId: string, blobs: Blob[], startNumber = 1): Promise<void> {
  for (let i = 0; i < blobs.length; i++) {
    const body = new FormData();
    body.append("files", blobs[i], `photo-${startNumber + i}.webp`);
    try {
      await authFetch(`/api/admin/products/${productId}/images`, { method: "POST", body });
    } catch {
      throw new PhotoUploadError(i);
    }
  }
}

/** Replaces one existing photo in place (after a re-crop). */
export async function replaceProductPhoto(productId: string, imageId: string, blob: Blob): Promise<ProductImage> {
  const body = new FormData();
  body.append("file", blob, "photo.webp");
  return authFetch<ProductImage>(`/api/admin/products/${productId}/images/${imageId}`, { method: "PUT", body });
}
