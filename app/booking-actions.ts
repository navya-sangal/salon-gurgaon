"use server";

import { countUpcomingForPhone, getBusyByDay, insertBooking } from "@/lib/bookings";
import { normalizeIndianMobile } from "@/lib/phone";
import { canPerform, getService, getStylist, salon } from "@/lib/salon";
import { slotsForDay } from "@/lib/slots";
import { isValidDate, istToIso } from "@/lib/time";
import { isSupabaseConfigured } from "@/lib/supabase";

export type BookingRequest = {
  serviceId: string;
  stylistId: string;
  date: string;
  start: number;
  name: string;
  phone: string;
  note: string;
  /** Honeypot: hidden from people, bots tend to fill it in. */
  website: string;
};

export type BookingResult =
  | { ok: true; ref: string }
  | { ok: false; code: "taken" | "invalid" | "limit" | "offline" | "error"; message: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function createBooking(input: BookingRequest): Promise<BookingResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, code: "offline", message: "Online booking is switched off right now. Please call the salon." };
  }

  // Bots that fill the hidden field get a convincing "success" and nothing is saved.
  if (str(input?.website, 200)) return { ok: true, ref: "SJ0000" };

  const service = getService(str(input?.serviceId, 40));
  const stylist = getStylist(str(input?.stylistId, 40));
  const date = str(input?.date, 10);
  const start = typeof input?.start === "number" && Number.isInteger(input.start) ? input.start : -1;
  const name = str(input?.name, 60).replace(/\s+/g, " ");
  const phone = normalizeIndianMobile(str(input?.phone, 20));
  const note = str(input?.note, 300) || null;

  if (!service || !stylist || !canPerform(stylist, service) || !isValidDate(date) || start < 0) {
    return { ok: false, code: "invalid", message: "Something about that booking didn't add up. Please choose again." };
  }
  if (name.length < 2) return { ok: false, code: "invalid", message: "Please add your name." };
  if (!phone) return { ok: false, code: "invalid", message: "Please enter a 10-digit Indian mobile number." };

  try {
    const busy = (await getBusyByDay(stylist.id, date, date))[date] ?? [];
    const slot = slotsForDay({ date, service, stylist, busy, nowMs: Date.now() }).find((s) => s.start === start);
    if (!slot) {
      return { ok: false, code: "invalid", message: "That time can no longer be booked. Please pick another." };
    }
    if (!slot.available) {
      return { ok: false, code: "taken", message: "Someone has just booked that time. Please pick another." };
    }

    if ((await countUpcomingForPhone(phone)) >= salon.maxUpcomingPerPhone) {
      return {
        ok: false,
        code: "limit",
        message: `This number already has ${salon.maxUpcomingPerPhone} upcoming bookings. Please call the salon to book more.`,
      };
    }

    const result = await insertBooking({
      service_id: service.id,
      stylist_id: stylist.id,
      starts_at: istToIso(date, start),
      ends_at: istToIso(date, start + service.duration),
      customer_name: name,
      customer_phone: phone,
      note,
    });

    if (!result.ok) {
      if (result.reason === "taken") {
        return { ok: false, code: "taken", message: "Someone has just booked that time. Please pick another." };
      }
      console.error("Booking insert failed:", result.message);
      return { ok: false, code: "error", message: "We couldn't save your booking. Please try again." };
    }
    return { ok: true, ref: `SJ-${result.id.slice(0, 6).toUpperCase()}` };
  } catch (err) {
    console.error("Booking failed:", err);
    return { ok: false, code: "error", message: "We couldn't save your booking. Please try again." };
  }
}
