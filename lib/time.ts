// Date helpers that always work in India Standard Time (UTC+5:30, no daylight saving),
// whatever time zone the server or the visitor's phone is set to.
// Dates are "YYYY-MM-DD" strings; times of day are minutes after midnight.

export const IST_OFFSET_MINUTES = 330;
const MINUTE = 60_000;
const DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

function ymdFromShifted(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** The current date and minute of the day in India. */
export function istNow(nowMs: number = Date.now()): { date: string; minutes: number } {
  const shifted = new Date(nowMs + IST_OFFSET_MINUTES * MINUTE);
  return { date: ymdFromShifted(shifted), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return ymdFromShifted(new Date(Date.UTC(y, m - 1, d) + days * DAY));
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** An IST date + minute of day as a UTC instant (ISO string), for storing in the database. */
export function istToIso(date: string, minutes: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + (minutes - IST_OFFSET_MINUTES) * MINUTE).toISOString();
}

/** A stored instant back to an IST date and minute of day. */
export function isoToIst(iso: string): { date: string; minutes: number } {
  return istNow(new Date(iso).getTime());
}

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${pad(m)} ${suffix}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dateParts(date: string) {
  const [, m, d] = date.split("-").map(Number);
  const wd = weekday(date);
  return { day: d, month: MONTHS[m - 1], weekdayShort: DAYS[wd], weekdayLong: DAYS_LONG[wd] };
}

/** "Saturday, 22 Nov" */
export function formatDateLong(date: string): string {
  const p = dateParts(date);
  return `${p.weekdayLong}, ${p.day} ${p.month}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatPrice(rupees: number, from = false): string {
  return `${from ? "from " : ""}₹${rupees.toLocaleString("en-IN")}`;
}
