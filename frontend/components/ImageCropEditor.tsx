"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCT_PHOTO_ASPECT, cropAndConvertToWebp } from "@/lib/images";

const BOX_WIDTH = 280;
const BOX_HEIGHT = Math.round(BOX_WIDTH / PRODUCT_PHOTO_ASPECT);

type Offset = { x: number; y: number };

/**
 * A pan-and-zoom cropper for one photo, framed to the exact 3:4 the product
 * grid/gallery display at (aspect-[3/4]) — resize is the zoom slider,
 * "position them well to be viewed" is the drag. Confirming bakes the framed
 * region into a WebP blob (lib/images.ts) at a fixed output resolution, so
 * the server's automatic object-fit:cover never re-crops it unpredictably.
 */
export function ImageCropEditor({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const drag = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null);

  // Created inside the effect (not useMemo) so React 18 Strict Mode's dev-only
  // double-invoke — mount, simulated unmount, remount — creates a fresh URL on
  // the second mount instead of revoking the one and only memoized URL and
  // leaving the <img> permanently pointed at a dead blob: reference.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = natural ? Math.max(BOX_WIDTH / natural.w, BOX_HEIGHT / natural.h) : 1;
  const effectiveScale = baseScale * zoom;
  const dispW = natural ? natural.w * effectiveScale : BOX_WIDTH;
  const dispH = natural ? natural.h * effectiveScale : BOX_HEIGHT;

  function clamp(next: Offset, w: number, h: number): Offset {
    const minX = Math.min(0, BOX_WIDTH - w);
    const minY = Math.min(0, BOX_HEIGHT - h);
    return { x: Math.min(0, Math.max(minX, next.x)), y: Math.min(0, Math.max(minY, next.y)) };
  }

  function onImageLoad() {
    const el = imgRef.current;
    if (!el) return;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    setNatural({ w, h });
    const scale = Math.max(BOX_WIDTH / w, BOX_HEIGHT / h);
    setOffset({ x: (BOX_WIDTH - w * scale) / 2, y: (BOX_HEIGHT - h * scale) / 2 });
  }

  function onZoomChange(next: number) {
    setZoom(next);
    if (!natural) return;
    const scale = baseScale * next;
    setOffset((prev) => clamp(prev, natural.w * scale, natural.h * scale));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, startOffset: offset };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !natural) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setOffset(clamp({ x: drag.current.startOffset.x + dx, y: drag.current.startOffset.y + dy }, dispW, dispH));
  }

  function onPointerUp() {
    drag.current = null;
  }

  async function confirm() {
    const el = imgRef.current;
    if (!el || !natural) return;
    setProcessing(true);
    try {
      const blob = await cropAndConvertToWebp(el, {
        sourceX: -offset.x / effectiveScale,
        sourceY: -offset.y / effectiveScale,
        sourceWidth: BOX_WIDTH / effectiveScale,
        sourceHeight: BOX_HEIGHT / effectiveScale,
      });
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
      <div className="w-full max-w-[360px] border border-rule bg-cream p-6">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Position photo</div>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-[4px] border border-rule bg-white"
          style={{ width: BOX_WIDTH, height: BOX_HEIGHT, cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {objectUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={objectUrl}
              onLoad={onImageLoad}
              alt=""
              draggable={false}
              className="absolute max-w-none"
              style={{ left: offset.x, top: offset.y, width: dispW, height: dispH }}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-grey">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>
        <div className="mt-2 text-xs text-grey">Drag the photo to reposition it.</div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!natural || processing}
            className="h-11 bg-ink px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-white hover:bg-hover-dark disabled:opacity-50"
          >
            {processing ? "Processing…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
