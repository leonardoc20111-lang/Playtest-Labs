import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Card } from '@/components/ui';
import { requireAdmin } from '@/lib/auth';
import { getBookingByReference, getReportByBookingId, listAssignments } from '@/lib/data/repos';
import { ReportForm } from '@/components/forms/admin-forms';
import { publishReportAction, unpublishReportAction } from '@/app/actions/admin';
import { Button } from '@/components/controls';
import { bookingStatusLabel, bookingStatusTone, formatDateTime, reportStatusTone } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Report editor' };

export default async function AdminReportEditorPage({ params }: { params: Promise<{ reference: string }> }) {
  await requireAdmin();
  const { reference } = await params;
  const booking = await getBookingByReference(reference);
  if (!booking) notFound();

  const [report, assignments] = await Promise.all([getReportByBookingId(booking.id), listAssignments(booking.id)]);
  const defaultTesterName = assignments[0]?.testerName ?? 'Playtest Labs QA';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/reports" className="text-xs font-semibold text-slate-500 transition hover:text-white">
          ← All reports
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-white">{booking.gameName}</h1>
          <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>
          {report ? <Badge tone={reportStatusTone[report.status]}>{report.status}</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {booking.reference} · {booking.customerName} ·{' '}
          <Link href={`/admin/bookings/${booking.reference}`} className="text-brand-cyan hover:text-white">
            open booking
          </Link>
        </p>
      </div>

      {report ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-400">
            {report.status === 'published'
              ? `Published ${formatDateTime(report.publishedAt)} — visible to the customer.`
              : 'Draft saved. Customers cannot see drafts until you publish.'}
          </p>
          <div className="flex gap-2">
            {report.status === 'published' ? (
              <form action={unpublishReportAction}>
                <input type="hidden" name="reportId" value={report.id} />
                <Button type="submit" variant="secondary" size="sm">
                  Unpublish
                </Button>
              </form>
            ) : (
              <form action={publishReportAction}>
                <input type="hidden" name="reportId" value={report.id} />
                <Button type="submit" size="sm">
                  Publish now
                </Button>
              </form>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <ReportForm booking={booking} report={report} defaultTesterName={defaultTesterName} platform={booking.platform} />
      </Card>
    </div>
  );
}
