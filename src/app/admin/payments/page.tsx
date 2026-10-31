import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState, StatCard } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listPayments } from '@/lib/data/repos';
import { PaymentForm } from '@/components/forms/admin-forms';
import { formatDateTime, formatGBP, paymentStatusLabel, paymentStatusTone } from '@/lib/format';
import { PAYMENT_STATUSES } from '@/lib/config';
import type { PaymentStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin payments' };

const isStatus = (value: string | undefined): value is PaymentStatus =>
  Boolean(value) && (PAYMENT_STATUSES as readonly string[]).includes(value as string);

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : undefined;
  const search = params.q?.trim() ?? '';
  const payments = await listPayments({ status, search: search || undefined });

  const sum = (predicate: (value: PaymentStatus) => boolean) =>
    payments.filter((payment) => predicate(payment.status)).reduce((total, payment) => total + payment.amountPence, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Payments</h1>
        <p className="mt-1 text-sm text-slate-400">
          Revolut payments are tracked manually. A payment only becomes paid when you verify it against your Revolut
          transaction history.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Verified paid" value={formatGBP(sum((s) => s === 'paid'))} accent="text-emerald-300" />
        <StatCard label="Awaiting verification" value={formatGBP(sum((s) => s === 'awaiting_verification'))} accent="text-amber-300" />
        <StatCard label="Refunded" value={formatGBP(sum((s) => s === 'refunded'))} accent="text-slate-300" />
      </div>

      <Card className="p-4">
        <form action="/admin/payments" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor="payment-q">
              Search
            </label>
            <input
              id="payment-q"
              name="q"
              defaultValue={search}
              className="field-input"
              placeholder="Reference, customer, email or Revolut reference"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="payment-status">
              Status
            </label>
            <select id="payment-status" name="status" className="field-input" defaultValue={status ?? ''}>
              <option value="">All statuses</option>
              {PAYMENT_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {paymentStatusLabel[option]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Apply</Button>
          {status || search ? (
            <Link href="/admin/payments" className="px-2 py-2.5 text-sm text-slate-400 transition hover:text-white">
              Reset
            </Link>
          ) : null}
        </form>
      </Card>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments match"
          description="Payment records are created automatically when a booking is submitted or accepted."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/bookings/${payment.bookingReference}`}
                      className="text-sm font-semibold text-white hover:text-brand-cyan"
                    >
                      {payment.gameName}
                    </Link>
                    <Badge tone={paymentStatusTone[payment.status]}>{paymentStatusLabel[payment.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {payment.customerName} · {payment.customerEmail} · {payment.bookingReference} ·{' '}
                    {formatGBP(payment.amountPence)} · created {formatDateTime(payment.createdAt)}
                  </p>
                  {payment.paymentReference ? (
                    <p className="mt-1 text-xs text-slate-400">Revolut ref: {payment.paymentReference}</p>
                  ) : null}
                  {payment.paidAt ? (
                    <p className="mt-1 text-xs text-emerald-300">Verified {formatDateTime(payment.verifiedAt)}</p>
                  ) : null}
                  {payment.refundReference ? (
                    <p className="mt-1 text-xs text-slate-400">Refund ref: {payment.refundReference}</p>
                  ) : null}
                </div>
              </div>
              <details className="mt-3 border-t border-white/5 pt-3">
                <summary className="cursor-pointer text-xs font-semibold text-brand-cyan">Update payment</summary>
                <div className="mt-3">
                  <PaymentForm bookingId={payment.bookingId} payment={payment} />
                </div>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
