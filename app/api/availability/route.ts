import type { NextRequest } from "next/server";
import { getBusyByDay } from "@/lib/bookings";
import { getStylist, salon } from "@/lib/salon";
import { isSupabaseConfigured } from "@/lib/supabase";
import { addDays, istNow } from "@/lib/time";

// GET /api/availability?stylist=meher
// Returns the stylist's booked stretches for the whole booking window, grouped by date.
// Only times: no names, phone numbers or ids.
export async function GET(request: NextRequest) {
  const stylist = getStylist(request.nextUrl.searchParams.get("stylist") ?? "");
  if (!stylist) return Response.json({ error: "Unknown stylist" }, { status: 400 });
  if (!isSupabaseConfigured()) return Response.json({ error: "offline" }, { status: 503 });

  const today = istNow().date;
  try {
    const busy = await getBusyByDay(stylist.id, today, addDays(today, salon.bookingWindowDays - 1));
    return Response.json({ busy, serverNow: Date.now() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
