import Link from 'next/link';
import type { ReactNode } from 'react';
import { NavLinks } from '@/components/nav-links';
import { ButtonLink, Logo } from '@/components/controls';
import { Badge } from '@/components/ui';
import { logoutAction } from '@/app/actions/auth';
import { requireUser } from '@/lib/auth';
import { countUnreadNotifications, listNotifications } from '@/lib/data/repos';
import { initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser('/dashboard');
  const [unread, notifications] = await Promise.all([
    countUnreadNotifications(user.id),
    listNotifications(user.id, 5),
  ]);

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Playtest Labs home">
              <Logo />
            </Link>
            <Badge tone="bg-brand-violet/10 text-brand-cyan ring-brand-violet/30">Customer</Badge>
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
              { href: '/dashboard', label: 'Overview' },
              { href: '/dashboard/bookings', label: 'My bookings' },
              { href: '/dashboard/reports', label: 'Reports' },
              { href: '/dashboard/payments', label: 'Payments' },
              { href: '/dashboard/reviews', label: 'Reviews' },
              { href: '/dashboard/notifications', label: 'Notifications', badge: unread || undefined },
              { href: '/dashboard/settings', label: 'Settings' },
            ]}
            exactHref="/dashboard"
          />
          <div className="mt-6 hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest</p>
            {notifications.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {notifications.slice(0, 3).map((item) => (
                  <li key={item.id} className="text-xs leading-snug text-slate-400">
                    <span className={item.readAt ? '' : 'text-slate-200'}>{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-6 hidden lg:block">
            <ButtonLink href="/book" size="sm" className="w-full">
              New booking
            </ButtonLink>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
