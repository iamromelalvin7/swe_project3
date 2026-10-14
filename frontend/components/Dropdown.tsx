"use client";

import { useEffect, useId, useRef, useState } from "react";

export type DropdownOption = { value: string | null; label: string };

/**
 * A pill that opens a single-choice menu. Implements the ARIA menu pattern
 * fully: focus moves into the menu on open, ↑/↓/Home/End move between
 * options, Escape or Tab closes it and returns focus to the pill, and the
 * current choice is marked with aria-checked.
 */
export function Dropdown({
  label,
  options,
  selected,
  onSelect,
  align = "left",
}: {
  label: React.ReactNode;
  options: DropdownOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    // Keep the panel on screen: flip it to the other edge of the pill if it
    // would run past the viewport (pills near the right edge on a phone).
    const menu = menuRef.current;
    if (menu) {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth - 8) {
        menu.style.left = "auto";
        menu.style.right = "0";
      } else if (rect.left < 8) {
        menu.style.left = "0";
        menu.style.right = "auto";
      }
    }
    const selectedIndex = Math.max(0, options.findIndex((o) => o.value === selected));
    itemRefs.current[selectedIndex]?.focus();

    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, options, selected]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`pill ${open ? "border-ink" : ""}`}
      >
        {label}
        <span aria-hidden="true" className={`border-x-[3.5px] border-t-4 border-x-transparent border-t-grey transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div ref={menuRef} id={menuId} role="menu" onKeyDown={onMenuKeyDown} className={`menu-panel ${align === "right" ? "right-0" : "left-0"}`}>
          {options.map((o, i) => {
            const checked = o.value === selected;
            return (
              <button
                key={o.value ?? "__all"}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                className="menu-item"
                onClick={() => {
                  onSelect(o.value);
                  close(true);
                }}
              >
                <span>{o.label}</span>
                {checked && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
