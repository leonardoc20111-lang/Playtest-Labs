'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

export function NavLinks({ items, exactHref }: { items: NavItem[]; exactHref?: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Dashboard">
      {items.map((item) => {
        const active =
          pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== exactHref);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              active
                ? 'bg-white/[0.08] text-white ring-1 ring-inset ring-white/10'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-brand-violet/20 px-2 py-0.5 text-[11px] font-semibold text-brand-cyan">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
