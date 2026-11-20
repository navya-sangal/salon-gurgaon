// Everything about the (fictional) salon lives here: services, prices, stylists, hours, reviews.
// Edit this file to change what the site shows. Bookings themselves live in Supabase.

export type Category = "hair" | "skin" | "nails" | "bridal";

export type Service = {
  id: string;
  category: Category;
  name: string;
  description: string;
  /** Price in rupees. */
  price: number;
  /** True when the price is a starting price ("from ₹4,500"). */
  from?: boolean;
  /** How long the appointment blocks the stylist, in minutes (multiple of 30). */
  duration: number;
};

export type Stylist = {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Categories this person takes bookings for. */
  skills: Category[];
  /** Individual services outside those categories that they also do. */
  extra?: string[];
  /** Weekly day off, 0 = Sunday … 6 = Saturday. */
  dayOff: number;
  years: number;
};

export const salon = {
  name: "Saanjh Salon",
  tagline: "Unhurried hair, skin and bridal care on Golf Course Road.",
  address: {
    line1: "Ground floor, Saanjh House",
    line2: "Golf Course Road, Sector 54",
    city: "Gurugram, Haryana 122002",
  },
  landmark: "4 min walk from Sector 54 Chowk Rapid Metro",
  // Clearly fake: this is a concept build.
  phoneDisplay: "+91 124 000 0000",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Golf+Course+Road+Sector+54+Gurugram",
  /** Opening hours, minutes after midnight (IST). Same every day. */
  open: 10 * 60,
  close: 20 * 60,
  /** Gap between bookable start times, in minutes. */
  slotStep: 30,
  /** How far ahead people can book, in days (today counts as day 0). */
  bookingWindowDays: 30,
  /** Earliest bookable start, in minutes from now. */
  leadTimeMinutes: 60,
  /** Max upcoming bookings per phone number (keeps demo spam down). */
  maxUpcomingPerPhone: 3,
} as const;

export const categories: { id: Category; label: string; blurb: string }[] = [
  { id: "hair", label: "Hair", blurb: "Cuts, colour and care, finished by hand." },
  { id: "skin", label: "Skin", blurb: "Facials built around what your skin needs today." },
  { id: "nails", label: "Nails", blurb: "Quiet, precise hand and foot rituals." },
  { id: "bridal", label: "Bridal", blurb: "Wedding-day looks, trialled and timed." },
];

export const services: Service[] = [
  // Hair
  { id: "cut-women", category: "hair", name: "Women's cut & style", description: "Consultation, wash, precision cut and blow-dry.", price: 1800, duration: 60 },
  { id: "cut-men", category: "hair", name: "Men's cut & finish", description: "Cut, wash and styled finish.", price: 950, duration: 30 },
  { id: "blowdry", category: "hair", name: "Blow-dry & styling", description: "Smooth, bouncy or waves, built to last the evening.", price: 1200, duration: 30 },
  { id: "global-colour", category: "hair", name: "Global colour", description: "Ammonia-free colour, root to tip, with gloss.", price: 4500, from: true, duration: 120 },
  { id: "balayage", category: "hair", name: "Balayage", description: "Hand-painted lightening, toned to your skin.", price: 8500, from: true, duration: 180 },
  { id: "keratin", category: "hair", name: "Keratin smoothing", description: "Frizz control that lasts three to four months.", price: 7000, from: true, duration: 150 },
  { id: "hair-spa", category: "hair", name: "Ritual hair spa", description: "Scalp massage, steam and deep-conditioning mask.", price: 2400, duration: 60 },
  // Skin
  { id: "cleanup", category: "skin", name: "Express clean-up", description: "Cleanse, exfoliate, extract and hydrate.", price: 1800, duration: 30 },
  { id: "signature-facial", category: "skin", name: "Saanjh signature facial", description: "Our slow, 75-minute facial with lymphatic massage.", price: 3500, duration: 90 },
  { id: "hydrafacial", category: "skin", name: "HydraFacial", description: "Deep cleanse and infusion of serums. No downtime.", price: 6500, duration: 60 },
  { id: "peel", category: "skin", name: "Brightening peel", description: "Gentle peel for tone and texture.", price: 4200, duration: 60 },
  // Nails
  { id: "manicure", category: "nails", name: "Classic manicure", description: "Shape, cuticle care, massage and polish.", price: 900, duration: 30 },
  { id: "pedicure", category: "nails", name: "Spa pedicure", description: "Soak, scrub, mask and massage.", price: 1400, duration: 60 },
  { id: "gel-polish", category: "nails", name: "Gel polish", description: "Chip-resistant colour for up to three weeks.", price: 1500, duration: 60 },
  { id: "gel-extensions", category: "nails", name: "Gel extensions", description: "Sculpted length in your choice of shape.", price: 3000, duration: 90 },
  // Bridal
  { id: "bridal-hd", category: "bridal", name: "Bridal HD makeup", description: "Wedding-day makeup, draping and hair.", price: 28000, duration: 180 },
  { id: "bridal-airbrush", category: "bridal", name: "Bridal airbrush makeup", description: "Long-wear airbrush base, draping and hair.", price: 35000, duration: 180 },
  { id: "party-makeup", category: "bridal", name: "Engagement or party look", description: "Makeup and hair for the functions around the wedding.", price: 12000, duration: 120 },
  { id: "bridal-hair", category: "bridal", name: "Bridal hair styling", description: "Updo or open styling with dupatta setting.", price: 6000, duration: 90 },
  { id: "pre-bridal", category: "bridal", name: "Pre-bridal glow session", description: "Facial, hair spa and manicure in one sitting.", price: 5500, duration: 150 },
];

