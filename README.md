# Saanjh Salon: concept build

A portfolio demo for a **fictional** premium salon on Golf Course Road, Gurugram. The services, people and
reviews are invented; the online booking is real.

- **Stack:** Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, Supabase (Postgres)
- **Design:** "dusk" palette (saanjh = dusk): night indigo, mist, eucalyptus and lilac; Cormorant Garamond + Manrope
- **Hosting:** Vercel, with one daily cron job

## What it does

- **Booking:** pick a service → stylist → date → time → name and mobile number.
  Times already taken are shown struck through. Postgres itself refuses overlapping bookings for the same
  stylist (an exclusion constraint), so two people pressing "Confirm" in the same second can't both get a slot.
- **Owner dashboard** at `/owner`: today's and upcoming bookings with confirm / cancel.
  - Demo login: password `demo-saanjh` (shown on the login page). Real visitors' names and numbers are masked.
  - Owner login: `OWNER_PASSWORD` from the environment. Shows everything.
- **Daily job** (`/api/cron/daily`, 06:00 IST): resets sample bookings for the next two weeks, deletes old
  bookings, and keeps the free Supabase project from pausing after 7 idle days.
- Kept out of search engines (`noindex`) because the business is fictional.

## Where things live

| Path | What |
| --- | --- |
| `lib/salon.ts` | Services, ₹ prices, stylists (with days off), hours, reviews, gallery photos |
| `lib/slots.ts` | Which start times are bookable (shared by browser and server) |
| `lib/time.ts` | India Standard Time helpers |
| `app/booking-actions.ts` | Server action that validates and saves a booking |
| `app/api/availability/route.ts` | Busy times for a stylist (times only, no customer data) |
| `app/owner/` | Owner dashboard, login and confirm / cancel actions |
| `lib/samples.ts`, `app/api/cron/daily/route.ts` | Daily sample-booking refresh |
| `supabase/schema.sql` | Bookings table, overlap rule, Row Level Security |

The browser never talks to Supabase directly. All reads and writes go through server code using the secret
key, and the table has Row Level Security on with no public policies.

## Run it locally

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Copy `.env.example` to `.env.local` and fill it in (see the comments in the file).
3. `npm install`, then `npm run dev` and open http://localhost:3000.
4. Optional: fill the calendar with sample bookings:
   `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/daily`

## Deploy on Vercel

Import the GitHub repo in Vercel, add the five variables from `.env.example` under
**Settings → Environment Variables**, and deploy. The cron job in `vercel.json` is picked up automatically.
