import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState, Stars } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getReviewByBookingId, listBookings, listReviewsForCustomer } from '@/lib/data/repos';
import { formatDate, reviewStatusTone } from '@/lib/format';
import { ReviewForm } from '@/components/forms/review-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Reviews' };

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting moderation',
  approved: 'Published',
  rejected: 'Not published',
};

export default async function CustomerReviewsPage() {
  const user = await requireUser('/dashboard/reviews');
  const [reviews, bookings] = await Promise.all([
    listReviewsForCustomer(user.id),
    listBookings({ customerId: user.id, limit: 200 }),
  ]);

  const completed = bookings.filter((booking) => booking.status === 'completed');
  const reviewed = await Promise.all(
    completed.map(async (booking) => ({ booking, review: await getReviewByBookingId(booking.id) })),
  );
  const awaitingReview = reviewed.filter((row) => !row.review);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Reviews</h1>
        <p className="mt-1 text-sm text-slate-400">
          Reviews are moderated by our team before they appear on the public site.
        </p>
      </div>

      {awaitingReview.length ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white">Awaiting your review</h2>
          {awaitingReview.map(({ booking }) => (
            <Card key={booking.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{booking.gameName}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">{booking.reference}</p>
                </div>
                <Link href={`/dashboard/bookings/${booking.reference}`} className="text-xs font-semibold text-brand-cyan hover:text-white">
                  Open booking
                </Link>
              </div>
              <div className="mt-4">
                <ReviewForm bookingId={booking.id} defaultName={user.displayName ?? ''} />
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white">Your submitted reviews</h2>
        {reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Once a booking is completed you can rate the playtest from 1 to 5 stars."
          />
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Stars rating={review.rating} size={16} />
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{review.comment}</p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {review.bookingReference ?? '—'} · submitted {formatDate(review.createdAt)}
                  </p>
                </div>
                <Badge tone={reviewStatusTone[review.status]}>{STATUS_LABEL[review.status] ?? review.status}</Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
