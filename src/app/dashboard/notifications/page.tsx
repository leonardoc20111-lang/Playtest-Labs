import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, EmptyState } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { listNotifications } from '@/lib/data/repos';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/actions/notifications';
import { relativeTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser('/dashboard/notifications');
  const notifications = await listNotifications(user.id, 50);
  const unread = notifications.filter((item) => !item.readAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-400">
            {unread.length ? `${unread.length} unread update${unread.length === 1 ? '' : 's'}` : 'You are all caught up.'}
          </p>
        </div>
        {unread.length ? (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5">
              Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="We will notify you here when a booking is accepted, payment is verified, or a report is published."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card key={item.id} className={item.readAt ? 'opacity-70' : ''}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!item.readAt ? <span className="h-2 w-2 rounded-full bg-brand-cyan" /> : null}
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.body}</p>
                  <p className="mt-1.5 text-xs text-slate-500">{relativeTime(item.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.link ? (
                    <Link href={item.link} className="text-xs font-semibold text-brand-cyan hover:text-white">
                      Open
                    </Link>
                  ) : null}
                  {!item.readAt ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-xs font-medium text-slate-500 hover:text-white">
                        Mark read
                      </button>
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
