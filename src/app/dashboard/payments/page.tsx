import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, Badge, Card, EmptyState } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getPaymentByBookingId, listBookings } from '@/lib/data/repos';
import { formatDate, formatGBP, paymentStatusLabel, paymentStatusTone } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Payments' };

export default async function CustomerPaymentsPage() {
  const user = await requireUser('/dashboard/payments');
  const bookings = await listBookings({ customerId: user.id, limit: 200 });
  const rows = await Promise.all(
    bookings.map(async (booking) => ({ booking, payment: await getPaymentByBookingId(booking.id) })),
  );
  const withPayment = rows.filter((row) => row.payment);

  const paidPence = withPayment.reduce(
    (total, row) => (row.payment?.status === 'paid' ? total + row.payment.amountPence : total),
    0,
  );
  const outstandingPence = withPayment.reduce(
    (total, row) =>
      row.payment && row.payment.status !== 'paid' && row.payment.status !== 'refunded'
        ? total + row.payment.amountPence
        : total,
    0,
  );
  const awaiting = withPayment.filter((row) => row.payment?.status === 'awaiting_verification').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Payments</h1>
        <p className="mt-1 text-sm text-slate-400">
          Revolut payments are confirmed manually by our team — a status only turns Paid after verification.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Paid</p>
          <p className="mt-2 font-display text-2xl font-semibold text-emerald-300">{formatGBP(paidPence)}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Outstanding</p>
          <p className="mt-2 font-display text-2xl font-semibold text-amber-300">{formatGBP(outstandingPence)}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Awaiting verification</p>
          <p className="mt-2 font-display text-2xl font-semibold text-white">{awaiting}</p>
        </Card>
      </div>

      {withPayment.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Payment records appear here once we accept your booking and send a Revolut link."
        />
      ) : (
        <Card className="p-0 sm:p-0">
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {withPayment.map(({ booking, payment }) => (
                  <tr key={booking.id}>
                    <td>
                      <Link href={`/dashboard/bookings/${booking.reference}`} className="font-medium text-white hover:text-brand-cyan">
                        {booking.gameName}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{booking.reference}</p>
                    </td>
                    <td>{formatGBP(payment!.amountPence)}</td>
                    <td>
                      <Badge tone={paymentStatusTone[payment!.status]}>{paymentStatusLabel[payment!.status]}</Badge>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{payment!.paymentReference ?? '—'}</td>
                    <td className="text-xs text-slate-500">{formatDate(payment!.updatedAt)}</td>
                    <td>
                      <Link href={`/dashboard/bookings/${booking.reference}`} className="text-xs font-semibold text-brand-cyan hover:text-white">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Alert tone="info">
        Never send payment to any account other than the Revolut link shown on your booking page. Contact us if
        anything looks wrong.
      </Alert>
    </div>
  );
}
