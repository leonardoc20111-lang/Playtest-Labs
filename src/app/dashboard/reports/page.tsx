import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { listReports } from '@/lib/data/repos';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Reports' };

export default async function CustomerReportsPage() {
  const user = await requireUser('/dashboard/reports');
  const reports = await listReports({ customerId: user.id });
  const published = reports.filter((report) => report.status === 'published');
  const drafts = reports.filter((report) => report.status === 'draft');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Testing reports</h1>
        <p className="mt-1 text-sm text-slate-400">
          Reports stay private until a tester publishes them. {published.length} published, {drafts.length} in progress.
        </p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Once a playtest is completed your report appears here — usually within 24 hours of the session."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((report) => {
            const isPublished = report.status === 'published';
            const body = (
              <Card key={report.id} className={isPublished ? 'surface-hover h-full' : 'h-full opacity-70'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-white">{report.gameName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {report.bookingReference ?? '—'} · {report.platform}
                    </p>
                  </div>
                  <Badge tone={isPublished ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30' : 'bg-amber-400/10 text-amber-300 ring-amber-400/30'}>
                    {isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-400">{report.overallImpression}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-slate-500">
                    {isPublished ? `Published ${formatDate(report.publishedAt ?? report.updatedAt)}` : 'Awaiting publication'}
                  </span>
                  <span className="text-sm font-semibold text-brand-cyan">{report.overallRating}/10</span>
                </div>
              </Card>
            );
            return isPublished ? (
              <Link key={report.id} href={`/dashboard/reports/${report.id}`} className="block h-full">
                {body}
              </Link>
            ) : (
              <div key={report.id} aria-disabled="true">
                {body}
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-white">What is in a report?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Every report covers your overall impression score, gameplay experience, mechanics, bugs discovered,
          performance, user experience and suggested improvements, plus an overall rating out of ten.
        </p>
      </Card>
    </div>
  );
}
