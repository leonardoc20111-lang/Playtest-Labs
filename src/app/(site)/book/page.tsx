import type { Metadata } from 'next';
import { BookingForm, type AvailabilityDay } from '@/components/forms/booking-form';
import { Card, SectionHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { formatGBP } from '@/lib/format';
import { listOpenAvailability, listServices } from '@/lib/data/repos';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Book a playtest',
  description: 'Choose a Playtest Labs package, pick a slot and send us your game for testing.',
};

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

function slotTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date(Date.UTC(2024, 0, 1, hours ?? 0, minutes ?? 0));
  return timeFormatter.format(date);
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const user = await requireUser('/book');
  const { service: serviceSlug } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const [services, slots] = await Promise.all([listServices(true), listOpenAvailability(today, 21)]);

  const byDate = new Map<string, AvailabilityDay>();
  for (const slot of slots) {
    const remaining = Math.max(slot.capacity - (slot.booked ?? 0), 0);
    if (remaining <= 0) continue;
    const entry =
      byDate.get(slot.date) ??
      ({
        date: slot.date,
        label: dayFormatter.format(new Date(`${slot.date}T12:00:00Z`)),
        slots: [],
      } satisfies AvailabilityDay);
    entry.slots.push({ time: slot.startTime, label: slotTime(slot.startTime), remaining });
    byDate.set(slot.date, entry);
  }
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const serviceOptions = services.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    tagline: item.tagline,
    pricePence: item.pricePence,
    durationMinutes: item.durationMinutes,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="New booking"
        title="Book your playtest"
        description="Tell us about your game and pick a slot. A tester reviews the request, confirms the time and sends a Revolut payment link — nothing is charged automatically."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="p-6 sm:p-8">
          <BookingForm
            services={serviceOptions}
            days={days}
            initialService={serviceSlug}
            defaults={{ contactName: user.fullName, contactEmail: user.email }}
          />
        </Card>

        <aside className="space-y-5">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-white">What happens next</h3>
            <ol className="mt-4 space-y-4 text-sm text-slate-400">
              {[
                'You receive an instant booking reference and the request appears in your dashboard.',
                'A tester accepts or proposes a new time — you get an in-app notification.',
                'We send a Revolut link. Submit your reference and we verify the payment manually.',
                'Testing runs, your report is written and then published to your dashboard.',
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-violet/15 text-xs font-semibold text-brand-cyan">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-white">Packages</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {services.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 text-slate-300">
                  <span>
                    {item.name}
                    <span className="block text-xs text-slate-500">{item.durationMinutes} min</span>
                  </span>
                  <span className="font-semibold text-white">{formatGBP(item.pricePence)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">Need a custom scope? Contact us for a quote before booking.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
