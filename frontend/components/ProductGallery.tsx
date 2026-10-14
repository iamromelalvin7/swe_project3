"use client";

import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/types";
import { ImagePlaceholder } from "./ProductImage";

/**
 * Desktop: thumbnail column beside the main photo.
 * Mobile: the main photo is a swipeable scroll-snap strip with a "1 / 4"
 * counter; thumbnails (only when there is more than one photo) sit below.
 */
export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const multiple = images.length > 1;

  function select(i: number) {
    setActive(i);
    const strip = stripRef.current;
    if (strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: strip.clientWidth * i, behavior: "smooth" });
    }
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full">
        <ImagePlaceholder label="No photograph yet" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 max-[900px]:flex-col">
      {multiple && (
        <div className="order-1 flex flex-col gap-3 max-[900px]:order-2 max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => select(i)}
              aria-label={`Photo ${i + 1} of ${images.length}`}
              aria-current={active === i}
              className={`aspect-[3/4] w-[76px] flex-shrink-0 overflow-hidden bg-plate outline outline-1 -outline-offset-1 transition-[outline-color] max-[900px]:w-16 ${
                active === i ? "outline-ink" : "outline-transparent hover:outline-rule"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative order-2 min-w-0 flex-1 max-[900px]:order-1">
        {/* Desktop: one large image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].url}
          alt={multiple ? `${title} — photo ${active + 1} of ${images.length}` : title}
          className="aspect-[3/4] w-full bg-plate object-cover max-[900px]:hidden"
        />

        {/* Mobile: swipeable strip. */}
        <div
          ref={stripRef}
          className="hidden snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] max-[900px]:flex"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
        >
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.url}
              alt={multiple ? `${title} — photo ${i + 1} of ${images.length}` : title}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-[3/4] w-full flex-shrink-0 snap-center bg-plate object-cover"
            />
          ))}
        </div>
        {multiple && (
          <span className="absolute bottom-3 right-3 hidden bg-cream/90 px-2 py-1 font-mono text-micro tracking-label text-ink max-[900px]:block">
            {active + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}
