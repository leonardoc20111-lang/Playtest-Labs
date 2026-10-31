import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState, StatCard } from '@/components/ui';
import { ButtonLink } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { getAdminStats, getRecentActivity, listBookings, listReports } from '@/lib/data/repos';
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatDate,
  formatGBP,
  formatTime,
  relativeTime,
} from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin overview' };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [stats, activity, pending, draftReports] = await Promise.all([
    getAdminStats(),
    getRecentActivity(8),
    listBookings({ status: 'pending', limit: 5 }),
    listReports({ status: 'draft' }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Operations</p>
          <h1 className="font-display text-2xl font-semibold text-white">Overview</h1>
          <p className="mt-1 text-sm text-slate-400">Everything happening across Playtest Labs right now.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/bookings?status=pending" size="sm">
            Review requests
          </ButtonLink>
          <ButtonLink href="/admin/reports" size="sm" variant="secondary">
            Reports
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={stats.totalCustomers} hint="Registered customer accounts" />
        <StatCard label="Total bookings" value={stats.totalBookings} hint={`${stats.pendingBookings} pending review`} />
        <StatCard label="Active tests" value={stats.activeBookings} hint={`${stats.completedBookings} completed`} />
        <StatCard
          label="Revenue received"
          value={formatGBP(stats.revenuePence)}
          hint={`${formatGBP(stats.outstandingPence)} outstanding`}
          accent="text-emerald-300"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting verification" value={stats.awaitingVerification} hint="Customer marked as sent" accent="text-amber-300" />
        <StatCard label="Pending reviews" value={stats.pendingReviews} hint="Awaiting moderation" accent="text-amber-300" />
        <StatCard label="Draft reports" value={draftReports.length} hint="Not visible to customers" />
        <StatCard label="Cancelled" value={stats.cancelledBookings} hint="All time" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Recent activity</h2>
            <Link href="/admin/bookings" className="text-xs font-semibold text-brand-cyan hover:text-white">
              All bookings →
            </Link>
          </div>
          {activity.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No activity yet"
                description="New booking requests will appear here the moment a customer submits one."
                action={<ButtonLink href="/admin/bookings" size="sm" variant="secondary">Open bookings</ButtonLink>}
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {activity.map((item) => (
                <li key={item.reference} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/bookings/${item.reference}`}
                      className="truncate text-sm font-medium text-white hover:text-brand-cyan"
                    >
                      {item.gameName}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.customerName} · {item.reference} · {relativeTime(item.createdAt)}
                    </p>
                  </div>
                  <Badge tone={bookingStatusTone[item.status]}>{bookingStatusLabel[item.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Pending requests</h2>
              <Badge tone="bg-amber-400/10 text-amber-200 ring-amber-400/30">{stats.pendingBookings}</Badge>
            </div>
            {pending.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Nothing waiting — the queue is clear.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pending.map((booking) => (
                  <li key={booking.id}>
                    <Link
                      href={`/admin/bookings/${booking.reference}`}
                      className="block rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition hover:border-white/15"
                    >
                      <p className="text-sm font-medium text-white">{booking.gameName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {booking.serviceName ?? 'Service'} · {formatDate(booking.requestedDate)} {formatTime(booking.requestedTime)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: '/admin/payments', label: 'Verify payments' },
                { href: '/admin/reviews', label: 'Moderate reviews' },
                { href: '/admin/availability', label: 'Manage availability' },
                { href: '/admin/messages', label: 'Contact inbox' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 transition hover:text-white">
                    {link.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
