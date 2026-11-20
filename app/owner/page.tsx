import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { listBookings, type Booking } from "@/lib/bookings";
import { DEMO_PASSWORD, getSession, isOwnerLoginConfigured, type OwnerRole } from "@/lib/owner-session";
import { formatIndianMobile } from "@/lib/phone";
import { getService, getStylist } from "@/lib/salon";
import { isSupabaseConfigured } from "@/lib/supabase";
import { addDays, formatDateLong, formatPrice, formatTime, isoToIst, istNow } from "@/lib/time";
import { logout, updateStatus } from "./actions";
import { LoginForms, SubmitButton } from "./forms";

export const metadata: Metadata = {
  title: "Owner dashboard · Saanjh Salon (concept build)",
  robots: { index: false, follow: false },
};

const DAYS_SHOWN = 31;

export default function OwnerPage(props: PageProps<"/owner">) {
  return (
    <div className="bg-mist min-h-dvh">
      <header className="bg-ink text-mist">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-medium">Saanjh</span>
            <span className="text-haze text-[0.65rem] font-semibold tracking-[0.25em] uppercase">Owner</span>
          </Link>
          <Link href="/" className="text-haze hover:text-mist text-sm font-semibold">
            ← Back to site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Suspense fallback={<p className="text-slate">Loading…</p>}>
          <OwnerContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function OwnerContent({ searchParams }: Pick<PageProps<"/owner">, "searchParams">) {
  // Always render this at request time: it checks the login's expiry and today's date against the clock.
  await connection();
  const session = await getSession();
  if (!session) {
    return (
      <>
        <h1 className="font-display text-ink text-4xl font-medium sm:text-5xl">Owner dashboard</h1>
        <p className="text-slate mt-3 mb-8 max-w-xl">Today&rsquo;s and upcoming bookings, with confirm and cancel.</p>
        {isOwnerLoginConfigured() ? (
          <LoginForms demoPassword={DEMO_PASSWORD} />
        ) : (
          <p className="bg-paper border-line text-slate rounded-2xl border p-6 text-sm">
            Login isn&rsquo;t set up on this server yet: add OWNER_SESSION_SECRET (and OWNER_PASSWORD) to the environment.
          </p>
        )}
      </>
    );
  }

  const { show } = await searchParams;
  const showCancelled = show === "all";
  const now = istNow();

  if (!isSupabaseConfigured()) {
    return (
      <Shell role={session.role} today={now.date}>
        <p className="bg-paper border-line text-slate rounded-2xl border p-6 text-sm">
          The bookings database isn&rsquo;t connected yet (SUPABASE_URL / SUPABASE_SECRET_KEY are missing).
        </p>
      </Shell>
    );
  }

  let all: Booking[];
  try {
    all = await listBookings(now.date, DAYS_SHOWN);
  } catch (err) {
    console.error(err);
    return (
      <Shell role={session.role} today={now.date}>
        <p className="bg-paper border-line text-slate rounded-2xl border p-6 text-sm">
          Couldn&rsquo;t load bookings just now. Refresh the page to try again.
        </p>
      </Shell>
    );
  }

  const active = all.filter((b) => b.status !== "cancelled");
  const cancelledCount = all.length - active.length;
  const visible = showCancelled ? all : active;

  const byDate = new Map<string, Booking[]>();
  for (const b of visible) {
    const d = isoToIst(b.starts_at).date;
    byDate.set(d, [...(byDate.get(d) ?? []), b]);
  }
  const todays = byDate.get(now.date) ?? [];
  const upcomingDates = [...byDate.keys()].filter((d) => d !== now.date).sort();

  const todayActive = active.filter((b) => isoToIst(b.starts_at).date === now.date);
  const weekEnd = addDays(now.date, 7);
  const stats = [
    { label: "Today", value: String(todayActive.length) },
    { label: "Awaiting confirmation", value: String(active.filter((b) => b.status === "pending").length) },
    { label: "Next 7 days", value: String(active.filter((b) => isoToIst(b.starts_at).date < weekEnd).length) },
    {
      label: "Expected today",
      value: formatPrice(todayActive.reduce((sum, b) => sum + (getService(b.service_id)?.price ?? 0), 0)),
    },
  ];

  return (
    <Shell role={session.role} today={now.date}>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-line bg-paper rounded-2xl border p-4">
            <dt className="text-slate text-xs">{s.label}</dt>
            <dd className="font-display text-ink mt-1 text-3xl font-medium">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-slate">
          Showing the next {DAYS_SHOWN} days{showCancelled ? ", including cancelled" : ""}.
        </p>
        <a href={showCancelled ? "/owner" : "/owner?show=all"} className="text-sage font-semibold underline-offset-4 hover:underline">
          {showCancelled ? "Hide cancelled" : `Show cancelled (${cancelledCount})`}
        </a>
      </div>

      <DaySection title={`Today · ${formatDateLong(now.date)}`} bookings={todays} role={session.role} nowMinutes={now.minutes} isToday />

      {upcomingDates.length === 0 ? (
        <p className="text-slate mt-10">No upcoming bookings yet.</p>
      ) : (
        upcomingDates.map((d) => <DaySection key={d} title={formatDateLong(d)} bookings={byDate.get(d)!} role={session.role} />)
      )}
    </Shell>
  );
}

function Shell({ role, today, children }: { role: OwnerRole; today: string; children: ReactNode }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-4xl font-medium sm:text-5xl">Bookings</h1>
          <p className="text-slate mt-2 text-sm">
            {formatDateLong(today)} · signed in as{" "}
            <strong className="text-ink font-semibold">{role === "demo" ? "demo visitor" : "owner"}</strong>
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="border-line text-ink hover:border-ink rounded-full border px-4 py-2 text-sm font-semibold">
            Log out
          </button>
        </form>
      </div>
      {role === "demo" && (
        <p className="bg-lilac-soft text-ink mt-6 rounded-2xl px-5 py-4 text-sm leading-relaxed">
          <strong className="font-semibold">Demo dashboard.</strong> Go ahead and confirm or cancel: sample bookings
          reset every morning. Bookings made by real visitors to this demo are shown with their names and numbers
          partly hidden.
        </p>
      )}
      <div className="mt-8">{children}</div>
    </>
  );
}

function maskName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const firstMasked = first.length <= 2 ? first : `${first.slice(0, 2)}${"•".repeat(Math.min(first.length - 2, 4))}`;
  return rest.length ? `${firstMasked} ${rest[rest.length - 1][0]}.` : firstMasked;
}

