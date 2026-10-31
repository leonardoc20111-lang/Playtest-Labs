'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonClass } from '@/components/controls';

export interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({
  links,
  signedIn,
  dashboardHref,
  bookingHref,
}: {
  links: NavLink[];
  signedIn: boolean;
  dashboardHref: string;
  bookingHref: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 top-[73px] z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav
            id="mobile-menu"
            className="relative mx-4 mt-3 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl"
          >
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
              <Link href={bookingHref} className={buttonClass('primary', 'md', 'w-full')}>
                Book a test
              </Link>
              <Link href={signedIn ? dashboardHref : '/login'} className={buttonClass('secondary', 'md', 'w-full')}>
                {signedIn ? 'Dashboard' : 'Sign in'}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
