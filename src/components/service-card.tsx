import Link from 'next/link';
import type { Service } from '@/lib/types';
import { formatGBP } from '@/lib/format';
import { buttonClass } from '@/components/controls';

export function ServiceCard({ service, featured = false }: { service: Service; featured?: boolean }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition duration-300 ${
        featured
          ? 'border-brand-indigo/40 bg-brand-indigo/[0.07] shadow-[0_24px_60px_-30px_rgba(106,91,255,0.9)]'
          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.16] hover:bg-white/[0.045]'
      }`}
    >
      {featured ? (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          Most popular
        </span>
      ) : null}

      <h3 className="text-lg font-semibold text-white">{service.name}</h3>
      <p className="mt-1.5 min-h-[2.5rem] text-sm leading-relaxed text-slate-400">{service.tagline}</p>

      <div className="mt-5 flex items-end gap-1.5">
        <span className="font-display text-4xl font-semibold text-white">{formatGBP(service.pricePence)}</span>
        <span className="pb-1 text-xs font-medium uppercase tracking-wider text-slate-500">one-off</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{service.durationMinutes} minutes of testing</p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {service.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm text-slate-300">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/book?service=${service.slug}`}
        className={buttonClass(featured ? 'primary' : 'secondary', 'md', 'mt-6 w-full')}
      >
        Book {service.name}
      </Link>
    </div>
  );
}
