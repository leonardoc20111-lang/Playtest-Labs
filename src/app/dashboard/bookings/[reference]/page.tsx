import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alert, Badge, Card, EmptyState } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import {
  getBookingByReference,
  getPaymentByBookingId,
  getReportByBookingId,
  getReviewByBookingId,
  listAssignments,
} from '@/lib/data/repos';
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatDate,
  formatDateTime,
  formatGBP,
  formatTime,
  paymentStatusLabel,
  paymentStatusTone,
} from '@/lib/format';
import { CancelBookingForm } from '@/components/forms/cancel-booking-form';
import { ReportPaymentForm } from '@/components/forms/report-payment-form';
import { ReviewForm } from '@/components/forms/review-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `Booking ${reference.toUpperCase()}` };
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser('/dashboard/bookings');
  const { reference } = await params;
  const { created } = await searchParams;

  const booking = await getBookingByReference(reference);
  if (!booking || booking.customerId !== user.id) notFound();

  const [payment, report, review, assignments] = await Promise.all([
    getPaymentByBookingId(booking.id),
    getReportByBookingId(booking.id),
    getReviewByBookingId(booking.id),
    listAssignments(booking.id),
  ]);

  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const canReportPayment =
    Boolean(payment) && (payment?.status === 'payment_requested' || payment?.status === 'awaiting_verification');
  const canReview = booking.status === 'completed' && !review;

  const timeline = [
    { label: 'Requested', value: booking.createdAt, done: true },
    { label: 'Accepted', value: booking.acceptedAt, done: Boolean(booking.acceptedAt) },
    { label: 'Testing started', value: booking.startedAt, done: Boolean(booking.startedAt) },
    { label: 'Completed', value: booking.completedAt, done: Boolean(booking.completedAt) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/bookings" className="text-xs font-medium text-slate-500 hover:text-brand-cyan">
          ← Back to bookings
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-white">{booking.gameName}</h1>
          <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>
          {booking.paymentStatus ? (
            <Badge tone={paymentStatusTone[booking.paymentStatus]}>{paymentStatusLabel[booking.paymentStatus]}</Badge>
          ) : null}
        </div>
        <p className="mt-1.5 text-sm text-slate-500">
          Reference <span className="font-mono text-slate-300">{booking.reference}</span> ·{' '}
          {booking.serviceName ?? 'Playtest'} · {formatGBP(booking.pricePence)}
        </p>
      </div>

      {created ? (
        <Alert tone="success">
          Booking received. Keep your reference <span className="font-semibold">{booking.reference}</span> — we
          normally confirm within one working day.
        </Alert>
      ) : null}

      {booking.status === 'cancelled' && booking.cancelledReason ? (
        <Alert tone="warning">Cancelled: {booking.cancelledReason}</Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-white">Booking details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['Game', booking.gameName],
                ['Platform', booking.platform],
                ['Service', booking.serviceName ?? '—'],
                ['Requested slot', `${formatDate(booking.requestedDate)} · ${formatTime(booking.requestedTime)}`],
                ['Contact name', booking.contactName],
                ['Contact email', booking.contactEmail],
                ['Contact phone', booking.contactPhone ?? '—'],
                ['Submitted', formatDateTime(booking.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Game link</p>
                <a
                  href={booking.gameUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 block break-all text-sm text-brand-cyan hover:text-white"
                >
                  {booking.gameUrl}
                </a>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Description</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">{booking.gameDescription}</p>
              </div>
              {booking.additionalInstructions ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Your instructions</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                    {booking.additionalInstructions}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white">Testing report</h2>
            {report && report.status === 'published' ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-200">
                    Report ready · rated {report.overallRating}/10 by {report.testerName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Published {formatDate(report.publishedAt ?? report.updatedAt)}</p>
                </div>
                <Link
                  href={`/dashboard/reports/${report.id}`}
                  className="rounded-xl bg-brand-gradient px-3.5 py-2 text-sm font-semibold text-white"
                >
                  Read report
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {report
                  ? 'Your tester is still finishing the report. It appears here the moment it is published.'
                  : 'No report yet — reports are written after testing is completed.'}
              </p>
            )}
          </Card>

          {canReview ? (
            <Card>
              <h2 className="text-sm font-semibold text-white">Leave a review</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tell other developers how the playtest went. Reviews are moderated before going public.
              </p>
              <div className="mt-4">
                <ReviewForm bookingId={booking.id} defaultName={user.displayName ?? ''} />
              </div>
            </Card>
          ) : null}

          {review ? (
            <Card>
              <h2 className="text-sm font-semibold text-white">Your review</h2>
              <p className="mt-2 text-sm text-slate-300">
                {review.rating}/5 — {review.comment}
              </p>
              <p className="mt-1 text-xs text-slate-500">Status: {review.status}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-white">Progress</h2>
            <ol className="mt-4 space-y-3">
              {timeline.map((step) => (
                <li key={step.label} className="flex gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      step.done ? 'bg-brand-cyan' : 'bg-white/15'
                    }`}
                  />
                  <div>
                    <p className={`text-sm ${step.done ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                    <p className="text-xs text-slate-500">
                      {step.value ? formatDateTime(step.value) : 'Pending'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {assignments.length ? (
              <div className="mt-5 border-t border-white/5 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Testers</p>
                <ul className="mt-2 space-y-1">
                  {assignments.map((assignment) => (
                    <li key={assignment.id} className="text-sm text-slate-300">
                      {assignment.testerName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white">Payment</h2>
            {payment ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Amount</span>
                  <span className="text-sm font-semibold text-white">{formatGBP(payment.amountPence)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Status</span>
                  <Badge tone={paymentStatusTone[payment.status]}>{paymentStatusLabel[payment.status]}</Badge>
                </div>
                {payment.paymentLink ? (
                  <a
                    href={payment.paymentLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block rounded-xl border border-brand-indigo/40 bg-brand-indigo/10 px-3.5 py-2 text-center text-sm font-semibold text-brand-cyan hover:bg-brand-indigo/20"
                  >
                    Open Revolut payment link
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">No payment link yet — we send one with your acceptance.</p>
                )}
                {payment.paymentReference ? (
                  <p className="text-xs text-slate-500">
                    Your reference: <span className="font-mono text-slate-300">{payment.paymentReference}</span>
                  </p>
                ) : null}
                {canReportPayment ? (
                  <div className="border-t border-white/5 pt-4">
                    <ReportPaymentForm
                      bookingId={booking.id}
                      disabled={payment.status === 'awaiting_verification'}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="No payment record yet"
                description="A Revolut payment link is attached once your booking is accepted."
              />
            )}
          </Card>

          {canCancel ? (
            <Card>
              <h2 className="text-sm font-semibold text-white">Cancel booking</h2>
              <div className="mt-3">
                <CancelBookingForm bookingId={booking.id} />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
