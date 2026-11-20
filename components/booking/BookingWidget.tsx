"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { createBooking } from "@/app/booking-actions";
import { normalizeIndianMobile, formatIndianMobile } from "@/lib/phone";
import {
  canPerform,
  categories,
  getService,
  getStylist,
  salon,
  servicesIn,
  stylistsFor,
  weekdayNames,
  type Category,
  type Service,
  type Stylist,
} from "@/lib/salon";
import { dayStatus, slotsForDay, type Busy, type DayStatus, type Slot } from "@/lib/slots";
import { addDays, dateParts, formatDateLong, formatDuration, formatPrice, formatTime, istNow, weekday } from "@/lib/time";

type Step = 1 | 2 | 3 | 4;
type Availability = { stylistId: string; busy: Record<string, Busy[]>; offset: number; fetchedAt: number };
type AvailabilityStatus = "idle" | "loading" | "ready" | "error" | "offline";
type Confirmed = { ref: string; service: Service; stylist: Stylist; date: string; start: number; name: string; phone: string };

const STEP_TITLES: Record<Step, string> = {
  1: "Choose a service",
  2: "Choose your stylist",
  3: "Pick a date and time",
  4: "Your details",
};

// The current time, read only in the browser (the server renders without it), ticking each minute.
function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 20_000);
  return () => clearInterval(id);
}
const readClock = () => Math.floor(Date.now() / 60_000) * 60_000;
const readServerClock = () => null;

