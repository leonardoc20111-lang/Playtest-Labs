# Playtest Labs

**Your Game. Our Testing. Better Experiences.**

A full-stack game QA platform: public marketing site, booking system, customer dashboard,
administrator dashboard, structured test reports, moderated reviews and manual Revolut
payment tracking.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Actions, React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS with a custom dark charcoal / blue-purple design system |
| Validation | Zod on every server action |
| Auth | Cookie sessions, scrypt password hashing, server-verified roles |
| Data | SQL layer behind a driver abstraction: **Supabase Postgres** or bundled **SQLite** |

### Why a driver abstraction?

The platform targets Supabase project `yeotvkovscgtmsfdwsqv` (EU West / London). When the
Supabase credentials are present in the environment the app runs on Postgres; when they are
not, the identical repository/queries run against an embedded SQLite database so every
workflow stays fully functional. Only `src/lib/data/driver.ts` changes — no page or action
contains backend-specific code.

- `BACKEND_MODE=supabase` → `pg` pool against `SUPABASE_DB_URL`
- `BACKEND_MODE=local` → `better-sqlite3` at `DATABASE_PATH` (default `./data/playtest.db`)

---

## Getting started

```bash
npm install
cp .env.example .env.local      # optional: defaults are fine for local work
npm run dev                     # http://localhost:3000
```

The first request seeds services, an admin account, two tester accounts, demo bookings,
reports, reviews, availability and notifications.

### Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@playtestlabs.gg` | `Playtest-Admin-Dev1!` (or `ADMIN_PASSWORD`) |
| Tester | `alex@playtestlabs.gg` | `PlaytestDemo123!` (or `DEMO_PASSWORD`) |
| Tester | `priya@playtestlabs.gg` | `PlaytestDemo123!` |
| Customer | `sam@indiestudio.dev` | `PlaytestDemo123!` |
| Customer | `jordan@pixelworks.io` | `PlaytestDemo123!` |

> Change `ADMIN_PASSWORD` and `DEMO_PASSWORD` before exposing the platform publicly.
> Demo passwords are only used when the database is first seeded.

---

## Connecting the existing Supabase project

The project `yeotvkovscgtmsfdwsqv` could not be reached from the build environment (no
project URL, anon key, database URL or service-role key were supplied), so the app currently
runs on the SQLite driver. To switch it to Supabase:

1. **Run the migration.** `supabase/migrations/0001_playtest_labs.sql` creates all tables,
   foreign keys, indexes, update triggers, the double-booking unique index, the
   verified-payment guard, the report-publication guard and Row Level Security policies.

   ```bash
   supabase link --project-ref yeotvkovscgtmsfdwsqv
   supabase db push
   # or paste the file into the Supabase SQL editor
   ```

2. **Set the environment variables** (`.env.local` locally, project env vars when deployed):

   ```bash
   SUPABASE_URL=https://yeotvkovscgtmsfdwsqv.supabase.co
   SUPABASE_ANON_KEY=...            # public anon key
   SUPABASE_DB_URL=postgresql://postgres:...@db.yeotvkovscgtmsfdwsqv.supabase.co:5432/postgres
   SUPABASE_SERVICE_ROLE_KEY=...    # server-only, never in client code
   ```

   `BACKEND_MODE` flips to `supabase` automatically once URL, anon key and DB URL are all set.
   Check the active backend at `GET /api/health`.

3. **Create the seed data / first admin.** Registration via the app creates `profiles` rows
   with role `customer` (enforced by a trigger). Promote the first administrator in SQL:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

4. **Auth note.** In Supabase mode the tables and RLS protect all data at the database level;
   the application also verifies the role server-side on every admin page and action
   (`requireAdmin()` / the `admin()` guard inside `src/app/actions/admin.ts`). Never rely on
   the UI alone.

### Security model

- Passwords: scrypt with per-user salt; hashes never leave the server.
- Sessions: HttpOnly, SameSite=Lax cookies with a database-backed expiry (30 days).
- Authorisation is re-checked server-side in every admin page and action; a customer
  hitting `/admin/*` is redirected, and every customer-scoped query is filtered by
  `customer_id`.
- RLS policies mirror those rules in Postgres, including:
  - customers may only read/update their own bookings, payments, notifications and reports;
  - published reports are the only reports a customer can read;
  - `is_admin()` is a `SECURITY DEFINER` helper, so no policy trusts a client-supplied role;
  - payments can only reach `paid` with a payment reference and an admin actor;
  - reports can only be published by an admin (`enforce_report_publishing` trigger);
  - customers cannot self-escalate booking status (`prevent_booking_status_escalation`).
- The service-role key is only read by server code (`src/lib/config.ts`) and is never
  imported into a client component.

---

## Domain model

| Table | Purpose |
| --- | --- |
| `profiles` | customers, testers and admins (1:1 with `auth.users` in Supabase) |
| `services` | four editable products (£7 / £12 / £18 / £6) |
| `bookings` | booking requests, unique reference, five statuses, slot guard |
| `payments` | manual Revolut tracking with five statuses |
| `feedback_reports` | 12-section reports, draft → published by an admin only |
| `reviews` | 1–5 star reviews, moderation required before public display |
| `tester_assignments` | testers assigned to bookings |
| `availability` | schedulable slots with capacity |
| `notifications` | in-app notifications for customers and admins |
| `contact_messages` | public contact-form enquiries |
| `sessions`, `password_resets`, `app_meta` | local auth driver support tables |

Booking references look like `PL-7F3K9Q`. Statuses: `pending → accepted → in_progress →
completed`, or `cancelled`. Payments: `unpaid → payment_requested → awaiting_verification →
paid`, or `refunded`.

---

## Scripts

```bash
npm run dev        # development server on 0.0.0.0:3000
npm run build      # production build (standalone output)
npm start          # production server on 0.0.0.0:3000
npm run typecheck  # tsc --noEmit
npm run e2e        # Playwright regression suite against a built server
```

## Deployment

The `Dockerfile` builds the Next.js standalone server, exposes port `3000`, binds to
`0.0.0.0` and persists the SQLite database on the `/data` volume (`DATABASE_PATH=/data/playtest.db`).
`GET /api/health` reports the active backend and database reachability.

When Supabase environment variables are supplied, `/data` is no longer used for data and the
container becomes stateless.

## Known limitations

- **Supabase credentials are absent**, so the deployed instance runs on the SQLite driver.
  The migration and driver are ready; supplying the three variables switches it over.
- **No email provider** is configured. Password-reset links are generated server-side and
  surfaced to the administrator instead of being emailed; wire an SMTP/Resend/Supabase Auth
  email provider to deliver them automatically.
- Revolut is manual tracking only by design — no credentials are invented and nothing is
  marked paid without an administrator verifying a reference.
