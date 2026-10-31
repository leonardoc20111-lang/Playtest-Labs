import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listAllAssignments, listTesters } from '@/lib/data/repos';
import { TesterForm } from '@/components/forms/admin-forms';
import { setTesterRoleAction } from '@/app/actions/admin';
import { formatDate, initials } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin testers' };

export default async function AdminTestersPage() {
  await requireAdmin();
  const [testers, assignments] = await Promise.all([listTesters(), listAllAssignments()]);

  const workload = new Map<string, number>();
  for (const assignment of assignments) {
    workload.set(assignment.testerId, (workload.get(assignment.testerId) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Testers</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tester accounts can be assigned to bookings. Testers sign in with the email and password you set here.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white">Create a tester account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Share the temporary password with the tester and ask them to change it from their settings page.
        </p>
        <div className="mt-4">
          <TesterForm />
        </div>
      </Card>

      {testers.length === 0 ? (
        <EmptyState
          title="No testers yet"
          description="Create your first tester account above, then assign them to bookings from the booking detail page."
        />
      ) : (
        <div className="space-y-3">
          {testers.map((tester) => (
            <Card key={tester.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {initials(tester.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{tester.fullName}</p>
                    <p className="truncate text-xs text-slate-400">{tester.email}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Added {formatDate(tester.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="bg-brand-violet/15 text-brand-cyan ring-brand-violet/30">
                    {workload.get(tester.id) ?? 0} assignments
                  </Badge>
                  <form action={setTesterRoleAction}>
                    <input type="hidden" name="profileId" value={tester.id} />
                    <input type="hidden" name="role" value="customer" />
                    <Button type="submit" size="sm" variant="ghost">
                      Move to customers
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Need a report from a tester? Open a booking from{' '}
        <Link href="/admin/bookings" className="text-brand-cyan hover:text-white">
          Booking management
        </Link>{' '}
        and write the report there.
      </p>
    </div>
  );
}