export const stylists: Stylist[] = [
  {
    id: "meher",
    name: "Meher Anand",
    role: "Creative director",
    bio: "Fifteen years of colour work, including six in London. Known for soft, low-maintenance balayage.",
    skills: ["hair"],
    extra: ["bridal-hair"],
    dayOff: 1,
    years: 15,
  },
  {
    id: "kabir",
    name: "Kabir Sethi",
    role: "Senior stylist",
    bio: "Precision cuts for every hair type, and the calmest keratin treatments in Gurugram.",
    skills: ["hair"],
    dayOff: 2,
    years: 9,
  },
  {
    id: "tanvi",
    name: "Tanvi Rao",
    role: "Skin therapist",
    bio: "Trained in clinical skincare. Builds every facial around what your skin needs that day.",
    skills: ["skin"],
    extra: ["pre-bridal"],
    dayOff: 3,
    years: 8,
  },
  {
    id: "ira",
    name: "Ira Fernandes",
    role: "Nail artist",
    bio: "Minimal nail art and structured gel. Fine detail, steady hands, good playlists.",
    skills: ["nails"],
    dayOff: 4,
    years: 6,
  },
  {
    id: "zoya",
    name: "Zoya Mirza",
    role: "Bridal & makeup artist",
    bio: "More than 300 brides. Skin-first makeup that still looks like you in the photos.",
    skills: ["bridal"],
    dayOff: 2,
    years: 11,
  },
];

export const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getService(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

export function getStylist(id: string): Stylist | undefined {
  return stylists.find((s) => s.id === id);
}

export function canPerform(stylist: Stylist, service: Service): boolean {
  return stylist.skills.includes(service.category) || (stylist.extra ?? []).includes(service.id);
}

export function stylistsFor(service: Service): Stylist[] {
  return stylists.filter((st) => canPerform(st, service));
}

export function servicesIn(category: Category): Service[] {
  return services.filter((s) => s.category === category);
}

export const reviews = [
  {
    name: "Aanya K.",
    area: "DLF Phase 5",
    rating: 5,
    service: "Balayage with Meher",
    text: "Meher spent twenty minutes just talking through what I wanted before she touched my hair. Four months later it is still growing out beautifully.",
  },
  {
    name: "Rohan M.",
    area: "Sector 56",
    rating: 5,
    service: "Men's cut with Kabir",
    text: "Booked online at 9 pm for the next morning, walked in, no waiting. Best cut I've had in Gurgaon.",
  },
  {
    name: "Simran B.",
    area: "Sushant Lok",
    rating: 5,
    service: "Bridal HD makeup with Zoya",
    text: "Zoya did my trial and my wedding. I looked like myself, just rested. My makeup held through a ten-hour day.",
  },
  {
    name: "Neha G.",
    area: "Golf Course Extension",
    rating: 5,
    service: "Signature facial with Tanvi",
    text: "Genuinely the calmest ninety minutes of my month. Tanvi explains what she's doing without any upselling.",
  },
  {
    name: "Priya S.",
    area: "Sector 43",
    rating: 4,
    service: "Gel extensions with Ira",
    text: "Lovely, precise work and the shape is perfect. Took a little longer than planned, but worth it.",
  },
  {
    name: "Ishita R.",
    area: "DLF Phase 1",
    rating: 5,
    service: "Keratin with Kabir",
    text: "Clean salon, no harsh smells, and they actually told me how to look after it at home. Frizz-free for months.",
  },
];

export const gallery = [
  { src: "https://images.unsplash.com/photo-1558265246-e84a824bcd83", alt: "A low twisted bun with soft brown and caramel tones", caption: "Occasion updo", tall: true },
  { src: "https://images.unsplash.com/photo-1605980766335-d3a41c7332a1", alt: "Long hair with an ash-blonde balayage in loose waves", caption: "Ash balayage" },
  { src: "https://images.unsplash.com/photo-1683408640631-2c99fff964d7", alt: "A client resting with eyes closed during a facial", caption: "Signature facial" },
  { src: "https://images.unsplash.com/photo-1700760934268-8aa0ef52ce0a", alt: "A stylist cutting long dark hair with scissors", caption: "Precision cut", tall: true },
  { src: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66", alt: "Hand with mauve, white and silver glitter gel nails", caption: "Mauve gel set" },
  { src: "https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9", alt: "A bride in a red lehenga with gold jewellery and henna", caption: "Bridal HD", tall: true },
  { src: "https://images.unsplash.com/photo-1772442164216-5df411dadc81", alt: "Glossy dark hair smoothed into a low ponytail", caption: "Keratin finish" },
  { src: "https://images.unsplash.com/photo-1633681138600-295fcd688876", alt: "Styling stations with arched mirrors in a bright salon", caption: "The floor" },
];

export const heroImage = {
  src: "https://images.unsplash.com/photo-1781450090585-1a511b7066d9",
  alt: "Black and white view of a calm salon with arched mirrors and styling chairs",
};
