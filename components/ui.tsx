import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  tone = "light",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  id: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <header className="max-w-2xl">
      <p className={`text-xs font-semibold tracking-[0.2em] uppercase ${dark ? "text-haze" : "text-sage"}`}>{eyebrow}</p>
      <h2
        id={id}
        className={`font-display mt-3 text-4xl leading-[1.05] font-medium sm:text-5xl ${dark ? "text-mist" : "text-ink"}`}
      >
        {title}
      </h2>
      {intro && <p className={`mt-4 text-base leading-relaxed ${dark ? "text-haze" : "text-slate"}`}>{intro}</p>}
    </header>
  );
}

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-4" aria-hidden="true">
          <path
            d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.9L10 1.5z"
            fill={i <= rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  );
}

export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10h11m0 0l-4.5-4.5M15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
