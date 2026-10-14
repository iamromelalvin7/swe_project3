/** Flat neutral stand-in for a missing photo — never a broken-image icon. */
export function ImagePlaceholder({ label = "No photograph", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-plate p-2 text-center font-mono text-micro uppercase tracking-label text-grey ${className}`}>
      {label}
    </div>
  );
}

/** A 3:4 product photo box of a fixed width — cart lines, order items, admin rows. */
export function ProductThumb({ src, alt, className = "w-16" }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`aspect-[3/4] flex-shrink-0 overflow-hidden bg-plate ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <ImagePlaceholder label="No photo" />
      )}
    </div>
  );
}
