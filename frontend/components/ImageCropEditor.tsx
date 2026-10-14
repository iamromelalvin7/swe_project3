"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { PRODUCT_PHOTO_ASPECT, cropAndConvertToWebp } from "@/lib/images";

const BOX_WIDTH = 280;
const BOX_HEIGHT = Math.round(BOX_WIDTH / PRODUCT_PHOTO_ASPECT);
const NUDGE = 4;

type Offset = { x: number; y: number };

/** A brand-new file the admin just picked, or an already-uploaded photo being re-cropped in place. */
export type ImageSource = { kind: "file"; file: File } | { kind: "url"; url: string };

/**
 * A pan-and-zoom cropper for one photo, framed to the exact 3:4 the product
 * grid/gallery display at (aspect-[3/4]). Drag (or arrow keys, Shift for
 * bigger steps) positions it; the slider zooms. Confirming bakes the framed
 * region into a WebP blob (lib/images.ts) at a fixed output resolution, so
 * the storefront's object-fit:cover never re-crops it unpredictably.
 */
export function ImageCropEditor({
  source,
  onCancel,
  onConfirm,
}: {
  source: ImageSource;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null);

  // A file's object URL is created inside the effect (not useMemo) so React
  // 18 Strict Mode's dev-only double-invoke creates a fresh URL on the
  // second mount instead of leaving the <img> pointed at a revoked blob.
  useEffect(() => {
    if (source.kind === "url") {
      setObjectUrl(source.url);
      return;
    }
    const url = URL.createObjectURL(source.file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

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

  function onFrameKeyDown(e: React.KeyboardEvent) {
    if (!natural) return;
    const step = e.shiftKey ? NUDGE * 3 : NUDGE;
    const moves: Record<string, Offset> = {
      ArrowLeft: { x: step, y: 0 },
      ArrowRight: { x: -step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setOffset((prev) => clamp({ x: prev.x + move.x, y: prev.y + move.y }, dispW, dispH));
  }

  async function confirm() {
    const el = imgRef.current;
    if (!el || !natural) return;
    setProcessing(true);
    setError(null);
    try {
      const blob = await cropAndConvertToWebp(el, {
        sourceX: -offset.x / effectiveScale,
        sourceY: -offset.y / effectiveScale,
        sourceWidth: BOX_WIDTH / effectiveScale,
        sourceHeight: BOX_HEIGHT / effectiveScale,
      });
      onConfirm(blob);
    } catch {
      setError("Couldn't process this photo. Try a different file.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog labelledBy="crop-dialog-title" onClose={onCancel} className="max-w-[360px]">
      <h2 id="crop-dialog-title" className="eyebrow mb-4">
        Position photo
      </h2>

      <div
        role="group"
        tabIndex={0}
        aria-label="Photo framing. Drag, or use the arrow keys, to reposition."
        className="relative mx-auto cursor-grab touch-none select-none overflow-hidden border border-rule bg-plate active:cursor-grabbing"
        style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onFrameKeyDown}
      >
        {objectUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={objectUrl}
            crossOrigin={source.kind === "url" ? "anonymous" : undefined}
            onLoad={onImageLoad}
            alt=""
            draggable={false}
            className="absolute max-w-none"
            style={{ left: offset.x, top: offset.y, width: dispW, height: dispH }}
          />
        )}
      </div>

      <label className="mt-4 flex items-center gap-3">
        <span className="font-mono text-micro uppercase tracking-label text-grey">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="flex-1 accent-ink"
        />
      </label>
      <p className="mt-2 text-sm text-grey">Drag the photo, or use the arrow keys, to reposition it.</p>
      {error && (
        <p role="alert" className="form-error mt-3">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-outline h-11">
          Cancel
        </button>
        <button type="button" onClick={confirm} disabled={!natural || processing} className="btn-primary h-11">
          {processing ? "Processing…" : "Use photo"}
        </button>
      </div>
    </Dialog>
  );
}
