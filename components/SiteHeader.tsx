const nav = [
  { href: "#services", label: "Services" },
  { href: "#stylists", label: "Stylists" },
  { href: "#gallery", label: "Gallery" },
  { href: "#reviews", label: "Reviews" },
  { href: "#visit", label: "Visit" },
];

export function ConceptBanner() {
  return (
    <div className="bg-ink-2 text-haze px-4 py-2 text-center text-xs leading-snug">
      <strong className="text-lilac font-semibold">Concept build.</strong> Saanjh Salon is fictional, made as a portfolio
      demo. Bookings are saved for real, but nobody will be expecting you.
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="border-line/70 bg-mist/90 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-ink text-3xl leading-none font-medium">Saanjh</span>
          <span className="text-slate text-[0.65rem] font-semibold tracking-[0.25em] uppercase">Salon</span>
        </a>
        <nav aria-label="Sections" className="hidden md:block">
          <ul className="text-slate flex gap-7 text-sm font-medium">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-ink transition-colors">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="#book"
          className="bg-sage hover:bg-sage-dark rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Book now
        </a>
      </div>
    </header>
  );
}
