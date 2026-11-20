import "server-only";
import type { NewBooking } from "./bookings";
import { getSupabase } from "./supabase";
import { salon, services, stylists, canPerform } from "./salon";
import type { Busy } from "./slots";
import { addDays, isoToIst, istNow, istToIso, weekday } from "./time";

// Sample bookings so the calendar never looks empty to someone trying the demo.
// The daily job wipes future samples (undoing anything demo visitors confirmed or cancelled)
// and lays down a fresh set for the next two weeks around the real bookings.

const SAMPLE_DAYS = 14;

const FIRST = ["Aarav", "Diya", "Kabir", "Myra", "Vihaan", "Anika", "Reyansh", "Saanvi", "Arjun", "Kiara", "Advait", "Ishaan", "Tara", "Rhea", "Dev", "Meera", "Aditi", "Nikhil", "Zara"];
const LAST = ["Malhotra", "Kapoor", "Bhatia", "Chopra", "Sinha", "Arora", "Khanna", "Gill", "Bose", "Iyer", "Mehra", "Sood", "Dutta", "Nair"];
const NOTES = ["First visit", "Prefers a quiet appointment", "Sensitive scalp, ammonia-free please", "Running from office, may be 5 min late", "Bringing reference photos", null, null, null, null, null];

/** Small deterministic random generator, so the same date always gets the same samples. */
function rng(seedText: string) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)];

export async function refreshSampleBookings(nowMs = Date.now()) {
  const db = getSupabase();
  const nowIso = new Date(nowMs).toISOString();
  const now = istNow(nowMs);

  // 1. Housekeeping: remove future samples (they're regenerated below), old samples,
  //    and real demo bookings that ended more than 30 days ago.
  const delFuture = await db.from("bookings").delete({ count: "exact" }).eq("is_sample", true).gte("starts_at", nowIso);
  const delOldSamples = await db
    .from("bookings")
    .delete({ count: "exact" })
    .eq("is_sample", true)
    .lt("ends_at", new Date(nowMs - 2 * 86_400_000).toISOString());
  const delOldReal = await db
    .from("bookings")
    .delete({ count: "exact" })
    .eq("is_sample", false)
    .lt("ends_at", new Date(nowMs - 30 * 86_400_000).toISOString());
  for (const r of [delFuture, delOldSamples, delOldReal]) if (r.error) throw new Error(r.error.message);

  // 2. What's already booked (real bookings, plus today's past samples) so samples fit around it.
  const lastDate = addDays(now.date, SAMPLE_DAYS - 1);
  const { data: existing, error } = await db
    .from("bookings")
    .select("stylist_id, starts_at, ends_at")
    .neq("status", "cancelled")
    .gte("starts_at", istToIso(now.date, 0))
    .lt("starts_at", istToIso(addDays(lastDate, 1), 0));
  if (error) throw new Error(error.message);

  const busy = new Map<string, Busy[]>(); // key: stylist|date
  for (const row of existing ?? []) {
    const s = isoToIst(row.starts_at);
    const e = isoToIst(row.ends_at);
    const key = `${row.stylist_id}|${s.date}`;
    busy.set(key, [...(busy.get(key) ?? []), [s.minutes, e.date === s.date ? e.minutes : 24 * 60]]);
  }

  // 3. Generate.
  const rows: NewBooking[] = [];
  for (let i = 0; i < SAMPLE_DAYS; i++) {
    const date = addDays(now.date, i);
    const wd = weekday(date);
    const weekend = wd === 0 || wd === 6;
    for (const st of stylists) {
      if (st.dayOff === wd) continue;
      const r = rng(`${date}|${st.id}`);
      const target = 2 + Math.floor(r() * 3) + (weekend ? 1 : 0);
      const mine = services.filter((s) => canPerform(st, s));
      const key = `${st.id}|${date}`;
      const taken = [...(busy.get(key) ?? [])];
      const earliest = i === 0 ? now.minutes + salon.leadTimeMinutes : salon.open;

      let placed = 0;
      for (let attempt = 0; attempt < 30 && placed < target; attempt++) {
        const svc = pick(r, mine);
        const slotsInDay = (salon.close - salon.open - svc.duration) / salon.slotStep + 1;
        const start = salon.open + Math.floor(r() * slotsInDay) * salon.slotStep;
        const end = start + svc.duration;
        if (start < earliest) continue;
        if (taken.some(([s, e]) => start < e && s < end)) continue;
        taken.push([start, end]);
        placed++;
        rows.push({
          service_id: svc.id,
          stylist_id: st.id,
          starts_at: istToIso(date, start),
          ends_at: istToIso(date, end),
          customer_name: `${pick(r, FIRST)} ${pick(r, LAST)}`,
          // Clearly fake numbers (+91 00000 xxxxx) so nobody real is ever shown.
          customer_phone: `+9100000${String(Math.floor(r() * 100000)).padStart(5, "0")}`,
          note: pick(r, NOTES),
          status: r() < (i < 2 ? 0.75 : 0.45) ? "confirmed" : "pending",
          is_sample: true,
        });
      }
    }
  }

  // 4. Insert in one go; if a real booking landed in the meantime, fall back to one by one.
  let inserted = 0;
  if (rows.length) {
    const bulk = await db.from("bookings").insert(rows);
    if (!bulk.error) {
      inserted = rows.length;
    } else {
      for (const row of rows) {
        const one = await db.from("bookings").insert(row);
        if (!one.error) inserted++;
      }
    }
  }

  return {
    removedFutureSamples: delFuture.count ?? 0,
    removedOldSamples: delOldSamples.count ?? 0,
    removedOldBookings: delOldReal.count ?? 0,
    insertedSamples: inserted,
  };
}
