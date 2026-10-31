import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-[0_12px_30px_-12px_rgba(106,91,255,0.8)] hover:brightness-110 active:brightness-95',
  secondary: 'border border-white/12 bg-white/[0.05] text-white hover:border-white/25 hover:bg-white/[0.09]',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  danger: 'border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
  subtle: 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.11]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm sm:text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = ''): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; size?: Size; children: ReactNode }) {
  const isExternal = href.startsWith('http');
  if (isExternal) {
    return (
      <a href={href} className={buttonClass(variant, size, className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-[0_8px_24px_-10px_rgba(106,91,255,0.9)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden="true">
          <path d="M8 15l-2.2 3.2M16 15l2.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="5" y="6" width="14" height="8.5" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 10.2h2.2M10.1 9.1v2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="15.2" cy="9.6" r="0.9" fill="currentColor" />
          <circle cx="14" cy="11.4" r="0.9" fill="currentColor" />
        </svg>
      </span>
      {!compact ? (
        <span className="font-display text-[15px] font-semibold tracking-tight text-white">
          Playtest<span className="text-brand-cyan">Labs</span>
        </span>
      ) : null}
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = '',
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({
  children,
  pending,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean; pendingLabel?: string; variant?: Variant; size?: Size }) {
  return (
    <Button type="submit" variant={variant} size={size} className={className} aria-busy={pending} {...rest}>
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Working…
        </>
      ) : (
        children
      )}
    </Button>
  );
}
