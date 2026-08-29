/** Every product photo displays at this aspect ratio (see aspect-[3/4] across the app). */
export const PRODUCT_PHOTO_ASPECT = 3 / 4;

const OUTPUT_HEIGHT = 1600; // matches the server's own display-derivative cap
const OUTPUT_WIDTH = Math.round(OUTPUT_HEIGHT * PRODUCT_PHOTO_ASPECT);
const WEBP_QUALITY = 0.95;

export type CropRect = {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
};

/**
 * Bakes an admin-chosen crop (FR-G5's pan/zoom step) into a single WebP blob,
 * client-side, before it ever reaches the network. `crop` is a rectangle in
 * the source image's own natural pixel coordinates — the region the admin
 * framed inside the 3:4 preview — and always comes out at a fixed 3:4
 * resolution regardless of the source photo's original aspect ratio, so the
 * server's own object-fit:cover display never re-crops it unexpectedly.
 */
export async function cropAndConvertToWebp(image: HTMLImageElement, crop: CropRect): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.sourceX,
    crop.sourceY,
    crop.sourceWidth,
    crop.sourceHeight,
    0,
    0,
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/webp",
      WEBP_QUALITY
    );
  });
}
