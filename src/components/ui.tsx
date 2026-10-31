import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'bg-white/5 text-slate-300 ring-white/10',
  className = '',
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`surface p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <h2 className="display-lg text-balance">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-slate-400">{description}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-indigo/10 text-brand-cyan ring-1 ring-inset ring-brand-indigo/25">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M12 8v8m-4-4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = 'text-white',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="surface surface-hover p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${accent}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <svg
          key={index}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={index <= Math.round(rating) ? 'text-amber-300' : 'text-white/15'}
          fill="currentColor"
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.22l-4.94 2.6.94-5.5-4-3.9 5.53-.81L10 1.6z" />
        </svg>
      ))}
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(10, score)) * 10;
  return (
    <div
      className="relative flex h-20 w-20 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#6A5BFF ${pct}%, rgba(255,255,255,0.08) ${pct}% 100%)`,
      }}
      aria-label={`Overall rating ${score} out of 10`}
    >
      <div className="flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-ink-900">
        <span className="font-display text-xl font-semibold text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">/ 10</span>
      </div>
    </div>
  );
}

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'error' | 'warning';
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: 'border-brand-indigo/25 bg-brand-indigo/10 text-slate-200',
    success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
    warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>{children}</div>;
}

export function ProgressSteps({ current, steps }: { current: number; steps: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={
                state === 'done'
                  ? 'flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
                  : state === 'current'
                    ? 'flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-white'
                    : 'flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-slate-500 ring-1 ring-inset ring-white/10'
              }
            >
              {state === 'done' ? '✓' : index + 1}
            </span>
            <span className={state === 'todo' ? 'text-slate-500' : 'text-slate-300'}>{step}</span>
            {index < steps.length - 1 ? <span className="mx-1 h-px w-5 bg-white/10" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
