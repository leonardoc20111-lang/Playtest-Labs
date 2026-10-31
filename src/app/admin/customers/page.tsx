import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listCustomers } from '@/lib/data/repos';
import { formatDate, formatGBP, initials } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin customers' };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const search = q?.trim() ?? '';
  const customers = await listCustomers(search || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Customers</h1>
        <p className="mt-1 text-sm text-slate-400">
          {customers.length} account{customers.length === 1 ? '' : 's'} with a customer role.
        </p>
      </div>

      <Card className="p-4">
        <form action="/admin/customers" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor="customer-q">
              Search customers
            </label>
            <input
              id="customer-q"
              name="q"
              defaultValue={search}
              className="field-input"
              placeholder="Name, email or company"
            />
          </div>
          <Button type="submit">Search</Button>
          {search ? (
            <Link href="/admin/customers" className="px-2 py-2.5 text-sm text-slate-400 transition hover:text-white">
              Reset
            </Link>
          ) : null}
        </form>
      </Card>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Customer accounts appear here as soon as someone registers on the site."
        />
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <Card key={customer.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {initials(customer.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{customer.fullName}</p>
                    <p className="truncate text-xs text-slate-400">{customer.email}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {customer.company ? `${customer.company} · ` : ''}joined {formatDate(customer.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{customer.bookingCount}</p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-300">{formatGBP(customer.spentPence)}</p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Paid</p>
                  </div>
                  <Badge tone="bg-white/5 text-slate-300 ring-white/10">{customer.role}</Badge>
                  <Link
                    href={`/admin/bookings?q=${encodeURIComponent(customer.email)}`}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                  >
                    View bookings →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
