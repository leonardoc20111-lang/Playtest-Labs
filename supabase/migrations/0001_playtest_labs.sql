-- Playtest Labs — full Supabase/Postgres schema
-- Mirrors src/lib/data/schema.ts (the SQLite driver) and adds Row Level Security.
-- Apply with:  supabase db push    (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Profile row for the current JWT. SECURITY DEFINER so RLS policies on
-- profiles can read it without recursing into profiles' own policy.
create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin', false);
$$;

create or replace function public.is_tester()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() in ('admin', 'tester'), false);
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  password_hash text,
  full_name text not null default '',
  display_name text,
  company text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'tester')),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

-- New auth user -> profile row (role always customer; admins are promoted by SQL/admin UI).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. sessions / password_resets (only used by the local SQLite auth driver)
-- ---------------------------------------------------------------------------

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_user on public.sessions (user_id);

create table if not exists public.password_resets (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. services
-- ---------------------------------------------------------------------------

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  price_pence integer not null check (price_pence >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_services_active on public.services (active, sort_order);

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. bookings
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id),
  game_name text not null,
  game_url text not null,
  platform text not null check (platform in ('PC', 'PlayStation', 'Xbox', 'Mobile', 'Roblox')),
  game_description text not null,
  requested_date date not null,
  requested_time time not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  additional_instructions text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  price_pence integer not null check (price_pence >= 0),
  internal_notes text,
  cancelled_reason text,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_customer on public.bookings (customer_id);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_slot on public.bookings (requested_date, requested_time);
create index if not exists idx_bookings_reference on public.bookings (reference);

-- Double-booking guard: one live booking per slot.
create unique index if not exists uq_bookings_live_slot
  on public.bookings (requested_date, requested_time)
  where status in ('pending', 'accepted', 'in_progress');

drop trigger if exists trg_bookings_updated on public.bookings;
create trigger trg_bookings_updated before update on public.bookings
  for each row execute function public.touch_updated_at();

-- Customers may not escalate their own booking status.
create or replace function public.prevent_booking_status_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
     and new.status is distinct from old.status
     and new.status not in ('pending', 'cancelled') then
    raise exception 'Only an administrator can set booking status %', new.status
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bookings_status_guard on public.bookings;
create trigger trg_bookings_status_guard before update on public.bookings
  for each row execute function public.prevent_booking_status_escalation();

-- ---------------------------------------------------------------------------
-- 5. payments  (manual Revolut tracking)
-- ---------------------------------------------------------------------------

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  amount_pence integer not null check (amount_pence >= 0),
  currency text not null default 'GBP',
  status text not null default 'unpaid'
    check (status in ('unpaid', 'payment_requested', 'awaiting_verification', 'paid', 'refunded')),
  provider text not null default 'revolut_manual',
  payment_link text,
  payment_reference text,
  customer_note text,
  admin_note text,
  paid_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id),
  refund_reference text,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_status on public.payments (status);
create index if not exists idx_payments_customer on public.payments (customer_id);

drop trigger if exists trg_payments_updated on public.payments;
create trigger trg_payments_updated before update on public.payments
  for each row execute function public.touch_updated_at();

-- A payment can only become 'paid' through a verified confirmation with a
-- reference recorded and verified_by set. Never auto-marked paid.
create or replace function public.enforce_verified_payments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' and not public.is_admin() then
    raise exception 'Only an administrator can verify a payment' using errcode = '42501';
  end if;
  if new.status = 'paid'
     and (new.payment_reference is null or length(trim(new.payment_reference)) = 0) then
    raise exception 'A payment reference is required before marking a payment paid'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payments_verified on public.payments;
create trigger trg_payments_verified before insert or update on public.payments
  for each row execute function public.enforce_verified_payments();

-- ---------------------------------------------------------------------------
-- 6. feedback_reports  (12 sections, admin-only publish)
-- ---------------------------------------------------------------------------

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  game_name text not null,
  tester_name text not null,
  platform text not null,
  testing_date date not null,
  overall_impression text not null default '',
  gameplay_experience text not null default '',
  game_mechanics text not null default '',
  bugs_discovered text not null default '',
  performance_observations text not null default '',
  user_experience text not null default '',
  suggested_improvements text not null default '',
  additional_comments text,
  overall_rating integer not null default 0 check (overall_rating between 0 and 10),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reports_customer on public.feedback_reports (customer_id);
