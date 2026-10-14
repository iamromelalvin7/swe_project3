/** Title row for every admin page: optional eyebrow, a tool-sized heading, actions on the right. */
export function AdminPageHeader({
  title,
  eyebrow,
  meta,
  actions,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 max-[640px]:mb-6">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="font-serif text-h2 max-[640px]:text-h3">{title}</h1>
        {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/** A horizontally scrolling row of filter toggles (no wrapping onto three lines on a phone). */
export function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {children}
    </div>
  );
}

export function FilterToggle({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 flex-shrink-0 items-center gap-2 border px-3.5 font-mono text-label uppercase tracking-label-sm transition-colors ${
        active ? "border-ink bg-ink text-cream" : "border-rule text-grey hover:border-ink hover:text-ink"
      }`}
    >
      {children}
      {count !== undefined && <span className={`tabular-nums ${active ? "text-cream/70" : "text-grey"}`}>{count}</span>}
    </button>
  );
}

/** "Showing 50 of 63" + Load more, under every admin list. */
export function ListFooter({
  shown,
  total,
  noun,
  hasMore,
  loadingMore,
  moreError,
  onLoadMore,
}: {
  shown: number;
  total: number;
  noun: string;
  hasMore: boolean;
  loadingMore: boolean;
  moreError: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p className="font-mono text-micro uppercase tracking-label text-grey tabular-nums">
        Showing {shown} of {total} {noun}
      </p>
      {hasMore && (
        <button type="button" onClick={onLoadMore} disabled={loadingMore} className="btn-outline h-10 px-5">
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
      {moreError && (
        <p role="alert" className="form-error w-full">
          Couldn&apos;t load more. Try again.
        </p>
      )}
    </div>
  );
}

/** Skeleton rows that match the table (desktop) and the cards (mobile). */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b border-rule pb-3 max-[1099px]:hidden">
        <div className="skeleton h-2.5 w-1/3" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-rule py-3">
          <div className="skeleton h-14 w-11 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-[45%]" />
            <div className="skeleton h-2.5 w-[25%]" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
