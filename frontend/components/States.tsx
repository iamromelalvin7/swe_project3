/** The one "request failed" layout used by every page and panel. */
export function ErrorState({
  title,
  message = "Check your connection and try again.",
  onRetry,
  className = "border-t border-rule py-20",
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={`text-center ${className}`}>
      <div className="mb-3 font-mono text-label uppercase tracking-label text-signal">Couldn&apos;t load</div>
      <div className="mb-2.5 font-serif text-h3">{title}</div>
      <p className="mb-6 text-sm text-grey">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary">
          Try again
        </button>
      )}
    </div>
  );
}

/** A short form-level error banner: sentence case, readable, announced. */
export function FormError({ message, id }: { message: string | null; id?: string }) {
  if (!message) return null;
  return (
    <div id={id} role="alert" tabIndex={-1} className="mb-6 border-l-2 border-signal py-1 pl-3.5 text-sm text-signal outline-none">
      {message}
    </div>
  );
}