create index if not exists idx_reports_status on public.feedback_reports (status);

drop trigger if exists trg_reports_updated on public.feedback_reports;
create trigger trg_reports_updated before update on public.feedback_reports
  for each row execute function public.touch_updated_at();

-- Only admins may flip a report from draft to published (or edit a published one).
create or replace function public.enforce_report_publishing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.status = 'published' then
    raise exception 'Only an administrator can publish a report' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (old.status = 'published' or new.status <> old.status) then
    raise exception 'Only an administrator can change report publication' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reports_publish_guard on public.feedback_reports;
create trigger trg_reports_publish_guard before insert or update on public.feedback_reports
  for each row execute function public.enforce_report_publishing();

-- ---------------------------------------------------------------------------
-- 7. reviews  (1-5 stars, moderated)
-- ---------------------------------------------------------------------------

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  display_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderated_by uuid references public.profiles (id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_status on public.reviews (status);

-- ---------------------------------------------------------------------------
-- 8. tester_assignments
-- ---------------------------------------------------------------------------

create table if not exists public.tester_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  tester_id uuid not null references public.profiles (id) on delete cascade,
  tester_name text not null,
  assigned_by uuid references public.profiles (id),
  assigned_at timestamptz not null default now(),
  unique (booking_id, tester_id)
);
create index if not exists idx_assignments_booking on public.tester_assignments (booking_id);
create index if not exists idx_assignments_tester on public.tester_assignments (tester_id);

-- ---------------------------------------------------------------------------
-- 9. availability
-- ---------------------------------------------------------------------------

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 1 check (capacity > 0),
  is_open boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, start_time),
  check (end_time > start_time)
);

drop trigger if exists trg_availability_updated on public.availability;
create trigger trg_availability_updated before update on public.availability
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 10. notifications / 11. contact_messages / 12. app_meta
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications (user_id, read_at);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'handled')),
  created_at timestamptz not null default now()
);
create index if not exists idx_contact_status on public.contact_messages (status, created_at desc);

create table if not exists public.app_meta (
  key text primary key,
  value text not null
);

-- ---------------------------------------------------------------------------
-- Seed services (£7 / £12 / £18 / £6)
-- ---------------------------------------------------------------------------

insert into public.services (slug, name, tagline, price_pence, duration_minutes, description, features, sort_order)
values
  ('standard-playtest', 'Standard Playtest', 'A focused first pass on your game', 700, 20,
   '20 minutes of hands-on gameplay testing with general feedback and basic bug identification.',
   '["20 minutes of gameplay testing","General gameplay feedback","Basic bug identification","Written feedback report"]'::jsonb, 1),
  ('extended-playtest', 'Extended Playtest', 'Deeper coverage and clearer priorities', 1200, 40,
   '40 minutes of testing with a detailed gameplay evaluation, bug identification and improvement suggestions.',
   '["40 minutes of testing","Detailed gameplay evaluation","Bug identification","Improvement suggestions","Detailed written feedback"]'::jsonb, 2),
  ('comprehensive-review', 'Comprehensive Review', 'The full QA experience', 1800, 60,
   '60 minutes of testing covering mechanics, progression and user experience with a structured report.',
   '["60 minutes of testing","Detailed gameplay evaluation","Mechanics and progression analysis","User experience assessment","Structured report"]'::jsonb, 3),
  ('update-retest', 'Update Retest', 'Confirm your fixes actually fixed it', 600, 20,
   '20 minutes re-testing a previously reviewed build to confirm fixes and catch regressions.',
   '["20 minutes of testing","Check previously reported issues","Identify new problems","Updated feedback"]'::jsonb, 4)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.password_resets enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.reviews enable row level security;
alter table public.tester_assignments enable row level security;
alter table public.availability enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.app_meta enable row level security;

