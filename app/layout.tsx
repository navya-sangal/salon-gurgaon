import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  // One weight (normal + italic) keeps it to two small font files.
  weight: "500",
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Manrope({
  variable: "--font-manrope",
  // Latin only: the ₹ sign comes from the phone's own system font, saving a 33 KB download.
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saanjh Salon · Golf Course Road, Gurugram (concept build)",
  description:
    "A concept site for a fictional premium salon in Gurugram: services and ₹ prices, stylists, gallery, reviews and real online booking.",
  // Fictional business: keep it out of search results so nobody mistakes it for a real salon.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1e2238",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
