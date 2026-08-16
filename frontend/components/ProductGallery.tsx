"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex gap-4 max-[900px]:flex-col">
      <div className="order-2 flex gap-3 max-[900px]:order-1 max-[900px]:flex-row md:flex-col">
        {images.length === 0 ? (
          <Placeholder label="FRONT" ring active size="w-[84px] max-[900px]:w-[72px]" />
        ) : (
          images.map((img, i) => (
            <button
              key={img.position}
              onClick={() => setActive(i)}
              className={`aspect-[3/4] w-[84px] flex-shrink-0 overflow-hidden rounded-[4px] outline outline-1 outline-offset-[-1px] max-[900px]:w-[72px] ${
                active === i ? "outline-ink" : "outline-rule"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbUrl} alt={`${title} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))
        )}
      </div>
      <div className="order-1 flex-1 max-[900px]:order-2">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={title}
            className="aspect-[3/4] w-full rounded-[4px] object-cover"
          />
        ) : (
          <Placeholder label="No photograph yet" size="w-full" />
        )}
      </div>
    </div>
  );
}

function Placeholder({
  label,
  size,
  ring,
  active,
}: {
  label: string;
  size: string;
  ring?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`${size} flex aspect-[3/4] flex-shrink-0 items-center justify-center rounded-[4px] bg-white text-center font-mono text-[10px] uppercase tracking-[0.08em] text-grey ${
        ring ? `outline outline-1 outline-offset-[-1px] ${active ? "outline-ink" : "outline-rule"}` : ""
      }`}
      style={{ backgroundImage: "repeating-linear-gradient(135deg, #F4F2ED 0 7px, #FFFFFF 7px 14px)" }}
    >
      {label}
    </div>
  );
}
