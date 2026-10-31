import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState } from '@/components/ui';
import { ButtonLink } from '@/components/controls';
import { requireUser } from '@/lib/auth';
import { listBookings } from '@/lib/data/repos';
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatDate,
  formatGBP,
  formatTime,
  paymentStatusLabel,
  paymentStatusTone,
} from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My bookings' };

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser('/dashboard/bookings');
  const { filter = 'all' } = await searchParams;
  const bookings = await listBookings({ customerId: user.id, limit: 200 });

  const visible = bookings.filter((booking) => {
    if (filter === 'active') return ['pending', 'accepted', 'in_progress'].includes(booking.status);
    if (filter === 'completed') return booking.status === 'completed';
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">My bookings</h1>
          <p className="mt-1 text-sm text-slate-400">{bookings.length} booking{bookings.length === 1 ? '' : 's'} in total.</p>
        </div>
        <ButtonLink href="/book" size="sm">New booking</ButtonLink>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <Link
              key={item.key}
              href={item.key === 'all' ? '/dashboard/bookings' : `/dashboard/bookings?filter=${item.key}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-brand-gradient text-white'
                  : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No bookings here"
          description="Bookings you submit appear in this list with their reference, status and payment progress."
          action={<ButtonLink href="/book" size="sm">Book a playtest</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((booking) => (
            <Card key={booking.id} className="surface-hover">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/bookings/${booking.reference}`}
                      className="font-display text-base font-semibold text-white hover:text-brand-cyan"
                    >
                      {booking.gameName}
                    </Link>
                    <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>
                    {booking.paymentStatus ? (
                      <Badge tone={paymentStatusTone[booking.paymentStatus]}>{paymentStatusLabel[booking.paymentStatus]}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    <span className="font-mono text-slate-400">{booking.reference}</span> · {booking.serviceName ?? 'Playtest'} ·{' '}
                    {booking.platform}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Requested {formatDate(booking.requestedDate)} at {formatTime(booking.requestedTime)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatGBP(booking.pricePence)}</p>
                    {booking.reportStatus ? (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Report {booking.reportStatus === 'published' ? 'published' : 'in draft'}
                      </p>
                    ) : null}
                  </div>
                  <ButtonLink href={`/dashboard/bookings/${booking.reference}`} variant="ghost" size="sm">
                    Open
                  </ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
