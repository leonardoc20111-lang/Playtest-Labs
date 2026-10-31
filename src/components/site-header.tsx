import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { Logo, buttonClass } from '@/components/controls';
import { MobileNav, type NavLink } from '@/components/mobile-nav';
import { logoutAction } from '@/app/actions/auth';

const links: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services & Pricing' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/contact', label: 'Contact' },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const dashboardHref = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="container-page flex h-[73px] items-center justify-between gap-4">
        <Link href="/" aria-label="Playtest Labs home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link href={dashboardHref} className={buttonClass('secondary', 'md')}>
                Dashboard
              </Link>
              <form action={logoutAction}>
                <button type="submit" className={buttonClass('ghost', 'md')}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass('ghost', 'md')}>
                Sign in
              </Link>
              <Link href="/book" className={buttonClass('primary', 'md')}>
                Book a test
              </Link>
            </>
          )}
        </div>

        <MobileNav links={links} signedIn={Boolean(user)} dashboardHref={dashboardHref} bookingHref="/book" />
      </div>
    </header>
  );
}
