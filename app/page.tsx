import { BookingWidget } from "@/components/booking/BookingWidget";
import { Hero } from "@/components/Hero";
import {
  GallerySection,
  ReviewsSection,
  ServicesSection,
  SiteFooter,
  StylistsSection,
  VisitSection,
} from "@/components/Sections";
import { ConceptBanner, SiteHeader } from "@/components/SiteHeader";
import { SectionHeading } from "@/components/ui";

export default function Home() {
  return (
    <>
      <a
        href="#book"
        className="bg-ink text-mist sr-only z-50 rounded-full px-4 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to booking
      </a>
      <div id="top">
        <ConceptBanner />
      </div>
      <SiteHeader />
      <main>
        <Hero />
        <ServicesSection />
        <StylistsSection />
        <GallerySection />
        <section aria-labelledby="book-title" id="book" className="defer-render bg-lilac-soft/60 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              id="book-title"
              eyebrow="Online booking"
              title="Book an appointment."
              intro="Pick a service, a stylist and a time. You're seeing live availability: times that are already taken are struck through."
            />
            <BookingWidget />
          </div>
        </section>
        <ReviewsSection />
        <VisitSection />
      </main>
      <SiteFooter />
    </>
  );
}
