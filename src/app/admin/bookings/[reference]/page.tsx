import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Button, ButtonLink } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import {
  getBookingByReference,
  getPaymentByBookingId,
  getProfileById,
  getReportByBookingId,
  getServiceById,
  listAssignments,
  listTesters,
} from '@/lib/data/repos';
import { acceptBookingAction, assignTesterAction, unassignTesterAction } from '@/app/actions/admin';
import { BookingNotesForm, BookingStatusForm, EditBookingForm, PaymentForm, RejectBookingForm } from '@/components/forms/admin-forms';
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatDate,
  formatDateTime,
  formatGBP,
  formatTime,
  paymentStatusLabel,
  paymentStatusTone,
  reportStatusTone,
} from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Booking detail' };

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  await requireAdmin();
  const { reference } = await params;
  const booking = await getBookingByReference(reference);
  if (!booking) notFound();

  const [service, customer, payment, report, testers, assignments] = await Promise.all([
    getServiceById(booking.serviceId),
    getProfileById(booking.customerId),
    getPaymentByBookingId(booking.id),
    getReportByBookingId(booking.id),
    listTesters(),
    listAssignments(booking.id),
  ]);

  const assignedIds = new Set(assignments.map((assignment) => assignment.testerId));
  const availableTesters = testers.filter((tester) => !assignedIds.has(tester.id));
  const isOpen = booking.status === 'pending';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/bookings" className="text-xs font-semibold text-slate-500 transition hover:text-white">
          ← All bookings
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-white">{booking.gameName}</h1>
          <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>
          {booking.paymentStatus ? (
            <Badge tone={paymentStatusTone[booking.paymentStatus]}>{paymentStatusLabel[booking.paymentStatus]}</Badge>
          ) : null}
          {booking.reportStatus ? (
            <Badge tone={reportStatusTone[booking.reportStatus]}>Report {booking.reportStatus}</Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {booking.reference} · {service?.name ?? 'Service'} · {formatGBP(booking.pricePence)} · submitted{' '}
          {formatDateTime(booking.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Booking request</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Service', value: service?.name ?? '—' },
                { label: 'Price', value: formatGBP(booking.pricePence) },
                { label: 'Platform', value: booking.platform },
                { label: 'Requested slot', value: `${formatDate(booking.requestedDate)} · ${formatTime(booking.requestedTime)}` },
                { label: 'Contact name', value: booking.contactName },
                { label: 'Contact email', value: booking.contactEmail },
                { label: 'Contact phone', value: booking.contactPhone ?? '—' },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</dt>
                  <dd className="mt-1 text-sm text-slate-200">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 space-y-4 border-t border-white/5 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Game link</p>
                <a
                  href={booking.gameUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-sm text-brand-cyan hover:text-white"
                >
                  {booking.gameUrl}
                </a>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Description</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">{booking.gameDescription}</p>
              </div>
              {booking.additionalInstructions ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Customer instructions</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                    {booking.additionalInstructions}
                  </p>
                </div>
              ) : null}
              {booking.cancelledReason ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cancellation reason</p>
                  <p className="mt-1 text-sm text-rose-200">{booking.cancelledReason}</p>
                </div>
              ) : null}
            </div>
          </Card>

          {isOpen ? (
            <Card className="border-amber-400/20 p-5">
              <h2 className="text-sm font-semibold text-white">Decision required</h2>
              <p className="mt-1 text-sm text-slate-400">
                Accepting requests payment and notifies the customer. Rejecting cancels the booking and frees the slot.
              </p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <form action={acceptBookingAction}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <Button type="submit" size="sm">
                    Accept &amp; request payment
                  </Button>
                </form>
                <RejectBookingForm bookingId={booking.id} />
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Status</h2>
            <div className="mt-4">
              <BookingStatusForm bookingId={booking.id} status={booking.status} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Edit booking details</h2>
            <div className="mt-4">
              <EditBookingForm booking={booking} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Testing report</h2>
              {report ? <Badge tone={reportStatusTone[report.status]}>Report {report.status}</Badge> : null}
            </div>
            {report ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-400">
                  Rating {report.overallRating}/10 · updated {formatDateTime(report.updatedAt)}
                </p>
                <ButtonLink href={`/admin/reports/${booking.reference}`} size="sm" variant="secondary">
                  Open report
                </ButtonLink>
              </div>
            ) : (
              <EmptyState
                title="No report yet"
                description="Create the structured 12-section report once testing is under way. Drafts stay private until published."
                action={
                  <ButtonLink href={`/admin/reports/${booking.reference}`} size="sm">
                    Write report
                  </ButtonLink>
                }
              />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Customer</h2>
            {customer ? (
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-slate-200">{customer.fullName}</p>
                <p className="text-slate-400">{customer.email}</p>
                {customer.company ? <p className="text-slate-500">{customer.company}</p> : null}
                <Link
                  href={`/admin/customers?q=${encodeURIComponent(customer.email)}`}
                  className="mt-2 inline-block text-xs font-semibold text-brand-cyan hover:text-white"
                >
                  View customer history →
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Customer account not found.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Assigned testers</h2>
            {assignments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No testers assigned yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {assignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <span className="text-sm text-slate-200">{assignment.testerName}</span>
                    <form action={unassignTesterAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="testerId" value={assignment.testerId} />
                      <button type="submit" className="text-xs font-semibold text-rose-300 transition hover:text-rose-100">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            {availableTesters.length > 0 ? (
              <form action={assignTesterAction} className="mt-4 space-y-2">
                <input type="hidden" name="bookingId" value={booking.id} />
                <label className="field-label" htmlFor="testerId">
                  Assign a tester
                </label>
                <select id="testerId" name="testerId" className="field-input" required>
                  {availableTesters.map((tester) => (
                    <option key={tester.id} value={tester.id}>
                      {tester.fullName}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="secondary">
                  Assign tester
                </Button>
              </form>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Every tester is assigned. Create more tester accounts in{' '}
                <Link href="/admin/testers" className="text-brand-cyan hover:text-white">
                  Testers
                </Link>
                .
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Internal notes</h2>
            <div className="mt-3">
              <BookingNotesForm bookingId={booking.id} notes={booking.internalNotes} />
            </div>
          </Card>

          {payment ? (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Payment</h2>
                <Badge tone={paymentStatusTone[payment.status]}>{paymentStatusLabel[payment.status]}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {formatGBP(payment.amountPence)} · {payment.currency} · Revolut (manual)
              </p>
              {payment.customerNote ? (
                <p className="mt-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                  Customer: {payment.customerNote}
                </p>
              ) : null}
              <div className="mt-4">
                <PaymentForm bookingId={booking.id} payment={payment} />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
