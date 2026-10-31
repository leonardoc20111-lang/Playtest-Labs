import type { Metadata } from 'next';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listAvailability } from '@/lib/data/repos';
import { AvailabilityForm } from '@/components/forms/admin-forms';
import { deleteSlotAction, toggleSlotAction } from '@/app/actions/admin';
import { formatDate, formatTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin availability' };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminAvailabilityPage() {
  await requireAdmin();
  const from = todayISO();
  const slots = await listAvailability(from, 45);

  const groups = new Map<string, typeof slots>();
  for (const slot of slots) {
    const bucket = groups.get(slot.date) ?? [];
    bucket.push(slot);
    groups.set(slot.date, bucket);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Availability</h1>
        <p className="mt-1 text-sm text-slate-400">
          Open time slots control what customers can book. Closing a slot hides it immediately; bookings already accepted
          are unaffected.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white">Add or update a slot</h2>
        <p className="mt-1 text-xs text-slate-500">
          Adding a slot with the same date and start time updates the existing entry instead of duplicating it.
        </p>
        <div className="mt-4">
          <AvailabilityForm />
        </div>
      </Card>

      {slots.length === 0 ? (
        <EmptyState
          title="No upcoming slots"
          description="Customers can only choose dates and times you have opened here. Add your first slot above."
        />
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([date, daySlots]) => (
            <Card key={date} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">{formatDate(date)}</h2>
                <span className="text-xs text-slate-500">{daySlots.filter((slot) => slot.isOpen).length} open</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </p>
                      <Badge
                        tone={
                          slot.isOpen
                            ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30'
                            : 'bg-white/5 text-slate-400 ring-white/10'
                        }
                      >
                        {slot.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {slot.booked ?? 0} / {slot.capacity} booked
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={toggleSlotAction}>
                        <input type="hidden" name="slotId" value={slot.id} />
                        <input type="hidden" name="isOpen" value={slot.isOpen ? 'false' : 'true'} />
                        <Button type="submit" size="sm" variant="secondary">
                          {slot.isOpen ? 'Close slot' : 'Reopen slot'}
                        </Button>
                      </form>
                      <form action={deleteSlotAction}>
                        <input type="hidden" name="slotId" value={slot.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
