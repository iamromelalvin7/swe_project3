"use client";

import { cloneElement, isValidElement, useId, type ReactElement } from "react";

/**
 * Label + control + message, wired together: the label's `htmlFor`, the
 * control's `id`, `aria-invalid` and `aria-describedby` are all set here so
 * every form gets accessible fields without repeating the plumbing.
 * `children` must be a single input/select/textarea element.
 */
export function Field({
  label,
  error,
  note,
  help,
  className = "mb-7",
  children,
}: {
  label: string;
  error?: string;
  /** Positive confirmation shown in ink, e.g. "Passwords match". */
  note?: string;
  help?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? note ?? help;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": message ? messageId : undefined,
      })
    : children;

  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow mb-2.5 block">
        {label}
      </label>
      {control}
      {message && (
        <p id={messageId} className={`mt-2 text-sm ${error ? "text-signal" : note ? "text-ink" : "text-grey"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