function maskPhone(phone: string): string {
  const d = phone.replace(/^\+91/, "");
  return `+91 ${d.slice(0, 2)}••• •••${d.slice(8)}`;
}

const statusStyle: Record<Booking["status"], string> = {
  pending: "bg-lilac-soft text-ink",
  confirmed: "bg-sage-soft text-sage-dark",
  cancelled: "bg-line text-slate",
};

function DaySection({
  title,
  bookings,
  role,
  isToday = false,
  nowMinutes = 0,
}: {
  title: string;
  bookings: Booking[];
  role: OwnerRole;
  isToday?: boolean;
  nowMinutes?: number;
}) {
  return (
    <section className="mt-10" aria-label={title}>
      <h2 className="text-ink border-line border-b pb-3 text-sm font-semibold tracking-[0.12em] uppercase">
        {title} <span className="text-slate font-medium normal-case tracking-normal">· {bookings.length}</span>
      </h2>
      {bookings.length === 0 ? (
        <p className="text-slate py-5 text-sm">{isToday ? "Nothing booked for today." : "No bookings."}</p>
      ) : (
        <ul className="divide-line divide-y">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} role={role} past={isToday && isoToIst(b.ends_at).minutes <= nowMinutes} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingRow({ booking: b, role, past }: { booking: Booking; role: OwnerRole; past: boolean }) {
  const service = getService(b.service_id);
  const stylist = getStylist(b.stylist_id);
  const start = isoToIst(b.starts_at).minutes;
  const end = isoToIst(b.ends_at).minutes;
  const masked = role === "demo" && !b.is_sample;
  const name = masked ? maskName(b.customer_name) : b.customer_name;
  const phone = masked ? maskPhone(b.customer_phone) : formatIndianMobile(b.customer_phone);
  const cancelled = b.status === "cancelled";

  return (
    <li className={`grid gap-3 py-5 sm:grid-cols-[7.5rem_1fr_auto] sm:items-start ${past || cancelled ? "opacity-60" : ""}`}>
      <p className="text-ink font-semibold">
        {formatTime(start)}
        <span className="text-slate block text-xs font-medium">until {formatTime(end)}</span>
      </p>
      <div className="min-w-0">
        <p className="text-ink font-semibold">
          {service?.name ?? b.service_id}
          {service && <span className="text-slate font-medium"> · {formatPrice(service.price, service.from)}</span>}
        </p>
        <p className="text-slate mt-0.5 text-sm">
          with {stylist?.name ?? b.stylist_id} · {name} ·{" "}
          {masked || b.is_sample ? (
            phone
          ) : (
            <a href={`tel:${b.customer_phone}`} className="text-sage font-medium underline-offset-4 hover:underline">
              {phone}
            </a>
          )}
        </p>
        {b.note && (
          <p className="text-slate mt-1 text-sm italic">{masked ? "Note hidden in the demo" : `“${b.note}”`}</p>
        )}
        <p className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className={`rounded-full px-2.5 py-0.5 capitalize ${statusStyle[b.status]}`}>{b.status}</span>
          {b.is_sample && <span className="border-line text-slate rounded-full border px-2.5 py-0.5">Sample</span>}
          {!b.is_sample && <span className="text-sage-dark bg-sage-soft/60 rounded-full px-2.5 py-0.5">Booked online</span>}
        </p>
      </div>
      {!cancelled && (
        <div className="flex gap-2 sm:justify-end">
          {b.status === "pending" && (
            <form action={updateStatus}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value="confirmed" />
              <SubmitButton className="bg-sage hover:bg-sage-dark rounded-full px-4 py-2 text-sm font-semibold text-white">
                Confirm
              </SubmitButton>
            </form>
          )}
          <form action={updateStatus}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="status" value="cancelled" />
            <SubmitButton className="border-line text-ink hover:border-ink rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              Cancel
            </SubmitButton>
          </form>
        </div>
      )}
    </li>
  );
}
