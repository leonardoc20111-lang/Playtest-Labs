import type { Metadata } from 'next';
import { Badge, Card } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listServices } from '@/lib/data/repos';
import { ServiceForm } from '@/components/forms/admin-forms';
import { toggleServiceActiveAction } from '@/app/actions/admin';
import { formatGBP } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin services' };

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await listServices(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Services &amp; pricing</h1>
        <p className="mt-1 text-sm text-slate-400">
          Prices, descriptions and included features are shown on the public site immediately after saving. Inactive
          services are hidden from customers but keep their existing bookings.
        </p>
      </div>

      <div className="space-y-4">
        {services.map((service) => (
          <Card key={service.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">{service.name}</h2>
                  <Badge tone={service.active ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30' : 'bg-white/5 text-slate-400 ring-white/10'}>
                    {service.active ? 'Live' : 'Hidden'}
                  </Badge>
                  <Badge tone="bg-brand-violet/15 text-brand-cyan ring-brand-violet/30">{formatGBP(service.pricePence)}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {service.tagline} · {service.durationMinutes} minute session · position {service.sortOrder}
                </p>
              </div>
              <form action={toggleServiceActiveAction}>
                <input type="hidden" name="serviceId" value={service.id} />
                <input type="hidden" name="nextActive" value={service.active ? 'false' : 'true'} />
                <Button type="submit" size="sm" variant="secondary">
                  {service.active ? 'Hide from site' : 'Publish to site'}
                </Button>
              </form>
            </div>
            <details className="mt-4 border-t border-white/5 pt-4">
              <summary className="cursor-pointer text-xs font-semibold text-brand-cyan">Edit service</summary>
              <div className="mt-4">
                <ServiceForm service={service} />
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
