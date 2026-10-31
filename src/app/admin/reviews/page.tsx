import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState, Stars } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listReviews } from '@/lib/data/repos';
import { moderateReviewAction } from '@/app/actions/admin';
import { formatDateTime, reviewStatusTone } from '@/lib/format';
import type { ReviewStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin reviews' };

const FILTERS: Array<{ key: 'all' | ReviewStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const active = FILTERS.find((filter) => filter.key === params.status)?.key ?? 'all';
  const reviews = await listReviews(active === 'all' ? undefined : active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Reviews</h1>
        <p className="mt-1 text-sm text-slate-400">
          Approve reviews to show them as testimonials across the public site. Only approved reviews appear publicly.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={filter.key === 'all' ? '/admin/reviews' : `/admin/reviews?status=${filter.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              active === filter.key
                ? 'bg-brand-gradient text-white'
                : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews here"
          description="Customers can leave a review once a booking is marked completed."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    <Badge tone={reviewStatusTone[review.status]}>{review.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    “{review.comment}”
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {review.displayName ?? review.customerName ?? 'Customer'} · booking {review.bookingReference ?? '—'} ·{' '}
                    {formatDateTime(review.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {review.status !== 'approved' ? (
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                  ) : null}
                  {review.status !== 'rejected' ? (
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button type="submit" size="sm" variant="secondary">
                        Reject
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
