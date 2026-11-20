-- Saanjh Salon: bookings table.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again; it only creates what is missing.

-- Needed for the "no overlapping bookings" rule below.
create extension if not exists btree_gist;

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  service_id     text not null,
  stylist_id     text not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  customer_name  text not null check (char_length(customer_name) between 2 and 60),
  customer_phone text not null check (customer_phone ~ '^\+91[0-9]{10}$'),
  note           text check (note is null or char_length(note) <= 300),
  status         text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  is_sample      boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at),

  -- The database itself refuses two active bookings for the same stylist that overlap in time,
  -- even if two people press "Confirm" in the same second. Cancelled bookings don't count,
  -- so cancelling frees the slot.
  constraint bookings_no_overlap exclude using gist (
    stylist_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);

create index if not exists bookings_starts_at_idx on public.bookings (starts_at);
create index if not exists bookings_phone_idx on public.bookings (customer_phone) where not is_sample;

-- Lock the table down. Row Level Security is on with no policies, so the public
-- (anon / publishable) key can't read or write anything. Only the site's server code,
-- using the secret key, can.
alter table public.bookings enable row level security;
revoke all on public.bookings from anon, authenticated;
grant select, insert, update, delete on public.bookings to service_role;
