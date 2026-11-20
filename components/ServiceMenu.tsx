"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { categories, servicesIn, type Category } from "@/lib/salon";
import { formatDuration, formatPrice } from "@/lib/time";

// Hair / Skin / Nails / Bridal tabs. Each "Book" link jumps to the booking section;
// the booking widget picks up data-book-service and preselects that service.
export function ServiceMenu() {
  const [active, setActive] = useState<Category>("hair");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = categories.findIndex((c) => c.id === active);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % categories.length;
    if (e.key === "ArrowLeft") next = (i - 1 + categories.length) % categories.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = categories.length - 1;
    if (next >= 0) {
      e.preventDefault();
      setActive(categories[next].id);
      tabRefs.current[next]?.focus();
    }
  }

  const current = categories.find((c) => c.id === active)!;

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label="Service categories"
        onKeyDown={onKeyDown}
        className="border-line no-scrollbar -mx-4 flex gap-2 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0"
      >
        {categories.map((c, i) => {
          const selected = c.id === active;
          return (
            <button
              key={c.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`tab-${c.id}`}
              aria-selected={selected}
              aria-controls={`panel-${c.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(c.id)}
              className={`relative shrink-0 px-4 pt-2 pb-3.5 text-sm font-semibold transition-colors ${
                selected ? "text-ink" : "text-slate hover:text-ink"
              }`}
            >
              {c.label}
              <span
                aria-hidden="true"
                className={`bg-sage absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-opacity ${selected ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} tabIndex={0} className="pt-6">
        <p className="text-slate text-sm">{current.blurb}</p>
        <ul className="mt-4 grid gap-x-10 md:grid-cols-2">
          {servicesIn(active).map((s) => (
            <li key={s.id} className="border-line flex items-start justify-between gap-4 border-b py-5">
              <div className="min-w-0">
                <h3 className="text-ink font-semibold">{s.name}</h3>
                <p className="text-slate mt-1 text-sm leading-relaxed">{s.description}</p>
                <p className="text-slate mt-2 text-xs font-medium tracking-wide">{formatDuration(s.duration)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="font-display text-ink text-2xl leading-none font-medium whitespace-nowrap">
                  {s.from && <span className="text-slate font-sans text-xs font-medium">from </span>}
                  {formatPrice(s.price)}
                </p>
                <a
                  href="#book"
                  data-book-service={s.id}
                  className="text-sage hover:text-sage-dark text-sm font-semibold underline-offset-4 hover:underline"
                  aria-label={`Book ${s.name}`}
                >
                  Book
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
