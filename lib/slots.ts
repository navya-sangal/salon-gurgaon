// Works out which start times can be booked. Used in the browser (to draw the time grid)
// and again on the server (to check a booking before saving it), so both always agree.

import { salon, type Service, type Stylist } from "./salon";
import { daysBetween, istNow, weekday } from "./time";

/** A booked stretch of a stylist's day, in minutes after midnight IST: [start, end). */
export type Busy = [number, number];

export type Slot = { start: number; available: boolean };

export type DayStatus = "open" | "off" | "full" | "closed";

function overlaps(start: number, end: number, busy: Busy[]): boolean {
  return busy.some(([s, e]) => start < e && s < end);
}

/** The window of dates people can choose from: today … today + bookingWindowDays - 1. */
export function isDateInWindow(date: string, today: string): boolean {
  const diff = daysBetween(today, date);
  return diff >= 0 && diff < salon.bookingWindowDays;
}

/**
 * Every start time for this service on this day, marked available or not.
 * Times already gone (or less than the lead time away) are left out entirely.
 * Times that clash with an existing booking stay in the list as unavailable.
 */
export function slotsForDay(opts: {
  date: string;
  service: Service;
  stylist: Stylist;
  busy: Busy[];
  nowMs: number;
}): Slot[] {
  const { date, service, stylist, busy, nowMs } = opts;
  const now = istNow(nowMs);
  if (!isDateInWindow(date, now.date)) return [];
  if (weekday(date) === stylist.dayOff) return [];

  const earliest = date === now.date ? now.minutes + salon.leadTimeMinutes : -1;
  const slots: Slot[] = [];
  for (let start = salon.open; start + service.duration <= salon.close; start += salon.slotStep) {
    if (start < earliest) continue;
    slots.push({ start, available: !overlaps(start, start + service.duration, busy) });
  }
  return slots;
}

export function dayStatus(slots: Slot[], date: string, stylist: Stylist): DayStatus {
  if (weekday(date) === stylist.dayOff) return "off";
  if (slots.length === 0) return "closed";
  return slots.some((s) => s.available) ? "open" : "full";
}

/** Server-side check of a single requested start time. */
export function isBookable(opts: {
  date: string;
  start: number;
  service: Service;
  stylist: Stylist;
  busy: Busy[];
  nowMs: number;
}): boolean {
  const slot = slotsForDay(opts).find((s) => s.start === opts.start);
  return Boolean(slot?.available);
}
