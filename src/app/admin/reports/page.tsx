import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listBookings, listReports } from '@/lib/data/repos';
import { formatDateTime, reportStatusTone } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin reports' };

const FILTERS = [
  { key: 'all', label: 'All reports' },
  { key: 'draft', label: 'Drafts' },
  { key: 'published', label: 'Published' },
] as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = params.status === 'draft' || params.status === 'published' ? params.status : undefined;
  const search = params.q?.trim() ?? '';
  const [reports, awaitingReport] = await Promise.all([
    listReports({ status, search: search || undefined }),
    listBookings({ status: 'in_progress', limit: 200 }),
  ]);

  const withReport = new Set(reports.map((report) => report.bookingId));
  const needReport = awaitingReport.filter((booking) => !withReport.has(booking.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Testing reports</h1>
        <p className="mt-1 text-sm text-slate-400">
          Write in-depth reports, keep drafts private, and publish when the customer should see them.
        </p>
      </div>

      <Card className="p-4">
        <form action="/admin/reports" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor="report-q">
              Search reports
            </label>
            <input
              id="report-q"
              name="q"
              defaultValue={search}
              className="field-input"
              placeholder="Game name, customer or booking reference"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="report-status">
              Status
            </label>
            <select id="report-status" name="status" className="field-input" defaultValue={status ?? ''}>
              <option value="">All statuses</option>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
            </select>
          </div>
          <Button type="submit">Apply</Button>
          {status || search ? (
            <Link href="/admin/reports" className="px-2 py-2.5 text-sm text-slate-400 transition hover:text-white">
              Reset
            </Link>
          ) : null}
        </form>
      </Card>

      {needReport.length > 0 ? (
        <Card className="border-amber-400/20 p-5">
          <h2 className="text-sm font-semibold text-white">Tests in progress without a report draft</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {needReport.slice(0, 6).map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/reports/${booking.reference}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 transition hover:border-white/20"
                >
                  <span className="truncate">{booking.gameName}</span>
                  <span className="text-xs font-semibold text-brand-cyan">Write →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Open a booking that is in progress or completed to write its first report."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/reports/${report.bookingReference ?? report.bookingId}`}
                      className="text-sm font-semibold text-white hover:text-brand-cyan"
                    >
                      {report.gameName}
                    </Link>
                    <Badge tone={reportStatusTone[report.status]}>{report.status}</Badge>
                    <Badge tone="bg-brand-violet/15 text-brand-cyan ring-brand-violet/30">{report.overallRating}/10</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {report.customerName ?? 'Customer'} · {report.testerName} · {report.platform} · updated{' '}
                    {formatDateTime(report.updatedAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/reports/${report.bookingReference ?? report.bookingId}`}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                >
                  {report.status === 'draft' ? 'Continue editing →' : 'Open report →'}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={filter.key === 'all' ? '/admin/reports' : `/admin/reports?status=${filter.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              (filter.key === 'all' && !status) || status === filter.key
                ? 'bg-brand-gradient text-white'
                : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
