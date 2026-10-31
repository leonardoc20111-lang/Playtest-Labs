import Link from 'next/link';
import type { ReactNode } from 'react';
import { NavLinks } from '@/components/nav-links';
import { ButtonLink, Logo } from '@/components/controls';
import { Badge } from '@/components/ui';
import { logoutAction } from '@/app/actions/auth';
import { requireAdmin } from '@/lib/auth';
import { countUnreadNotifications, getAdminStats, listNotifications } from '@/lib/data/repos';
import { initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const [stats, notifications, unread] = await Promise.all([
    getAdminStats(),
    listNotifications(user.id, 5),
    countUnreadNotifications(user.id),
  ]);

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Playtest Labs home">
              <Logo />
            </Link>
            <Badge tone="bg-amber-400/10 text-amber-200 ring-amber-400/30">Admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M6 9a6 6 0 1112 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-violet px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                {initials(user.fullName)}
              </span>
              <span className="text-sm text-slate-300">{user.fullName}</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <NavLinks
            items={[
              { href: '/admin', label: 'Overview' },
              { href: '/admin/bookings', label: 'Bookings', badge: stats.pendingBookings || undefined },
              { href: '/admin/customers', label: 'Customers' },
              { href: '/admin/reports', label: 'Reports' },
              { href: '/admin/payments', label: 'Payments', badge: stats.awaitingVerification || undefined },
              { href: '/admin/reviews', label: 'Reviews', badge: stats.pendingReviews || undefined },
              { href: '/admin/services', label: 'Services' },
              { href: '/admin/availability', label: 'Availability' },
              { href: '/admin/testers', label: 'Testers' },
              { href: '/admin/messages', label: 'Messages' },
            ]}
            exactHref="/admin"
          />
          <div className="mt-6 hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Needs attention</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li>{stats.pendingBookings} pending request{stats.pendingBookings === 1 ? '' : 's'}</li>
              <li>{stats.awaitingVerification} payment{stats.awaitingVerification === 1 ? '' : 's'} to verify</li>
              <li>{stats.pendingReviews} review{stats.pendingReviews === 1 ? '' : 's'} to moderate</li>
            </ul>
          </div>
          <div className="mt-6 hidden lg:block">
            <ButtonLink href="/admin/bookings?status=pending" variant="secondary" size="sm" className="w-full">
              Review queue
            </ButtonLink>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
