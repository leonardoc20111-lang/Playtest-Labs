import type { BookingStatus, PaymentStatus, ReportStatus, ReviewStatus } from '@/lib/types';

export function formatGBP(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(value: string): string {
  const [hours, minutes] = value.split(':');
  return `${hours}:${minutes}`;
}

export function relativeTime(value: string): string {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return '—';
  const diff = Date.now() - date;
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  return formatDate(value);
}

export const bookingStatusLabel: Record<BookingStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const bookingStatusTone: Record<BookingStatus, string> = {
  pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  accepted: 'bg-brand-blue/10 text-brand-cyan ring-brand-blue/30',
  in_progress: 'bg-brand-violet/10 text-brand-violet ring-brand-violet/30',
  completed: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  cancelled: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  payment_requested: 'Payment Requested',
  awaiting_verification: 'Awaiting Verification',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const paymentStatusTone: Record<PaymentStatus, string> = {
  unpaid: 'bg-white/5 text-slate-300 ring-white/10',
  payment_requested: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  awaiting_verification: 'bg-brand-blue/10 text-brand-cyan ring-brand-blue/30',
  paid: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  refunded: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
};

export const reportStatusTone: Record<ReportStatus, string> = {
  draft: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  published: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
};

export const reviewStatusTone: Record<ReviewStatus, string> = {
  pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  approved: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  rejected: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
};

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
