import Link from 'next/link';
import type { Metadata } from 'next';
import { listApprovedReviews, listServices } from '@/lib/data/repos';
import { formatGBP } from '@/lib/format';
import { buttonClass } from '@/components/controls';
import { ServiceCard } from '@/components/service-card';
import { SectionHeading, Stars } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Playtest Labs — Your Game. Our Testing. Better Experiences.',
  description:
    'Professional game testing for Roblox, PC, PlayStation, Xbox and mobile. Structured playtest reports with bug identification, performance notes and actionable improvements from £6.',
};

const benefits = [
  {
    title: 'Real players, real feedback',
    description:
      'Every test is performed by a vetted playtester who plays your build end-to-end and writes up what actually happened — no automated checklists.',
    icon: (
      <path d="M12 3l2.2 5.1 5.5.5-4.1 3.7 1.2 5.4L12 15l-4.8 2.7 1.2-5.4L4.3 8.6l5.5-.5L12 3z" strokeWidth="1.6" />
    ),
  },
  {
    title: 'Structured reports',
    description:
      'Twelve consistent report sections covering gameplay, mechanics, bugs, performance, UX and improvements — plus an overall score out of 10.',
    icon: <path d="M7 4h7l4 4v12H7V4zm7 0v4h4M9 12h6M9 16h6M9 8h2" strokeWidth="1.6" />,
  },
  {
    title: 'Fixed, honest pricing',
    description:
      'Transparent one-off prices from £6. No retainers, no hidden fees, no surprise minimums. Pay by Revolut when your booking is accepted.',
    icon: <path d="M12 7v10m3-8.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.5S10.2 11 12 11s3 1 3 2.5S13.7 16 12 16s-3-1.1-3-2.5" strokeWidth="1.6" />,
  },
  {
    title: 'Built for indie scale',
    description:
      'Test single mechanics or a full roadmap milestone. Retest packages keep regressions from slipping into your next update.',
    icon: <path d="M4 17V9m5 8V5m5 12v-6m5 6V7" strokeWidth="1.8" strokeLinecap="round" />,
  },
];

const process = [
  {
    step: '01',
    title: 'Pick your package',
    description: 'Choose a playtest tier that matches how much feedback you need right now.',
  },
  {
    step: '02',
    title: 'Submit your game',
    description: 'Share your game link, platform, build notes and the areas you want scrutinised.',
  },
  {
    step: '03',
    title: 'We test and record',
    description: 'Your booking is accepted, scheduled and played by an assigned tester who logs everything.',
  },
  {
    step: '04',
    title: 'Read the report',
    description: 'A structured report lands in your dashboard with bugs, performance notes and next steps.',
  },
];

const faqs = [
  {
    q: 'Which platforms do you test on?',
    a: 'We currently specialise in Roblox, and also test PC, PlayStation, Xbox and mobile builds. Choose your platform when booking — if a specific device or console generation matters, add it to your instructions.',
  },
  {
    q: 'How quickly will I get my report?',
    a: 'Most reports are published within 2–3 working days of the scheduled test. Complex titles can take longer, and we will always update your booking status so you can follow progress.',
  },
  {
    q: 'What exactly is in the report?',
    a: 'Game name, tester, platform, testing date, overall impression, gameplay experience, mechanics, bugs discovered, performance observations, user experience, suggested improvements, additional comments and an overall rating out of 10.',
  },
  {
    q: 'How do payments work?',
    a: 'Payments are handled manually through Revolut. Once your booking is accepted we send a payment request with a Revolut link. Add your Revolut reference in the dashboard and an administrator verifies it before the booking is marked paid — payments are never auto-confirmed.',
  },
  {
    q: 'Can you test an unreleased build?',
    a: 'Yes. Private builds, playtest servers and early access links are fine. We only share your build with the tester assigned to your booking and never publish your game details.',
  },
  {
    q: 'What if I need a retest after fixes?',
    a: 'The Update Retest package exists for exactly that. It checks every issue from your previous report and flags anything new introduced by your patch.',
  },
];

