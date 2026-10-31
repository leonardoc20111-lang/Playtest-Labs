import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/config';
import { Logo } from '@/components/controls';

const columns = [
  {
    title: 'Services',
    links: [
      { href: '/services', label: 'Playtest packages' },
      { href: '/book', label: 'Book a test' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Platforms',
    links: [
      { href: '/services', label: 'Roblox' },
      { href: '/services', label: 'PC' },
      { href: '/services', label: 'PlayStation' },
      { href: '/services', label: 'Xbox & Mobile' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/register', label: 'Create account' },
      { href: '/dashboard', label: 'Customer dashboard' },
      { href: '/contact', label: 'Contact support' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-950/60">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Your Game. Our Testing. Better Experiences. Structured playtests and honest, actionable QA feedback for
              indie developers and studios.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-flex text-sm font-medium text-brand-cyan hover:text-white"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link href={link.href} className="text-sm text-slate-400 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Playtest Labs. All rights reserved.</p>
          <p>
            Manual Revolut payment tracking · Testing delivered by vetted playtesters · United Kingdom
          </p>
        </div>
      </div>
    </footer>
  );
}
