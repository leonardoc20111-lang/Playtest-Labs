import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState, StatCard } from '@/components/ui';
import { ButtonLink } from '@/components/controls';
import { requireUser } from '@/lib/auth';
import { getPaymentByBookingId, listBookings, listNotifications, listReports } from '@/lib/data/repos';
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatDate,
  formatGBP,
  formatTime,
  paymentStatusLabel,
  paymentStatusTone,
  relativeTime,
} from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; denied?: string }>;
}) {
  const user = await requireUser('/dashboard');
  const { welcome, denied } = await searchParams;
  const [bookings, reports, notifications] = await Promise.all([
    listBookings({ customerId: user.id, limit: 100 }),
    listReports({ customerId: user.id }),
    listNotifications(user.id, 6),
  ]);

  const active = bookings.filter((booking) => ['pending', 'accepted', 'in_progress'].includes(booking.status));
  const history = bookings.filter((booking) => ['completed', 'cancelled'].includes(booking.status));
  const publishedReports = reports.filter((report) => report.status === 'published');

  const payments = await Promise.all(bookings.slice(0, 12).map((booking) => getPaymentByBookingId(booking.id)));
  const outstandingPence = payments.reduce(
    (total, payment) => (payment && payment.status !== 'paid' && payment.status !== 'refunded' ? total + payment.amountPence : total),
    0,
  );
  const paidPence = payments.reduce(
    (total, payment) => (payment && payment.status === 'paid' ? total + payment.amountPence : total),
    0,
  );

  const firstName = user.fullName.split(' ')[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Customer dashboard</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Track your playtests, download feedback and keep an eye on payments.
        </p>
      </div>

      {welcome ? (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Your account is ready. Book your first playtest to get started.
        </div>
      ) : null}
      {denied === 'admin' ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Administrator pages require an administrator account.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active bookings" value={active.length} hint="Pending, accepted or in progress" accent="text-brand-cyan" />
        <StatCard label="Completed playtests" value={history.filter((booking) => booking.status === 'completed').length} hint="Lifetime" />
        <StatCard label="Published reports" value={publishedReports.length} hint="Ready to read" />
        <StatCard label="Outstanding" value={formatGBP(outstandingPence)} hint={`${formatGBP(paidPence)} paid to date`} accent="text-amber-300" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Active bookings</h2>
            <Link href="/dashboard/bookings" className="text-xs font-medium text-brand-cyan hover:text-white">
              View all
            </Link>
          </div>
          {active.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No active bookings"
                description="Choose a package and send us your game — most requests are accepted within one working day."
                action={<ButtonLink href="/book" size="sm">Book a playtest</ButtonLink>}
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {active.map((booking) => (
                <li key={booking.id} className="py-3">
                  <Link href={`/dashboard/bookings/${booking.reference}`} className="group flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white group-hover:text-brand-cyan">{booking.gameName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {booking.reference} · {formatDate(booking.requestedDate)} at {formatTime(booking.requestedTime)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {booking.paymentStatus ? (
                        <Badge tone={paymentStatusTone[booking.paymentStatus]}>{paymentStatusLabel[booking.paymentStatus]}</Badge>
                      ) : null}
                      <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-white">Recent notifications</h2>
            {notifications.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Nothing yet — updates about your bookings appear here.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {notifications.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <Link href={item.link ?? '/dashboard/notifications'} className="block">
                      <p className={`text-sm ${item.readAt ? 'text-slate-400' : 'font-medium text-white'}`}>{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{relativeTime(item.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white">Your reports</h2>
            {publishedReports.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Reports appear here as soon as your tester publishes them.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {publishedReports.slice(0, 3).map((report) => (
                  <li key={report.id}>
                    <Link href={`/dashboard/reports/${report.id}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-200">{report.gameName}</span>
                      <span className="shrink-0 font-semibold text-brand-cyan">{report.overallRating}/10</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