export function BookingWidget() {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<Category>("hair");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [chosenDate, setChosenDate] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [details, setDetails] = useState({ name: "", phone: "", note: "", website: "" });
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [isPending, startTransition] = useTransition();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const requestedStylist = useRef<string | null>(null);
  // Bumped on every step change; the effect below moves focus to the new step's heading.
  const [focusTick, setFocusTick] = useState(0);
  const cameFromLink = useRef(false);

  const clock = useSyncExternalStore(subscribeToClock, readClock, readServerClock);

  const service = serviceId ? (getService(serviceId) ?? null) : null;
  const stylist = stylistId ? (getStylist(stylistId) ?? null) : null;
  const preferred = preferredId ? (getStylist(preferredId) ?? null) : null;

  const busyReady = availabilityStatus === "ready" && availability !== null && availability.stylistId === stylistId;
  // Use the server's clock (offset measured when availability loaded) so a wrong phone clock can't mislead.
  const nowMs = clock === null ? null : clock + (availability?.offset ?? 0);
  const today = nowMs === null ? null : istNow(nowMs).date;

  const days = useMemo(() => {
    if (!today || !service || !stylist) return [];
    return Array.from({ length: salon.bookingWindowDays }, (_, i) => {
      const date = addDays(today, i);
      if (!busyReady || nowMs === null) {
        return { date, slots: [] as Slot[], status: (weekday(date) === stylist.dayOff ? "off" : "loading") as DayStatus | "loading" };
      }
      const slots = slotsForDay({ date, service, stylist, busy: availability.busy[date] ?? [], nowMs });
      return { date, slots, status: dayStatus(slots, date, stylist) as DayStatus | "loading" };
    });
  }, [today, service, stylist, busyReady, availability, nowMs]);

  // The day on screen: the one the visitor picked, otherwise the first day with a free time.
  const shownDay = days.find((d) => d.date === chosenDate) ?? days.find((d) => d.status === "open") ?? null;
  const shownDate = shownDay?.date ?? null;

  // After a step change, move keyboard focus to the step's heading and make sure it's on screen.
  // "link" = the visitor came from a Book link elsewhere on the page, so scroll the whole section in.
  useEffect(() => {
    const heading = headingRef.current;
    if (focusTick === 0 || !heading) return;
    const mode = cameFromLink.current ? "link" : "step";
    cameFromLink.current = false;
    heading.focus({ preventScroll: true });
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (mode === "link") {
      document.getElementById("book")?.scrollIntoView({ behavior, block: "start" });
    } else {
      const top = heading.getBoundingClientRect().top;
      if (top < 64 || top > window.innerHeight * 0.6) heading.scrollIntoView({ behavior, block: "start" });
    }
  }, [focusTick]);

  function goTo(next: Step) {
    setFocusTick((t) => t + 1);
    setStep(next);
  }

  async function loadAvailability(id: string, force = false) {
    if (!force && availability?.stylistId === id && Date.now() - availability.fetchedAt < 60_000) {
      setAvailabilityStatus("ready");
      return;
    }
    requestedStylist.current = id;
    setAvailabilityStatus("loading");
    try {
      const res = await fetch(`/api/availability?stylist=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (requestedStylist.current !== id) return; // the visitor has switched stylist since
      if (res.status === 503) {
        setAvailabilityStatus("offline");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { busy: Record<string, Busy[]>; serverNow: number };
      if (requestedStylist.current !== id) return;
      setAvailability({ stylistId: id, busy: json.busy, offset: json.serverNow - Date.now(), fetchedAt: Date.now() });
      setAvailabilityStatus("ready");
    } catch {
      if (requestedStylist.current === id) setAvailabilityStatus("error");
    }
  }

  function chooseStylist(id: string) {
    if (id !== stylistId) {
      setStylistId(id);
      setChosenDate(null);
    }
    setStart(null);
    setNotice(null);
    void loadAvailability(id);
    goTo(3);
  }

  function chooseService(id: string, preferredOverride?: string | null) {
    const next = getService(id);
    if (!next) return;
    setConfirmed(null);
    setCategory(next.category);
    setServiceId(id);
    setStart(null);
    setNotice(null);
    setSubmitError(null);

    const eligible = stylistsFor(next).map((s) => s.id);
    const pref = preferredOverride !== undefined ? preferredOverride : preferredId;
    const pick =
      (pref && eligible.includes(pref) && pref) ||
      (stylistId && eligible.includes(stylistId) && stylistId) ||
      (eligible.length === 1 ? eligible[0] : null);

    if (pick) {
      chooseStylist(pick);
    } else {
      setStylistId(null);
      setChosenDate(null);
      goTo(2);
    }
  }

  // "Book" links elsewhere on the page carry data-book-service / data-book-stylist.
  const onPageClick = useEffectEvent((event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest?.("a[data-book-service], a[data-book-stylist]");
    if (!link) return;
    // We scroll and focus ourselves (a plain #book jump would drop keyboard focus on the page body).
    event.preventDefault();
    cameFromLink.current = true;
    const sId = link.getAttribute("data-book-service");
    const stId = link.getAttribute("data-book-stylist");
    if (sId) {
      chooseService(sId);
      return;
    }
    const st = stId ? getStylist(stId) : undefined;
    if (!st) return;
    setPreferredId(st.id);
    setConfirmed(null);
    if (service && canPerform(st, service)) {
      chooseService(service.id, st.id);
    } else {
      setServiceId(null);
      setStylistId(null);
      setCategory(st.skills[0]);
      goTo(1);
    }
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => onPageClick(e);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  function chooseTime(date: string, minutes: number) {
    setChosenDate(date);
    setStart(minutes);
    setNotice(null);
    setSubmitError(null);
    goTo(4);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service || !stylist || !shownDate || start === null) return;

    const errors: { name?: string; phone?: string } = {};
    if (details.name.trim().length < 2) errors.name = "Please add your name.";
    const phone = normalizeIndianMobile(details.phone);
    if (!phone) errors.phone = "Enter a 10-digit mobile number, for example 98110 12345.";
    setFieldErrors(errors);
    if (errors.name) return nameRef.current?.focus();
    if (errors.phone) return phoneRef.current?.focus();

    setSubmitError(null);
    const booking = { service, stylist, date: shownDate, start };
    startTransition(async () => {
      const result = await createBooking({
        serviceId: service.id,
        stylistId: stylist.id,
        date: shownDate,
        start,
        name: details.name,
        phone: details.phone,
        note: details.note,
        website: details.website,
      });
      startTransition(() => {
        if (result.ok) {
          setFocusTick((t) => t + 1);
          setConfirmed({ ref: result.ref, ...booking, name: details.name.trim(), phone: phone! });
          setStart(null);
          setDetails((d) => ({ ...d, note: "" }));
          void loadAvailability(stylist.id, true);
        } else if (result.code === "taken" || (result.code === "invalid" && result.message.includes("time"))) {
          setNotice(result.message);
          setStart(null);
          void loadAvailability(stylist.id, true);
          goTo(3);
        } else {
          setSubmitError(result.message);
        }
      });
    });
  }

  function bookAnother() {
    setConfirmed(null);
    setServiceId(null);
    setStylistId(null);
    setPreferredId(null);
    setChosenDate(null);
    setStart(null);
    goTo(1);
  }

  if (confirmed) {
    return (
      <div className="border-line bg-paper mt-10 rounded-3xl border p-6 sm:p-10" role="status">
        <div className="bg-sage-soft text-sage flex size-12 items-center justify-center rounded-full" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-6" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 ref={headingRef} tabIndex={-1} className="font-display text-ink mt-5 text-4xl font-medium outline-none">
          You&rsquo;re booked in, {confirmed.name.split(" ")[0]}.
        </h3>
        <p className="text-slate mt-2">
          Reference <strong className="text-ink font-semibold tracking-wide">{confirmed.ref}</strong>
        </p>
        <dl className="border-line mt-6 grid gap-x-8 gap-y-4 border-y py-6 text-sm sm:grid-cols-2">
          <SummaryRow label="Service" value={`${confirmed.service.name} · ${formatDuration(confirmed.service.duration)}`} />
          <SummaryRow label="Stylist" value={confirmed.stylist.name} />
          <SummaryRow label="When" value={`${formatDateLong(confirmed.date)}, ${formatTime(confirmed.start)}`} />
          <SummaryRow label="Price" value={formatPrice(confirmed.service.price, confirmed.service.from)} />
          <SummaryRow label="Mobile" value={formatIndianMobile(confirmed.phone)} />
        </dl>
        <p className="text-slate mt-6 max-w-xl text-sm leading-relaxed">
          Your booking shows as <em>pending</em> until the salon confirms it. Since this is a concept build, nobody will
          call you, but the slot is now taken for everyone else, and the booking appears on the owner dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={bookAnother}
            className="bg-sage hover:bg-sage-dark rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Book another appointment
          </button>
          <a
            href="/owner"
            className="border-line text-ink hover:border-sage rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
          >
            See it on the owner dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="border-line bg-paper min-w-0 rounded-3xl border p-5 sm:p-8">
        <StepIndicator
          step={step}
          canOpen={(s) => s === 1 || (s === 2 && !!service) || (s === 3 && !!stylist) || (s === 4 && start !== null)}
          onOpen={goTo}
        />

        <div className="mt-6 flex items-baseline justify-between gap-4">
          <h3 ref={headingRef} tabIndex={-1} className="font-display text-ink text-3xl font-medium outline-none">
            {STEP_TITLES[step]}
          </h3>
          {step > 1 && (
            <button
              type="button"
              onClick={() => goTo((step - 1) as Step)}
              className="text-slate hover:text-ink shrink-0 text-sm font-semibold"
            >
              ← Back
            </button>
          )}
        </div>

        <CompactSummary service={service} stylist={stylist} date={step === 4 ? shownDate : null} start={step === 4 ? start : null} />

        {notice && (
          <p role="alert" className="bg-lilac-soft text-ink mt-4 rounded-xl px-4 py-3 text-sm">
            {notice}
          </p>
        )}

        <div className="mt-6">
          {step === 1 && (
            <ServiceStep
              category={category}
              onCategory={setCategory}
              selectedId={serviceId}
              preferred={preferred}
              onClearPreferred={() => setPreferredId(null)}
              onChoose={(id) => chooseService(id)}
            />
          )}
          {step === 2 && service && <StylistStep service={service} selectedId={stylistId} onChoose={chooseStylist} />}
          {step === 3 && service && stylist && (
            <DateTimeStep
              service={service}
              stylist={stylist}
              status={availabilityStatus}
              days={days}
              shownDate={shownDate}
              start={start}
              onDate={(d) => {
                setChosenDate(d);
                setStart(null);
              }}
              onTime={chooseTime}
              onRetry={() => void loadAvailability(stylist.id, true)}
            />
          )}
          {step === 4 && service && stylist && shownDate && start !== null && (
            <form onSubmit={submit} noValidate className="grid gap-5">
              <Field label="Your name" error={fieldErrors.name} htmlFor="bk-name">
                <input
                  ref={nameRef}
                  id="bk-name"
                  name="name"
                  autoComplete="name"
                  maxLength={60}
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? "bk-name-error" : undefined}
                  className={inputClass}
                />
              </Field>
              <Field label="Mobile number" error={fieldErrors.phone} htmlFor="bk-phone">
                <div className="relative">
                  <span className="text-slate pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm">+91</span>
                  <input
                    ref={phoneRef}
                    id="bk-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    maxLength={16}
                    placeholder="98110 12345"
                    value={details.phone}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    aria-invalid={!!fieldErrors.phone}
                    aria-describedby={fieldErrors.phone ? "bk-phone-error" : undefined}
                    className={`${inputClass} pl-13`}
                  />
                </div>
              </Field>
              <Field label="Anything we should know? (optional)" htmlFor="bk-note">
                <textarea
                  id="bk-note"
                  name="note"
                  rows={3}
                  maxLength={300}
                  value={details.note}
                  onChange={(e) => setDetails({ ...details, note: e.target.value })}
                  className={`${inputClass} resize-y`}
                />
              </Field>
              {/* Honeypot: hidden from people and screen readers. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    name="website"
                    value={details.website}
                    onChange={(e) => setDetails({ ...details, website: e.target.value })}
                  />
                </label>
              </div>

              <p className="bg-mist text-slate rounded-xl px-4 py-3 text-xs leading-relaxed">
                Concept build: feel free to use a made-up name. The demo owner dashboard is public, though names and
                numbers are partly hidden there.
              </p>

              {submitError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="bg-sage hover:bg-sage-dark rounded-full px-6 py-4 text-base font-semibold text-white transition-colors disabled:opacity-70"
              >
                {isPending ? "Booking…" : `Confirm booking · ${formatTime(start)}`}
              </button>
            </form>
          )}
        </div>
      </div>

      <aside aria-label="Your appointment" className="border-line bg-paper sticky top-24 hidden rounded-3xl border p-6 lg:block">
        <p className="text-slate text-xs font-semibold tracking-[0.2em] uppercase">Your appointment</p>
        <dl className="mt-4 grid gap-4 text-sm">
          <SummaryRow
            label="Service"
            value={service ? `${service.name}` : "Not chosen yet"}
            sub={service ? `${formatDuration(service.duration)} · ${formatPrice(service.price, service.from)}` : undefined}
            muted={!service}
          />
          <SummaryRow label="Stylist" value={stylist ? stylist.name : "Not chosen yet"} sub={stylist?.role} muted={!stylist} />
          <SummaryRow
            label="When"
            value={start !== null && shownDate ? formatDateLong(shownDate) : "Not chosen yet"}
            sub={start !== null && service ? `${formatTime(start)} – ${formatTime(start + service.duration)}` : undefined}
            muted={start === null}
          />
        </dl>
        <div className="dusk-rule mt-6" />
        <p className="text-slate mt-4 text-xs leading-relaxed">
          Free cancellation up to 4 hours before. Pay at the salon by card or UPI.
        </p>
      </aside>
    </div>
  );
}

const inputClass =
  "border-line bg-white text-ink placeholder:text-slate/60 focus:border-sage w-full rounded-xl border px-4 py-3 text-base outline-none transition-colors aria-[invalid=true]:border-red-700";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-ink mb-2 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value, sub, muted }: { label: string; value: string; sub?: string; muted?: boolean }) {
  return (
    <div>
      <dt className="text-slate text-xs">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${muted ? "text-slate/70 font-medium" : "text-ink"}`}>{value}</dd>
      {sub && <dd className="text-slate text-xs">{sub}</dd>}
    </div>
  );
}

function StepIndicator({
  step,
  canOpen,
  onOpen,
}: {
  step: Step;
  canOpen: (s: Step) => boolean;
  onOpen: (s: Step) => void;
}) {
  return (
    <ol className="flex gap-1.5" aria-label="Booking steps">
      {([1, 2, 3, 4] as Step[]).map((s) => {
        const current = s === step;
        const reachable = canOpen(s) && !current;
        const bar = <span className={`block h-1 rounded-full ${s <= step ? "bg-sage" : "bg-line"}`} aria-hidden="true" />;
        const label = (
          <span className={`mt-2 hidden text-xs font-medium sm:block ${current ? "text-ink" : "text-slate"}`}>
            {STEP_TITLES[s].replace("Choose ", "").replace("Pick a ", "").replace(/^\w/, (c) => c.toUpperCase())}
          </span>
        );
        return (
          <li key={s} className="flex-1" aria-current={current ? "step" : undefined}>
            {reachable ? (
              <button type="button" onClick={() => onOpen(s)} className="block w-full text-left" aria-label={`Go to step ${s}: ${STEP_TITLES[s]}`}>
                {bar}
                {label}
              </button>
            ) : (
              <span className="block">
                <span className="sr-only">{`Step ${s}: ${STEP_TITLES[s]}${current ? " (current)" : ""}`}</span>
                {bar}
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CompactSummary({
  service,
  stylist,
  date,
  start,
}: {
  service: Service | null;
  stylist: Stylist | null;
  date: string | null;
  start: number | null;
}) {
  if (!service) return null;
  const parts = [`${service.name} · ${formatDuration(service.duration)} · ${formatPrice(service.price, service.from)}`];
  if (stylist) parts.push(`with ${stylist.name.split(" ")[0]}`);
  if (date && start !== null) parts.push(`${formatDateLong(date)}, ${formatTime(start)}`);
  return <p className="text-slate mt-2 text-sm lg:hidden">{parts.join(" · ")}</p>;
}

function ChoiceButton({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-colors ${
        selected ? "border-sage bg-sage-soft" : "border-line hover:border-sage/60 bg-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ServiceStep({
  category,
  onCategory,
  selectedId,
  preferred,
  onClearPreferred,
  onChoose,
}: {
  category: Category;
  onCategory: (c: Category) => void;
  selectedId: string | null;
  preferred: Stylist | null;
  onClearPreferred: () => void;
  onChoose: (id: string) => void;
}) {
  const visible = (c: Category) => servicesIn(c).filter((s) => !preferred || canPerform(preferred, s));
  const shownCategories = categories.filter((c) => visible(c.id).length > 0);
  const activeCategory = shownCategories.some((c) => c.id === category) ? category : shownCategories[0].id;

  return (
    <div>
      {preferred && (
        <p className="bg-lilac-soft text-ink mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm">
          <span>
            Showing services <strong className="font-semibold">{preferred.name}</strong> offers.
          </span>
          <button type="button" onClick={onClearPreferred} className="text-sage font-semibold underline-offset-4 hover:underline">
            Show all
          </button>
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
        {shownCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={c.id === activeCategory}
            onClick={() => onCategory(c.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              c.id === activeCategory ? "border-ink bg-ink text-mist" : "border-line text-slate hover:text-ink bg-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {visible(activeCategory).map((s) => (
          <li key={s.id}>
            <ChoiceButton selected={s.id === selectedId} onClick={() => onChoose(s.id)} className="flex items-start justify-between gap-3">
              <span>
                <span className="text-ink block font-semibold">{s.name}</span>
                <span className="text-slate mt-0.5 block text-xs">{formatDuration(s.duration)}</span>
              </span>
              <span className="text-ink shrink-0 text-sm font-semibold">{formatPrice(s.price, s.from)}</span>
            </ChoiceButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StylistStep({
  service,
  selectedId,
  onChoose,
}: {
  service: Service;
  selectedId: string | null;
  onChoose: (id: string) => void;
}) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {stylistsFor(service).map((st) => (
        <li key={st.id}>
          <ChoiceButton selected={st.id === selectedId} onClick={() => onChoose(st.id)} className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="font-display bg-lilac-soft text-ink flex h-12 w-10 shrink-0 items-end justify-center rounded-t-full pb-1.5 text-lg font-medium"
            >
              {st.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <span>
              <span className="text-ink block font-semibold">{st.name}</span>
              <span className="text-slate block text-xs">
                {st.role} · off {weekdayNames[st.dayOff]}s
              </span>
            </span>
          </ChoiceButton>
        </li>
      ))}
    </ul>
  );
}

const dayLabel: Record<string, string> = { off: "Day off", full: "Full", closed: "Closed" };

function DateTimeStep({
  service,
  stylist,
  status,
  days,
  shownDate,
  start,
  onDate,
  onTime,
  onRetry,
}: {
  service: Service;
  stylist: Stylist;
  status: AvailabilityStatus;
  days: { date: string; slots: Slot[]; status: DayStatus | "loading" }[];
  shownDate: string | null;
  start: number | null;
  onDate: (date: string) => void;
  onTime: (date: string, start: number) => void;
  onRetry: () => void;
}) {
  if (status === "offline") {
    return (
      <p className="bg-mist text-slate rounded-xl px-4 py-4 text-sm">
        Online booking is switched off right now (the bookings database isn&rsquo;t connected). Please call{" "}
        {salon.phoneDisplay}.
      </p>
    );
  }
  if (status === "error") {
    return (
      <div className="bg-mist text-slate rounded-xl px-4 py-4 text-sm">
        We couldn&rsquo;t load {stylist.name.split(" ")[0]}&rsquo;s diary.{" "}
        <button type="button" onClick={onRetry} className="text-sage font-semibold underline underline-offset-4">
          Try again
        </button>
      </div>
    );
  }

  const loading = status !== "ready" || days.length === 0;
  const day = days.find((d) => d.date === shownDate);
  const groups = day
    ? [
        { label: "Morning", slots: day.slots.filter((s) => s.start < 12 * 60) },
        { label: "Afternoon", slots: day.slots.filter((s) => s.start >= 12 * 60 && s.start < 17 * 60) },
        { label: "Evening", slots: day.slots.filter((s) => s.start >= 17 * 60) },
      ].filter((g) => g.slots.length > 0)
    : [];
  const freeCount = day?.slots.filter((s) => s.available).length ?? 0;

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {loading ? `Checking ${stylist.name}'s availability` : `Availability loaded`}
      </p>
      <div className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8" role="group" aria-label="Date">
        {(days.length ? days : Array.from({ length: 10 }, (_, i) => ({ date: String(i), slots: [], status: "loading" as const }))).map((d) => {
          if (d.status === "loading" && !/\d{4}-/.test(d.date)) {
            return <span key={d.date} className="bg-line/60 h-[4.75rem] w-16 shrink-0 animate-pulse rounded-2xl" aria-hidden="true" />;
          }
          const p = dateParts(d.date);
          const selected = d.date === shownDate;
          const disabled = d.status !== "open";
          const label = dayLabel[d.status] ?? "";
          return (
            <button
              key={d.date}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${formatDateLong(d.date)}${label ? `, ${label.toLowerCase()}` : ""}`}
              onClick={() => onDate(d.date)}
              className={`flex h-[4.75rem] w-16 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border text-center transition-colors ${
                selected
                  ? "border-ink bg-ink text-mist"
                  : disabled
                    ? "border-line bg-mist text-slate/60"
                    : "border-line hover:border-sage bg-white text-ink"
              }`}
            >
              <span className="text-[0.7rem] font-semibold tracking-wide uppercase">{p.weekdayShort}</span>
              <span className="font-display text-2xl leading-tight font-medium">{p.day}</span>
              <span className="text-[0.65rem] leading-none">{label || p.month}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 min-h-40">
        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="bg-line/60 h-11 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !day ? (
          <p className="text-slate text-sm">
            {stylist.name.split(" ")[0]} is fully booked for the next {salon.bookingWindowDays} days for this service. Try
            another stylist.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-ink font-semibold">{formatDateLong(day.date)}</p>
              <p className="text-slate text-xs">
                {freeCount} of {day.slots.length} times free · each fits the full {formatDuration(service.duration)}
              </p>
            </div>
            <div className="mt-4 grid gap-5">
              {groups.map((g) => (
                <fieldset key={g.label}>
                  <legend className="text-slate mb-2 text-xs font-semibold tracking-[0.15em] uppercase">{g.label}</legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {g.slots.map((s) => {
                      const selected = s.start === start && day.date === shownDate;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          disabled={!s.available}
                          aria-pressed={selected}
                          aria-label={`${formatTime(s.start)}${s.available ? "" : ", unavailable"}`}
                          onClick={() => onTime(day.date, s.start)}
                          className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
                            selected
                              ? "border-sage bg-sage text-white"
                              : s.available
                                ? "border-line hover:border-sage text-ink bg-white"
                                : "border-line/70 bg-mist text-slate/55 cursor-not-allowed line-through"
                          }`}
                        >
                          {formatTime(s.start)}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="text-slate mt-5 flex items-center gap-2 text-xs">
              <span className="border-line/70 bg-mist text-slate/55 rounded-md border px-1.5 py-0.5 line-through">10 am</span>
              Already booked, or too close to the next booking to fit this service.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
