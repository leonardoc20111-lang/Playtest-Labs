import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listBookings } from '@/lib/data/repos';
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatDate,
  formatGBP,
  formatTime,
  paymentStatusLabel,
  paymentStatusTone,
  reportStatusTone,
} from '@/lib/format';
import { BOOKING_STATUSES } from '@/lib/config';
import type { BookingStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin bookings' };

const isStatus = (value: string | undefined): value is BookingStatus =>
  Boolean(value) && (BOOKING_STATUSES as readonly string[]).includes(value as string);

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : undefined;
  const search = params.q?.trim() ?? '';
  const bookings = await listBookings({ status, search: search || undefined, limit: 200 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Bookings</h1>
          <p className="mt-1 text-sm text-slate-400">
            {bookings.length} booking{bookings.length === 1 ? '' : 's'}
            {status ? ` · ${bookingStatusLabel[status]}` : ''}
            {search ? ` · matching “${search}”` : ''}
          </p>
        </div>
      </div>

      <Card className="p-4">
        <form action="/admin/bookings" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor="q">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={search}
              className="field-input"
              placeholder="Reference, game, customer name or email"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="status">
              Status
            </label>
            <select id="status" name="status" className="field-input" defaultValue={status ?? ''}>
              <option value="">All statuses</option>
              {BOOKING_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {bookingStatusLabel[option]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="md">
            Apply filters
          </Button>
          {status || search ? (
            <Link href="/admin/bookings" className="px-2 py-2.5 text-sm text-slate-400 transition hover:text-white">
              Reset
            </Link>
          ) : null}
        </form>
      </Card>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings match"
          description="Try clearing the filters, or wait for the next customer request to arrive."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-4 transition hover:border-white/15">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/bookings/${booking.reference}`}
                      className="font-display text-base font-semibold text-white hover:text-brand-cyan"
                    >
                      {booking.gameName}
                    </Link>
                    <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>
                    {booking.paymentStatus ? (
                      <Badge tone={paymentStatusTone[booking.paymentStatus]}>{paymentStatusLabel[booking.paymentStatus]}</Badge>
                    ) : null}
                    {booking.reportStatus ? (
                      <Badge tone={reportStatusTone[booking.reportStatus]}>
                        Report {booking.reportStatus}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {booking.customerName} · {booking.reference} · {booking.serviceName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {booking.platform} · requested {formatDate(booking.requestedDate)} at {formatTime(booking.requestedTime)} ·{' '}
                    {formatGBP(booking.pricePence)}
                  </p>
                </div>
                <Link
                  href={`/admin/bookings/${booking.reference}`}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                >
                  Manage →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
