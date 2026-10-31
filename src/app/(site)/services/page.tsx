import type { Metadata } from 'next';
import Link from 'next/link';
import { listServices } from '@/lib/data/repos';
import { formatGBP } from '@/lib/format';
import { buttonClass } from '@/components/controls';
import { ServiceCard } from '@/components/service-card';
import { SectionHeading } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Services & Pricing',
  description:
    'Playtest packages from £6: Standard Playtest £7, Extended Playtest £12, Comprehensive Review £18 and Update Retest £6. Fixed pricing, written reports, all major platforms.',
};

const comparison = [
  { feature: 'Written feedback report', values: [true, true, true, true] },
  { feature: 'Playtime included', values: ['20 min', '40 min', '60 min', '20 min'] },
  { feature: 'Bug identification', values: ['Basic', 'Detailed', 'Detailed', 'Regression check'] },
  { feature: 'Mechanics & progression analysis', values: [false, true, true, false] },
  { feature: 'Performance observations', values: [false, true, true, true] },
  { feature: 'User experience assessment', values: [false, false, true, false] },
  { feature: 'Improvement suggestions', values: [false, true, true, true] },
  { feature: 'Overall rating out of 10', values: [true, true, true, true] },
  { feature: 'Report published to dashboard', values: [true, true, true, true] },
];

export default async function ServicesPage() {
  const services = await listServices(false);

  return (
    <>
      <section className="border-b border-white/[0.06]">
        <div className="container-page py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow mx-auto">Services &amp; pricing</p>
            <h1 className="display-xl mt-6 text-balance">
              Simple packages. <span className="gradient-text">Serious feedback.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
              Every package is a one-off purchase with a structured written report. No subscriptions, no minimum
              contract — pick the depth of testing your build needs right now.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              {['Roblox', 'PC', 'PlayStation', 'Xbox', 'Mobile'].map((platform) => (
                <span key={platform} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} featured={index === 1 && service.active} />
          ))}
        </div>
        {services.some((service) => !service.active) ? (
          <p className="mt-4 text-xs text-slate-500">
            Some packages are temporarily unavailable. Unavailable services cannot be booked until an administrator
            re-enables them.
          </p>
        ) : null}
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/40 py-14 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Compare"
            title="What is included in each package"
            description="All reports follow the same twelve-section structure — the difference is how much testing time and analysis goes into them."
          />
          <div className="table-wrap mt-10">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-[34%]">Included</th>
                  {services.map((service) => (
                    <th key={service.id} className="text-center">
                      <span className="block text-white">{service.name}</span>
                      <span className="mt-1 block font-display text-base font-semibold text-brand-cyan">
                        {formatGBP(service.pricePence)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature}>
                    <td className="font-medium text-slate-200">{row.feature}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.feature}-${index}`} className="text-center">
                        {value === true ? (
                          <span className="text-emerald-400" aria-label="Included">
                            ✓
                          </span>
                        ) : value === false ? (
                          <span className="text-slate-600" aria-label="Not included">
                            —
                          </span>
                        ) : (
                          <span className="text-slate-300">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="surface p-6">
            <h3 className="text-base font-semibold text-white">Booking &amp; scheduling</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Choose a preferred date and time. Slots have a limited capacity, so once a slot is full it is removed from
              the booking form — this prevents double-booking.
            </p>
          </div>
          <div className="surface p-6">
            <h3 className="text-base font-semibold text-white">Payment by Revolut</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Payments are collected manually through Revolut. When your booking is accepted, a payment request appears
              in your dashboard with a Revolut link. Add your reference and an administrator verifies it.
            </p>
          </div>
          <div className="surface p-6">
            <h3 className="text-base font-semibold text-white">Need something custom?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Larger studios, recurring contracts and multi-platform releases can be quoted individually.
            </p>
            <Link href="/contact" className={buttonClass('secondary', 'sm', 'mt-4')}>
              Request a quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