-- profiles: own row read/update; admins manage all; testers see colleagues.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_tester());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()))
  );

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert with check (public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete using (public.is_admin());

-- sessions / password_resets: private to the owner, admins may read.
drop policy if exists sessions_owner on public.sessions;
create policy sessions_owner on public.sessions
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists password_resets_owner on public.password_resets;
create policy password_resets_owner on public.password_resets
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- services: public read of active rows, admin full control.
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select using (active or public.is_admin());

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings: customers read/write their own; testers read assigned; admins all.
drop policy if exists bookings_customer_read on public.bookings;
create policy bookings_customer_read on public.bookings
  for select using (
    customer_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.tester_assignments ta
      where ta.booking_id = bookings.id and ta.tester_id = auth.uid()
    )
  );

drop policy if exists bookings_customer_insert on public.bookings;
create policy bookings_customer_insert on public.bookings
  for insert with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists bookings_customer_update on public.bookings;
create policy bookings_customer_update on public.bookings
  for update using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists bookings_admin_delete on public.bookings;
create policy bookings_admin_delete on public.bookings
  for delete using (public.is_admin());

-- payments: customer read-only on their own; admin writes.
drop policy if exists payments_customer_read on public.payments;
create policy payments_customer_read on public.payments
  for select using (customer_id = auth.uid() or public.is_admin());

drop policy if exists payments_admin_write on public.payments;
create policy payments_admin_write on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- A customer may attach a payment reference / note to their own payment, but
-- the status trigger blocks 'paid' and the column list is limited by the app.
drop policy if exists payments_customer_note on public.payments;
create policy payments_customer_note on public.payments
  for update using (
    customer_id = auth.uid() and status in ('unpaid', 'payment_requested')
  )
  with check (
    customer_id = auth.uid() and status in ('awaiting_verification', 'payment_requested', 'unpaid')
  );

-- feedback_reports: published rows visible to their customer; admin all.
drop policy if exists reports_customer_read on public.feedback_reports;
create policy reports_customer_read on public.feedback_reports
  for select using (
    public.is_admin()
    or (customer_id = auth.uid() and status = 'published')
  );

drop policy if exists reports_admin_write on public.feedback_reports;
create policy reports_admin_write on public.feedback_reports
  for all using (public.is_admin()) with check (public.is_admin());

-- reviews: approved reviews are public, owners see their own, admin moderates.
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (status = 'approved' or customer_id = auth.uid() or public.is_admin());

drop policy if exists reviews_customer_insert on public.reviews;
create policy reviews_customer_insert on public.reviews
  for insert with check (
    customer_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.customer_id = auth.uid()
        and b.status = 'completed'
    )
  );

drop policy if exists reviews_admin_write on public.reviews;
create policy reviews_admin_write on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews
  for delete using (public.is_admin());

-- tester_assignments: admin manages, testers see their own assignments.
drop policy if exists assignments_read on public.tester_assignments;
create policy assignments_read on public.tester_assignments
  for select using (tester_id = auth.uid() or public.is_admin());

drop policy if exists assignments_admin_write on public.tester_assignments;
create policy assignments_admin_write on public.tester_assignments
  for all using (public.is_admin()) with check (public.is_admin());

-- availability: open slots are public, admin manages.
drop policy if exists availability_public_read on public.availability;
create policy availability_public_read on public.availability
  for select using (is_open or public.is_admin());

drop policy if exists availability_admin_write on public.availability;
create policy availability_admin_write on public.availability
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications: owner only; admins may broadcast.
drop policy if exists notifications_owner on public.notifications;
create policy notifications_owner on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert on public.notifications
  for insert with check (public.is_admin() or user_id = auth.uid());

-- contact_messages: anyone may submit, only admins may read/manage.
drop policy if exists contact_public_insert on public.contact_messages;
create policy contact_public_insert on public.contact_messages
  for insert with check (true);

drop policy if exists contact_admin_read on public.contact_messages;
create policy contact_admin_read on public.contact_messages
  for select using (public.is_admin());

drop policy if exists contact_admin_update on public.contact_messages;
create policy contact_admin_update on public.contact_messages
  for update using (public.is_admin()) with check (public.is_admin());

-- app_meta: server/admin only.
drop policy if exists app_meta_admin on public.app_meta;
create policy app_meta_admin on public.app_meta
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket for report attachments (optional, future use)
-- ---------------------------------------------------------------------------

-- insert into storage.buckets (id, name, public)
-- values ('reports', 'reports', false)
-- on conflict (id) do nothing;
