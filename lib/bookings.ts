import "server-only";
import { getSupabase } from "./supabase";
import type { Busy } from "./slots";
import { addDays, isoToIst, istToIso } from "./time";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  service_id: string;
  stylist_id: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  customer_phone: string;
  note: string | null;
  status: BookingStatus;
  is_sample: boolean;
  created_at: string;
};

export type NewBooking = {
  service_id: string;
  stylist_id: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  customer_phone: string;
  note: string | null;
  status?: BookingStatus;
  is_sample?: boolean;
};

/** Postgres "exclusion_violation": the time range overlaps another active booking for that stylist. */
const OVERLAP_ERROR = "23P01";

/**
 * Busy stretches for one stylist, grouped by IST date, for fromDate … toDate inclusive.
 * Only times are returned: no names, phone numbers or booking ids ever leave the server.
 */
export async function getBusyByDay(stylistId: string, fromDate: string, toDate: string): Promise<Record<string, Busy[]>> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("stylist_id", stylistId)
    .neq("status", "cancelled")
    .gte("starts_at", istToIso(fromDate, 0))
    .lt("starts_at", istToIso(addDays(toDate, 1), 0))
    .order("starts_at");
  if (error) throw new Error(`Could not load availability: ${error.message}`);

  const byDay: Record<string, Busy[]> = {};
  for (const row of data ?? []) {
    const start = isoToIst(row.starts_at);
    const end = isoToIst(row.ends_at);
    const endMinutes = end.date === start.date ? end.minutes : 24 * 60;
    (byDay[start.date] ??= []).push([start.minutes, endMinutes]);
  }
  return byDay;
}

export async function countUpcomingForPhone(phone: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_phone", phone)
    .eq("is_sample", false)
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString());
  if (error) throw new Error(`Could not check existing bookings: ${error.message}`);
  return count ?? 0;
}

export async function insertBooking(
  booking: NewBooking,
): Promise<{ ok: true; id: string } | { ok: false; reason: "taken" | "error"; message?: string }> {
  const { data, error } = await getSupabase().from("bookings").insert(booking).select("id").single();
  if (error) {
    if (error.code === OVERLAP_ERROR) return { ok: false, reason: "taken" };
    return { ok: false, reason: "error", message: error.message };
  }
  return { ok: true, id: data.id as string };
}

/** Bookings starting from the start of `fromDate` (IST), soonest first. */
export async function listBookings(fromDate: string, days: number): Promise<Booking[]> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("*")
    .gte("starts_at", istToIso(fromDate, 0))
    .lt("starts_at", istToIso(addDays(fromDate, days), 0))
    .order("starts_at")
    .limit(500);
  if (error) throw new Error(`Could not load bookings: ${error.message}`);
  return (data ?? []) as Booking[];
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<{ ok: boolean; reason?: "taken" | "error" }> {
  const { error } = await getSupabase().from("bookings").update({ status }).eq("id", id);
  if (error) return { ok: false, reason: error.code === OVERLAP_ERROR ? "taken" : "error" };
  return { ok: true };
}
