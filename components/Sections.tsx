import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { categories, gallery, reviews, salon, stylists, weekdayNames } from "@/lib/salon";
import { formatTime } from "@/lib/time";
import { ServiceMenu } from "./ServiceMenu";
import { ArrowIcon, SectionHeading, Stars } from "./ui";

const wrap = "mx-auto max-w-6xl px-4 sm:px-6";

export function ServicesSection() {
  return (
    <section aria-labelledby="services-title" id="services" className="defer-render py-20 sm:py-28">
      <div className={wrap}>
        <SectionHeading
          id="services-title"
          eyebrow="Services & prices"
          title="Everything is done by a senior artist."
          intro="Prices include GST. Colour and smoothing prices depend on length and density; your stylist confirms the final price before starting."
        />
        <Suspense>
          <ServiceMenu />
        </Suspense>
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

export function StylistsSection() {
  return (
    <section aria-labelledby="stylists-title" id="stylists" className="defer-render bg-paper py-20 sm:py-28">
      <div className={wrap}>
        <SectionHeading
          id="stylists-title"
          eyebrow="Stylists"
          title="Five people, one standard."
          intro="Choose who looks after you when you book. Each stylist has one fixed day off a week."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stylists.map((st) => (
            <li key={st.id} className="border-line bg-mist flex flex-col rounded-3xl border p-6">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="font-display bg-lilac-soft text-ink flex h-16 w-14 items-end justify-center rounded-t-full pb-2 text-2xl font-medium"
                >
                  {initials(st.name)}
                </div>
                <div>
                  <h3 className="text-ink text-lg font-semibold">{st.name}</h3>
                  <p className="text-slate text-sm">
                    {st.role} · {st.years} yrs
                  </p>
                </div>
              </div>
              <p className="text-slate mt-4 flex-1 text-sm leading-relaxed">{st.bio}</p>
              <div className="border-line mt-5 flex items-center justify-between gap-3 border-t pt-4 text-sm">
                <span className="text-slate">
                  {st.skills.map((s) => categories.find((c) => c.id === s)?.label).join(", ")} · off {weekdayNames[st.dayOff]}s
                </span>
                <a
                  href="#book"
                  data-book-stylist={st.id}
                  className="text-sage hover:text-sage-dark inline-flex shrink-0 items-center gap-1 font-semibold"
                  aria-label={`Book with ${st.name}`}
                >
                  Book <ArrowIcon className="size-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GallerySection() {
  return (
    <section aria-labelledby="gallery-title" id="gallery" className="defer-render py-20 sm:py-28">
      <div className={wrap}>
        <SectionHeading id="gallery-title" eyebrow="Gallery" title="Recent work, in natural light." />
        <ul className="mt-12 columns-2 gap-3 sm:gap-4 lg:columns-3 [&>li]:mb-3 sm:[&>li]:mb-4">
          {gallery.map((g) => (
            <li key={g.src} className="break-inside-avoid">
              <figure>
                <div className={`relative overflow-hidden rounded-2xl ${g.tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
                  <Image
                    src={`${g.src}?auto=format&fit=crop&w=1000&q=80`}
                    alt={g.alt}
                    fill
                    quality={60}
                    sizes="(min-width: 1152px) 360px, (min-width: 1024px) 31vw, 47vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-slate mt-2 text-xs font-medium tracking-wide">{g.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ReviewsSection() {
  return (
    <section aria-labelledby="reviews-title" id="reviews" className="defer-render bg-ink text-mist py-20 sm:py-28">
      <div className={wrap}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="reviews-title" eyebrow="Reviews" title="What guests say." tone="dark" />
          <p className="text-haze text-sm">
            <span className="font-display text-mist text-4xl font-medium">4.9</span> / 5 from 1,240 reviews
            <span className="block text-xs">(sample reviews for this concept)</span>
          </p>
        </div>
        {/* A swipeable row on phones, a grid from tablet up. */}
        <ul
          tabIndex={0}
          aria-label="Guest reviews"
          className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-3"
        >
          {reviews.map((r) => (
            <li key={r.name} className="bg-ink-2 flex w-[85%] shrink-0 snap-center flex-col rounded-3xl p-6 md:w-auto">
              <Stars rating={r.rating} className="text-lilac" />
              <blockquote className="mt-4 flex-1 leading-relaxed">
                <p>&ldquo;{r.text}&rdquo;</p>
              </blockquote>
              <p className="text-haze mt-5 text-sm">
                <span className="text-mist font-semibold">{r.name}</span> · {r.area}
                <span className="block text-xs">{r.service}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MapIllustration() {
  // A drawn map instead of an embedded Google Map: no third-party scripts, no layout shift.
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-labelledby="map-title">
      <title id="map-title">Sketch map: Saanjh Salon on Golf Course Road, near Sector 54 Chowk Rapid Metro</title>
      <rect width="400" height="300" fill="#ece8f2" />
      <g stroke="#fbfbfd" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M-20 250 L420 60" />
        <path d="M120 -10 L180 310" />
        <path d="M300 -10 L330 310" />
      </g>
      <g stroke="#dde0e8" strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M-10 120 L180 40" />
        <path d="M200 310 L420 210" />
        <path d="M30 310 L60 140" />
      </g>
      <path d="M-20 270 L420 80" stroke="#a9a3c4" strokeWidth="2" strokeDasharray="6 6" fill="none" />
      <text x="40" y="216" fill="#5b6478" fontSize="12" fontFamily="sans-serif" transform="rotate(-23 40 216)">
        Golf Course Road
      </text>
      <text x="262" y="132" fill="#5b6478" fontSize="10" fontFamily="sans-serif" transform="rotate(-23 262 132)">
        Rapid Metro
      </text>
      <circle cx="166" cy="183" r="9" fill="#fbfbfd" stroke="#5b6478" strokeWidth="2" />
      <text x="96" y="176" fill="#5b6478" fontSize="10" fontFamily="sans-serif" textAnchor="end">
        Sector 54 Chowk
      </text>
      <g transform="translate(232 150)">
        <circle r="26" fill="#4e6e63" opacity="0.18" />
        <path d="M0 -24c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" fill="#1e2238" />
        <circle cy="-8" r="6" fill="#c9bfd6" />
      </g>
      <text x="232" y="200" fill="#1e2238" fontSize="13" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">
        Saanjh
      </text>
    </svg>
  );
}

export function VisitSection() {
  return (
    <section aria-labelledby="visit-title" id="visit" className="defer-render py-20 sm:py-28">
      <div className={`${wrap} grid items-start gap-12 md:grid-cols-2`}>
        <div>
          <SectionHeading id="visit-title" eyebrow="Location & hours" title="Find us on Golf Course Road." />
          <address className="text-ink mt-8 not-italic leading-relaxed">
            {salon.name}
            <br />
            {salon.address.line1}
            <br />
            {salon.address.line2}
            <br />
            {salon.address.city}
          </address>
          <p className="text-slate mt-2 text-sm">{salon.landmark}. Valet parking at the door.</p>

          <h3 className="text-ink mt-10 text-sm font-semibold tracking-[0.15em] uppercase">Hours</h3>
          <table className="mt-3 w-full max-w-sm text-sm">
            <tbody className="divide-line divide-y">
              <tr>
                <th scope="row" className="text-slate py-2.5 text-left font-medium">
                  Monday – Sunday
                </th>
                <td className="text-ink py-2.5 text-right font-semibold">
                  {formatTime(salon.open)} – {formatTime(salon.close)}
                </td>
              </tr>
              <tr>
                <th scope="row" className="text-slate py-2.5 text-left font-medium">
                  Bridal appointments
                </th>
                <td className="text-ink py-2.5 text-right font-semibold">From 6 am on request</td>
              </tr>
            </tbody>
          </table>
          <p className="text-slate mt-3 text-xs">All times are India Standard Time.</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={salon.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ink text-mist hover:bg-ink-2 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors"
            >
              Get directions <ArrowIcon />
            </a>
            <span className="text-slate inline-flex items-center px-2 text-sm">Phone {salon.phoneDisplay}</span>
          </div>
        </div>
        <div className="border-line aspect-[4/3] overflow-hidden rounded-3xl border">
          <MapIllustration />
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="defer-render bg-ink text-haze [contain-intrinsic-size:auto_400px]">
      <div className="dusk-rule" />
      <div className={`${wrap} grid gap-10 py-14 text-sm md:grid-cols-[1.4fr_1fr_1fr]`}>
        <div>
          <p className="font-display text-mist text-3xl font-medium">Saanjh</p>
          <p className="mt-3 max-w-xs leading-relaxed">
            A concept build: Saanjh Salon is a fictional business made as a portfolio demo. Services, people and reviews
            are invented. Online booking really works.
          </p>
        </div>
        <div>
          <p className="text-mist font-semibold">For salon owners</p>
          <p className="mt-3 leading-relaxed">See how bookings arrive on the owner&rsquo;s side.</p>
          <Link href="/owner" prefetch={false} className="text-lilac hover:text-mist mt-3 inline-flex items-center gap-1.5 font-semibold">
            View owner dashboard (demo) <ArrowIcon className="size-3.5" />
          </Link>
        </div>
        <div>
          <p className="text-mist font-semibold">Credits</p>
          <p className="mt-3 leading-relaxed">
            Photography from{" "}
            <a href="https://unsplash.com" className="hover:text-mist underline underline-offset-4">
              Unsplash
            </a>
            . Map is illustrative.
          </p>
        </div>
      </div>
    </footer>
  );
}
