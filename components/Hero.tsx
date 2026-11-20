import Image from "next/image";
import { heroImage, salon } from "@/lib/salon";
import { formatTime } from "@/lib/time";
import { ArrowIcon } from "./ui";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="bg-ink text-mist relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 85% 100%, rgba(201,191,214,0.22), transparent 60%), radial-gradient(90% 70% at 0% 0%, rgba(78,110,99,0.25), transparent 60%)",
      }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pt-20 md:pb-24">
        <div>
          <p className="text-haze text-xs font-semibold tracking-[0.25em] uppercase">Golf Course Road · Gurugram</p>
          <h1 id="hero-title" className="font-display mt-5 text-5xl leading-[1.02] font-medium sm:text-6xl lg:text-7xl">
            {/* Fixed line breaks on phones: the heading keeps the same height before and after the web font loads. */}
            <em className="text-lilac">Unhurried</em> <br className="sm:hidden" />
            hair, skin &amp; <br className="sm:hidden" />
            bridal care.
          </h1>
          {/* Room for four lines on phones, so a re-wrap when the font loads can't push the page down. */}
          <p className="text-haze mt-6 min-h-[4lh] max-w-md text-base leading-relaxed sm:min-h-0 sm:text-lg">
            A quiet salon with senior stylists only and never more than five guests on the floor. Book online and
            see real availability for every stylist.
          </p>
          {/* Always stacked on phones, so the font swap can't change how the buttons wrap. */}
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#book"
              className="bg-mist text-ink hover:bg-lilac-soft inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-colors"
            >
              Book an appointment <ArrowIcon />
            </a>
            <a
              href="#services"
              className="border-haze/50 text-mist hover:border-lilac rounded-full border px-6 py-3.5 text-sm font-semibold transition-colors"
            >
              Services &amp; prices
            </a>
          </div>
          <dl className="border-haze/25 mt-12 grid max-w-md grid-cols-3 gap-4 border-t pt-6 text-sm">
            <div>
              <dt className="text-haze text-xs">Open daily</dt>
              <dd className="mt-1 font-semibold">
                {formatTime(salon.open)}–{formatTime(salon.close)}
              </dd>
            </div>
            <div>
              <dt className="text-haze text-xs">Rated</dt>
              <dd className="mt-1 font-semibold">4.9 / 5</dd>
            </div>
            <div>
              <dt className="text-haze text-xs">Artists</dt>
              <dd className="mt-1 font-semibold">5 senior</dd>
            </div>
          </dl>
        </div>

        {/* Narrower on phones so the headline, not the photo, is the largest thing on first screen (faster LCP). */}
        <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-sm md:max-w-none">
          <div className="border-lilac/30 absolute -inset-3 rounded-t-full border" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-full">
            <Image
              src={`${heroImage.src}?auto=format&fit=crop&w=1400&q=80`}
              alt={heroImage.alt}
              fill
              loading="eager"
              fetchPriority="high"
              quality={60}
              sizes="(min-width: 1152px) 470px, (min-width: 768px) 42vw, (min-width: 640px) 384px, 272px"
              className="object-cover"
            />
            <div className="from-ink/40 absolute inset-0 bg-gradient-to-t to-transparent" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
