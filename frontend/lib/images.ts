const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 0.85;

/**
 * Downscales an image to at most MAX_DIMENSION on its longest side and
 * re-encodes it as WebP client-side (FR-G5), before it ever reaches the
 * network. The server still derives its own 1600px/400px pair from
 * whatever this produces — this step exists to cut upload size and
 * bandwidth, not to replace the server's own derivative pipeline.
 */
export async function downscaleAndConvertToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
        "image/webp",
        WEBP_QUALITY
      );
    });
  } finally {
    bitmap.close();
  }
}
