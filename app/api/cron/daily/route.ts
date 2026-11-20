import { refreshSampleBookings } from "@/lib/samples";
import { isSupabaseConfigured } from "@/lib/supabase";

// Runs once a day on Vercel (see vercel.json). It:
//  - keeps the free Supabase project awake (free projects pause after 7 days without activity),
//  - resets the sample bookings for the next two weeks,
//  - deletes old bookings.
// Vercel sends "Authorization: Bearer <CRON_SECRET>" automatically when CRON_SECRET is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) return Response.json({ error: "Supabase not configured" }, { status: 503 });

  try {
    const result = await refreshSampleBookings();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("Daily job failed:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
