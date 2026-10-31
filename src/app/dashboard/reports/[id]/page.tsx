import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Card, ScoreRing } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getReportById } from '@/lib/data/repos';
import { formatDate, formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const report = await getReportById((await params).id);
  return { title: report ? `${report.gameName} report` : 'Report' };
}

const SECTIONS: Array<{ key: keyof ReportBody; title: string; icon: string }> = [
  { key: 'overallImpression', title: 'Overall impression', icon: '★' },
  { key: 'gameplayExperience', title: 'Gameplay experience', icon: '◆' },
  { key: 'gameMechanics', title: 'Game mechanics', icon: '⚙' },
  { key: 'bugsDiscovered', title: 'Bugs discovered', icon: '⚠' },
  { key: 'performanceObservations', title: 'Performance observations', icon: '⚡' },
  { key: 'userExperience', title: 'User experience', icon: '☺' },
  { key: 'suggestedImprovements', title: 'Suggested improvements', icon: '↑' },
  { key: 'additionalComments', title: 'Additional comments', icon: '✎' },
];

interface ReportBody {
  overallImpression: string;
  gameplayExperience: string;
  gameMechanics: string;
  bugsDiscovered: string;
  performanceObservations: string;
  userExperience: string;
  suggestedImprovements: string;
  additionalComments: string | null;
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser('/dashboard/reports');
  const { id } = await params;
  const report = await getReportById(id);

  if (!report || report.customerId !== user.id) notFound();
  if (report.status !== 'published') {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/reports" className="text-xs font-medium text-slate-500 hover:text-brand-cyan">
          ← Back to reports
        </Link>
        <Card>
          <h1 className="font-display text-xl font-semibold text-white">Report not published yet</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your tester is still finishing this report. It becomes available the moment it is published.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/reports" className="text-xs font-medium text-slate-500 hover:text-brand-cyan">
          ← Back to reports
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">{report.gameName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {report.platform} · tested by {report.testerName} · {formatDate(report.testingDate)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Booking <span className="font-mono text-slate-400">{report.bookingReference ?? '—'}</span> · published{' '}
              {formatDateTime(report.publishedAt ?? report.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ScoreRing score={report.overallRating} />
            <div>
              <Badge tone="bg-emerald-400/10 text-emerald-300 ring-emerald-400/30">Published</Badge>
              <p className="mt-2 text-xs text-slate-500">Overall rating</p>
              <p className="font-display text-lg font-semibold text-white">{report.overallRating}/10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const value = report[section.key];
          if (!value) return null;
          return (
            <Card key={section.key as string} className="h-full">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-indigo/15 text-xs text-brand-cyan">
                  {section.icon}
                </span>
                <h2 className="text-sm font-semibold text-white">{section.title}</h2>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{value}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white">Report summary</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Game', report.gameName],
            ['Tester', report.testerName],
            ['Platform', report.platform],
            ['Testing date', formatDate(report.testingDate)],
            ['Rating', `${report.overallRating}/10`],
            ['Created', formatDateTime(report.createdAt)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm text-slate-200">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-slate-500">
          Found this useful? Leave a review from your booking page — approved reviews help other developers.
        </p>
      </Card>
    </div>
  );
}