export default async function HomePage() {
  const [services, reviews] = await Promise.all([listServices(true), listApprovedReviews(3)]);
  const priced = services.filter((service) => service.active);
  const cheapest = priced.length ? Math.min(...priced.map((service) => service.pricePence)) : 600;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand-indigo/20 blur-[120px]" />
          <div className="absolute right-[-8rem] top-24 h-[22rem] w-[22rem] rounded-full bg-brand-violet/20 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 78%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 78%)',
            }}
          />
        </div>

        <div className="container-page pb-16 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Accepting new playtests · Roblox · PC · Console · Mobile
            </p>
            <h1 className="display-xl mt-6 text-balance">
              Your Game. Our Testing.{' '}
              <span className="gradient-text">Better Experiences.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Playtest Labs puts your game in front of real players and turns what they find into a structured,
              developer-ready report. Bugs, mechanics, performance and UX — documented, scored and actionable.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/book" className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}>
                Book a playtest
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M10.6 4.6L16 10l-5.4 5.4-1.4-1.4 3-3H4v-2h8.2l-3-3 1.4-1.4z" />
                </svg>
              </Link>
              <Link href="/services" className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}>
                View services &amp; pricing
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              From {formatGBP(cheapest)} per test · No subscription · Report delivered to your dashboard
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Report sections', value: '12' },
              { label: 'Platforms covered', value: '5' },
              { label: 'Turnaround', value: '2–3 days' },
              { label: 'Pricing from', value: formatGBP(cheapest) },
            ].map((stat) => (
              <div key={stat.label} className="surface px-4 py-4 text-center">
                <p className="font-display text-xl font-semibold text-white sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Why Playtest Labs"
          title="QA feedback you can actually ship against"
          description="Testing that reads like a colleague's review, not a checklist. Every finding is tied to what a player experiences in your build."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="surface surface-hover p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-indigo/10 text-brand-cyan ring-1 ring-inset ring-brand-indigo/25">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {benefit.icon}
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="container-page py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Services"
            title="Straightforward packages, fixed prices"
            description="Start small or go comprehensive. Every package includes a written report in your Playtest Labs dashboard."
          />
          <Link href="/services" className={buttonClass('secondary', 'md')}>
            Compare all packages
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} featured={index === 1} />
          ))}
        </div>
      </section>

      {/* Process */}
      <section id="process" className="border-y border-white/[0.06] bg-ink-900/40 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="From booking to report in four steps"
            description="No account managers, no lengthy onboarding. Submit your build, we test it, you get the write-up."
            align="center"
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {process.map((item) => (
              <li key={item.step} className="relative rounded-2xl border border-white/[0.07] bg-ink-950/60 p-6">
                <span className="font-display text-3xl font-semibold text-white/10">{item.step}</span>
                <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Testimonials"
          title="What developers say after their report"
          description="Reviews are published after a completed test and approved by our team."
        />
        {reviews.length ? (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <figure key={review.id} className="surface flex h-full flex-col p-6">
                <Stars rating={review.rating} />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">“{review.comment}”</blockquote>
                <figcaption className="mt-5 border-t border-white/[0.06] pt-4 text-xs text-slate-500">
                  <span className="font-semibold text-slate-300">{review.displayName || 'Verified developer'}</span>
                  {review.bookingReference ? <span> · {review.bookingReference}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-slate-500">
            No published reviews yet — approved customer reviews will appear here.
          </div>
        )}
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions before you book"
            description="Still unsure whether a package fits your build? Send us a message and we will tell you honestly."
          />
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            {faqs.map((faq) => (
              <details key={faq.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-white">
                  {faq.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-slate-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-4">
        <div className="relative overflow-hidden rounded-3xl border border-brand-indigo/25 bg-brand-indigo/[0.08] px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand-violet/25 blur-[100px]" />
          </div>
          <h2 className="display-lg text-balance">Ready to see your game through a player's eyes?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Create a free account, book a playtest and follow every step from request to published report.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}>
              Create an account
            </Link>
            <Link href="/contact" className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}>
              Talk to the team
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
